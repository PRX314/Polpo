const express = require('express');
const Product = require('../models/Product');
const { adminAuth } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const { validateRequest, productSchema } = require('../middlewares/validation');
const stripeService = require('../services/stripe');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const query = { isActive: true };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find(query)
      .sort(sort)
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
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error fetching products' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error fetching categories' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isActive: true });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Server error fetching product' });
  }
});

router.post('/', adminAuth, upload.array('images', 5), validateRequest(productSchema), async (req, res) => {
  try {
    const productData = req.body;
    
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map((file, index) => ({
        url: `/uploads/products/${file.filename}`,
        alt: `${productData.name} - Image ${index + 1}`,
        isPrimary: index === 0
      }));
    }

    const product = new Product(productData);
    await product.save();

    try {
      const stripeProduct = await stripeService.createProduct(product);
      const stripePrice = await stripeService.createPrice(stripeProduct.id, product.basePrice);
      
      product.stripeProductId = stripeProduct.id;
      product.stripePriceId = stripePrice.id;
      await product.save();
    } catch (stripeError) {
      console.error('Stripe integration error:', stripeError);
    }

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Server error creating product' });
  }
});

router.put('/:id', adminAuth, upload.array('images', 5), async (req, res) => {
  try {
    const productData = req.body;
    
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file, index) => ({
        url: `/uploads/products/${file.filename}`,
        alt: `${productData.name || existingProduct.name} - Image ${index + 1}`,
        isPrimary: index === 0 && !existingProduct.images.some(img => img.isPrimary)
      }));
      
      productData.images = [...(existingProduct.images || []), ...newImages];
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      productData,
      { new: true, runValidators: true }
    );

    if (product.stripeProductId) {
      try {
        await stripeService.updateProduct(product.stripeProductId, product);
      } catch (stripeError) {
        console.error('Stripe update error:', stripeError);
      }
    }

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Server error updating product' });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error deleting product' });
  }
});

router.patch('/:id/stock', adminAuth, async (req, res) => {
  try {
    const { variantId, stock } = req.body;
    
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const variant = product.variants.id(variantId);
    if (!variant) {
      return res.status(404).json({ message: 'Variant not found' });
    }

    variant.stock = stock;
    await product.save();

    res.json({
      message: 'Stock updated successfully',
      variant
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ message: 'Server error updating stock' });
  }
});

module.exports = router;