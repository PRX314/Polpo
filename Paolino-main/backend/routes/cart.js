const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { auth } = require('../middlewares/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    
    if (!cart) {
      return res.json({ cart: null, totalItems: 0, totalPrice: 0 });
    }

    res.json({
      cart,
      totalItems: cart.totalItems,
      totalPrice: cart.totalPrice
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Server error fetching cart' });
  }
});

router.post('/add', auth, async (req, res) => {
  try {
    const { productId, variantId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const variant = product.variants.id(variantId);
    if (!variant) {
      return res.status(404).json({ message: 'Product variant not found' });
    }

    if (variant.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    let cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
    }

    const variantData = {
      size: variant.size,
      color: variant.color,
      sku: variant.sku
    };

    const price = product.basePrice + variant.priceModifier;
    cart.addItem(productId, variantData, price, quantity);
    
    await cart.save();
    await cart.populate('items.product');

    res.json({
      message: 'Item added to cart',
      cart,
      totalItems: cart.totalItems,
      totalPrice: cart.totalPrice
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Server error adding to cart' });
  }
});

router.put('/update/:itemId', auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    
    if (quantity < 0) {
      return res.status(400).json({ message: 'Quantity cannot be negative' });
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    if (quantity > 0) {
      const product = await Product.findById(item.product);
      const variant = product.variants.find(v => v.sku === item.variant.sku);
      
      if (variant.stock < quantity) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }
    }

    cart.updateItemQuantity(req.params.itemId, quantity);
    await cart.save();
    await cart.populate('items.product');

    res.json({
      message: 'Cart updated successfully',
      cart,
      totalItems: cart.totalItems,
      totalPrice: cart.totalPrice
    });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ message: 'Server error updating cart' });
  }
});

router.delete('/remove/:itemId', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.removeItem(req.params.itemId);
    await cart.save();
    await cart.populate('items.product');

    res.json({
      message: 'Item removed from cart',
      cart,
      totalItems: cart.totalItems,
      totalPrice: cart.totalPrice
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ message: 'Server error removing from cart' });
  }
});

router.delete('/clear', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.clearCart();
    await cart.save();

    res.json({
      message: 'Cart cleared successfully',
      cart,
      totalItems: 0,
      totalPrice: 0
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: 'Server error clearing cart' });
  }
});

module.exports = router;