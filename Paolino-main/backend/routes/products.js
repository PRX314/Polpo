const express = require('express');
const Product = require('../models/Product');
const { adminAuth } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const { validateRequest, productSchema } = require('../middlewares/validation');
const stripeService = require('../services/stripe');
const { deleteImage, deleteMultipleImages } = require('../services/cloudinary');

const router = express.Router();

// Middleware per parsare i campi JSON da FormData
const parseFormDataJSON = (req, res, next) => {
  if (req.body.variants && typeof req.body.variants === 'string') {
    try {
      req.body.variants = JSON.parse(req.body.variants);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid variants format' });
    }
  }

  if (req.body.tags && typeof req.body.tags === 'string') {
    try {
      req.body.tags = JSON.parse(req.body.tags);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid tags format' });
    }
  }

  // Converti isActive da stringa a booleano
  if (req.body.isActive && typeof req.body.isActive === 'string') {
    req.body.isActive = req.body.isActive === 'true';
  }

  // Converti numeri da stringhe
  if (req.body.basePrice && typeof req.body.basePrice === 'string') {
    req.body.basePrice = parseFloat(req.body.basePrice);
  }

  if (req.body.weight && typeof req.body.weight === 'string') {
    req.body.weight = parseFloat(req.body.weight);
  }

  next();
};

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

router.post('/', adminAuth, upload.array('images', 5), parseFormDataJSON, validateRequest(productSchema), async (req, res) => {
  try {
    const productData = req.body;

    // LOGGING: Verifica ricezione file
    console.log('📤 POST /api/products - File ricevuti:', req.files?.length || 0);
    if (req.files && req.files.length > 0) {
      console.log('📸 Dettagli file:', req.files.map(f => ({
        fieldname: f.fieldname,
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size,
        path: f.path,
        filename: f.filename
      })));
    }

    // Cloudinary restituisce gli URL direttamente nei file objects
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map((file, index) => ({
        url: file.path, // Cloudinary URL completo
        publicId: file.filename, // Cloudinary public_id
        alt: `${productData.name} - Image ${index + 1}`,
        isPrimary: index === 0
      }));
      console.log('✅ Immagini preparate:', productData.images.length);
    } else {
      console.log('⚠️ Nessuna immagine ricevuta in req.files');
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

    // Se c'è un errore, elimina le immagini già uploadate su Cloudinary
    if (req.files && req.files.length > 0) {
      try {
        const imageUrls = req.files.map(file => file.path);
        await deleteMultipleImages(imageUrls);
      } catch (deleteError) {
        console.error('Error deleting images after failed product creation:', deleteError);
      }
    }

    res.status(500).json({ message: 'Server error creating product' });
  }
});

router.put('/:id', adminAuth, upload.array('images', 5), parseFormDataJSON, async (req, res) => {
  try {
    const productData = req.body;

    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Gestione nuove immagini da Cloudinary
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file, index) => ({
        url: file.path, // Cloudinary URL completo
        publicId: file.filename, // Cloudinary public_id
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

    // Se c'è un errore, elimina le nuove immagini uploadate
    if (req.files && req.files.length > 0) {
      try {
        const imageUrls = req.files.map(file => file.path);
        await deleteMultipleImages(imageUrls);
      } catch (deleteError) {
        console.error('Error deleting images after failed product update:', deleteError);
      }
    }

    res.status(500).json({ message: 'Server error updating product' });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Elimina tutte le immagini da Cloudinary
    if (product.images && product.images.length > 0) {
      try {
        const imageUrls = product.images.map(img => img.url || img.publicId);
        await deleteMultipleImages(imageUrls);
        console.log(`Deleted ${imageUrls.length} images from Cloudinary for product ${product._id}`);
      } catch (deleteError) {
        console.error('Error deleting images from Cloudinary:', deleteError);
        // Continua comunque con la cancellazione del prodotto
      }
    }

    // Eliminazione definitiva dal database (hard delete)
    await Product.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Product deleted permanently',
      imagesDeleted: product.images?.length || 0
    });
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

// Elimina una singola immagine da un prodotto
router.delete('/:id/images/:imageId', adminAuth, async (req, res) => {
  try {
    const { id, imageId } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const imageIndex = product.images.findIndex(img => img._id.toString() === imageId);
    if (imageIndex === -1) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const imageToDelete = product.images[imageIndex];

    // Elimina da Cloudinary
    try {
      await deleteImage(imageToDelete.url || imageToDelete.publicId);
    } catch (deleteError) {
      console.error('Error deleting image from Cloudinary:', deleteError);
      return res.status(500).json({ message: 'Failed to delete image from Cloudinary' });
    }

    // Rimuovi dal prodotto
    product.images.splice(imageIndex, 1);

    // Se l'immagine eliminata era primary e ci sono altre immagini, imposta la prima come primary
    if (imageToDelete.isPrimary && product.images.length > 0) {
      product.images[0].isPrimary = true;
    }

    await product.save();

    res.json({
      message: 'Image deleted successfully',
      product
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ message: 'Server error deleting image' });
  }
});

module.exports = router;