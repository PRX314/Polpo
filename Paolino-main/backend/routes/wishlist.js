const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const { auth } = require('../middlewares/auth');

const router = express.Router();

// Get user's wishlist
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'wishlist',
        populate: {
          path: 'variants',
          select: 'size color stock priceModifier'
        }
      });

    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    res.json({
      success: true,
      data: {
        wishlist: user.wishlist || []
      }
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ message: 'Errore del server' });
  }
});

// Add product to wishlist
router.post('/add/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Prodotto non trovato' });
    }

    // Find user and update wishlist
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    // Check if product is already in wishlist
    if (user.wishlist.includes(productId)) {
      return res.status(400).json({ message: 'Prodotto già nei preferiti' });
    }

    // Add to wishlist
    user.wishlist.push(productId);
    await user.save();

    res.json({
      success: true,
      message: 'Prodotto aggiunto ai preferiti'
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ message: 'Errore del server' });
  }
});

// Remove product from wishlist
router.delete('/remove/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    // Remove from wishlist
    user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
    await user.save();

    res.json({
      success: true,
      message: 'Prodotto rimosso dai preferiti'
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ message: 'Errore del server' });
  }
});

// Toggle product in wishlist (add if not present, remove if present)
router.post('/toggle/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Prodotto non trovato' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    const isInWishlist = user.wishlist.includes(productId);

    if (isInWishlist) {
      // Remove from wishlist
      user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
      await user.save();
      
      res.json({
        success: true,
        message: 'Prodotto rimosso dai preferiti',
        inWishlist: false
      });
    } else {
      // Add to wishlist
      user.wishlist.push(productId);
      await user.save();
      
      res.json({
        success: true,
        message: 'Prodotto aggiunto ai preferiti',
        inWishlist: true
      });
    }
  } catch (error) {
    console.error('Toggle wishlist error:', error);
    res.status(500).json({ message: 'Errore del server' });
  }
});

// Check if product is in user's wishlist
router.get('/check/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    const inWishlist = user.wishlist.includes(productId);

    res.json({
      success: true,
      data: {
        inWishlist
      }
    });
  } catch (error) {
    console.error('Check wishlist error:', error);
    res.status(500).json({ message: 'Errore del server' });
  }
});

module.exports = router;