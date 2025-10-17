const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { adminAuth } = require('../middlewares/auth');
const stripeService = require('../services/stripe');

const router = express.Router();

router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      pendingOrders,
      totalRevenue,
      recentOrders
    ] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.find()
        .populate('user', 'firstName lastName email')
        .populate('items.product', 'name')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    res.json({
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        pendingOrders,
        totalRevenue: totalRevenue[0]?.total || 0
      },
      recentOrders
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Server error fetching dashboard data' });
  }
});

router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    let query = { role: 'customer' };
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

router.patch('/users/:id/status', adminAuth, async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Server error updating user status' });
  }
});

router.get('/products', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category } = req.query;
    
    let query = {};
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error fetching products for admin:', error);
    res.status(500).json({ message: 'Server error fetching products' });
  }
});

router.get('/orders', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    
    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.firstName': { $regex: search, $options: 'i' } },
        { 'shippingAddress.lastName': { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(query)
      .populate('user', 'firstName lastName email')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error fetching orders for admin:', error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
});

router.patch('/orders/:id/status', adminAuth, async (req, res) => {
  try {
    const { status, trackingNumber } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    if (status === 'shipped' && !order.shippedAt) {
      order.shippedAt = new Date();
    }

    if (status === 'delivered' && !order.deliveredAt) {
      order.deliveredAt = new Date();
    }

    await order.save();

    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error updating order status' });
  }
});

router.post('/orders/:id/refund', adminAuth, async (req, res) => {
  try {
    const { amount } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.canRefund()) {
      return res.status(400).json({ message: 'Order cannot be refunded' });
    }

    if (order.stripePaymentIntentId) {
      const refund = await stripeService.refundPayment(order.stripePaymentIntentId, amount);
      
      order.status = 'refunded';
      order.paymentStatus = 'refunded';
      await order.save();

      for (const item of order.items) {
        const product = await Product.findById(item.product);
        const variant = product.variants.find(v => v.sku === item.variant.sku);
        variant.stock += item.quantity;
        await product.save();
      }

      res.json({
        message: 'Refund processed successfully',
        refund,
        order
      });
    } else {
      return res.status(400).json({ message: 'No payment information found for this order' });
    }
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ message: 'Server error processing refund' });
  }
});

router.get('/analytics', adminAuth, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let dateFilter = new Date();
    switch (period) {
      case '7d':
        dateFilter.setDate(dateFilter.getDate() - 7);
        break;
      case '30d':
        dateFilter.setDate(dateFilter.getDate() - 30);
        break;
      case '90d':
        dateFilter.setDate(dateFilter.getDate() - 90);
        break;
      default:
        dateFilter.setDate(dateFilter.getDate() - 30);
    }

    const [salesData, topProducts, orderStatusData] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: dateFilter }, paymentStatus: 'paid' } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            totalSales: { $sum: "$total" },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      Order.aggregate([
        { $match: { createdAt: { $gte: dateFilter }, paymentStatus: 'paid' } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            totalQuantity: { $sum: '$items.quantity' },
            totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
          }
        },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
        { $unwind: '$product' },
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 }
      ]),

      Order.aggregate([
        { $match: { createdAt: { $gte: dateFilter } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      salesData,
      topProducts,
      orderStatusData
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
});

module.exports = router;