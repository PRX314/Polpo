require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/paolino_ecommerce');
    console.log('MongoDB Connected: localhost');
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

const createTestProduct = async () => {
  try {
    await connectDB();

    const product = new Product({
      name: 'Maglietta Prova',
      description: 'Una semplice maglietta di prova per testare il sistema',
      category: 'magliette',
      basePrice: 19.99,
      images: [
        {
          url: 'https://via.placeholder.com/800x800/FF6B6B/FFFFFF?text=PROVA',
          publicId: 'placeholder-prova',
          alt: 'Maglietta Prova',
          isPrimary: true
        }
      ],
      variants: [
        {
          size: 'M',
          color: 'Rosso',
          colorCode: '#FF6B6B',
          stock: 10,
          sku: 'PROVA-M-ROSSO',
          priceModifier: 0
        }
      ],
      tags: ['prova', 'test'],
      isActive: true
    });

    await product.save();
    console.log('✅ Maglietta "Prova" creata con successo!');
    console.log('📦 Nome:', product.name);
    console.log('💰 Prezzo:', product.basePrice, '€');
    console.log('📏 Taglia:', product.variants[0].size);
    console.log('🎨 Colore:', product.variants[0].color);

    process.exit(0);
  } catch (error) {
    console.error('❌ Errore durante la creazione del prodotto:', error.message);
    process.exit(1);
  }
};

createTestProduct();
