const express = require('express');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { auth, adminAuth } = require('../middlewares/auth');
const stripeService = require('../services/stripe');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const orders = await Order.find({ user: req.user.id })
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments({ user: req.user.id });

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    }).populate('items.product', 'name images');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Server error fetching order' });
  }
});

router.post('/create', auth, async (req, res) => {
  try {
    const { shippingAddress, billingAddress } = req.body;

    if (!shippingAddress || !shippingAddress.firstName || !shippingAddress.lastName || 
        !shippingAddress.street || !shippingAddress.city || !shippingAddress.postalCode || 
        !shippingAddress.country) {
      return res.status(400).json({ message: 'Complete shipping address is required' });
    }

    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const orderItems = [];
    let hasStockIssues = false;
    const stockIssues = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      const variant = product.variants.find(v => v.sku === item.variant.sku);

      if (!variant || variant.stock < item.quantity) {
        hasStockIssues = true;
        stockIssues.push({
          product: product.name,
          variant: `${item.variant.size} - ${item.variant.color}`,
          requested: item.quantity,
          available: variant ? variant.stock : 0
        });
        continue;
      }

      orderItems.push({
        product: item.product._id,
        variant: item.variant,
        quantity: item.quantity,
        price: item.price,
        name: item.product.name,
        image: item.product.images?.[0]?.url
      });
    }

    if (hasStockIssues) {
      return res.status(400).json({ 
        message: 'Some items are out of stock',
        stockIssues
      });
    }

    const order = new Order({
      user: req.user.id,
      items: orderItems,
      shippingAddress,
      billingAddress: billingAddress || { ...shippingAddress, sameAsShipping: true },
      subtotal: cart.totalPrice,
      shippingCost: 5.00,
      tax: 0,
      total: cart.totalPrice + 5.00
    });

    order.calculateTotals();
    await order.save();

    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      const variant = product.variants.find(v => v.sku === item.variant.sku);
      variant.stock -= item.quantity;
      await product.save();
    }

    cart.clearCart();
    await cart.save();

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server error creating order' });
  }
});

router.post('/payment-intent', auth, async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findOne({ _id: orderId, user: req.user.id });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Order already paid' });
    }

    const paymentIntent = await stripeService.createPaymentIntent(
      order.total,
      'eur',
      {
        orderId: order._id.toString(),
        userId: req.user.id.toString(),
        orderNumber: order.orderNumber
      }
    );

    order.stripePaymentIntentId = paymentIntent.id;
    await order.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ message: 'Server error creating payment intent' });
  }
});

router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripeService.constructEvent(req.body, sig);

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        const order = await Order.findOne({ stripePaymentIntentId: paymentIntent.id });
        
        if (order) {
          order.paymentStatus = 'paid';
          order.status = 'paid';
          await order.save();
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        const failedOrder = await Order.findOne({ stripePaymentIntentId: failedPayment.id });
        
        if (failedOrder) {
          failedOrder.paymentStatus = 'failed';
          await failedOrder.save();
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({received: true});
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send('Webhook Error');
  }
});

router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.canCancel()) {
      return res.status(400).json({ message: 'Order cannot be cancelled' });
    }

    order.status = 'cancelled';
    await order.save();

    for (const item of order.items) {
      const product = await Product.findById(item.product);
      const variant = product.variants.find(v => v.sku === item.variant.sku);
      variant.stock += item.quantity;
      await product.save();
    }

    res.json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Server error cancelling order' });
  }
});

module.exports = router;