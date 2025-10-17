require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const connectDB = require('../config/database');

const sampleProducts = [
  {
    name: "Maglietta Basic Bianca",
    description: "Maglietta in cotone 100% di alta qualità. Comfort e stile per ogni giorno. Vestibilità regolare, perfetta per il tempo libero.",
    category: "magliette",
    basePrice: 19.99,
    variants: [
      { size: "S", color: "Bianco", colorCode: "#FFFFFF", stock: 25, sku: "MAG-BIA-S", priceModifier: 0 },
      { size: "M", color: "Bianco", colorCode: "#FFFFFF", stock: 30, sku: "MAG-BIA-M", priceModifier: 0 },
      { size: "L", color: "Bianco", colorCode: "#FFFFFF", stock: 20, sku: "MAG-BIA-L", priceModifier: 0 },
      { size: "XL", color: "Bianco", colorCode: "#FFFFFF", stock: 15, sku: "MAG-BIA-XL", priceModifier: 0 }
    ],
    tags: ["basic", "cotone", "casual"],
    weight: 150
  },
  {
    name: "Maglietta Premium Nera",
    description: "Maglietta premium in cotone organico. Design moderno e materiali sostenibili per chi non scende a compromessi.",
    category: "magliette",
    basePrice: 24.99,
    variants: [
      { size: "S", color: "Nero", colorCode: "#000000", stock: 20, sku: "MAG-NER-S", priceModifier: 0 },
      { size: "M", color: "Nero", colorCode: "#000000", stock: 25, sku: "MAG-NER-M", priceModifier: 0 },
      { size: "L", color: "Nero", colorCode: "#000000", stock: 18, sku: "MAG-NER-L", priceModifier: 0 },
      { size: "XL", color: "Nero", colorCode: "#000000", stock: 12, sku: "MAG-NER-XL", priceModifier: 0 },
      { size: "XXL", color: "Nero", colorCode: "#000000", stock: 8, sku: "MAG-NER-XXL", priceModifier: 2 }
    ],
    tags: ["premium", "cotone organico", "sostenibile"],
    weight: 160
  },
  {
    name: "Felpa con Cappuccio Grigia",
    description: "Felpa calda e confortevole con cappuccio. Perfetta per le giornate più fresche. Interno in spugna morbida.",
    category: "felpe",
    basePrice: 39.99,
    variants: [
      { size: "S", color: "Grigio", colorCode: "#808080", stock: 15, sku: "FEL-GRI-S", priceModifier: 0 },
      { size: "M", color: "Grigio", colorCode: "#808080", stock: 20, sku: "FEL-GRI-M", priceModifier: 0 },
      { size: "L", color: "Grigio", colorCode: "#808080", stock: 18, sku: "FEL-GRI-L", priceModifier: 0 },
      { size: "XL", color: "Grigio", colorCode: "#808080", stock: 12, sku: "FEL-GRI-XL", priceModifier: 0 },
      { size: "XXL", color: "Grigio", colorCode: "#808080", stock: 8, sku: "FEL-GRI-XXL", priceModifier: 5 }
    ],
    tags: ["cappuccio", "caldo", "invernale"],
    weight: 450
  },
  {
    name: "Sciarpa di Lana Blu",
    description: "Sciarpa elegante in lana merino. Morbida e calda, perfetta per completare il tuo look invernale.",
    category: "sciarpe",
    basePrice: 29.99,
    variants: [
      { size: "S", color: "Blu Navy", colorCode: "#000080", stock: 12, sku: "SCI-BLU-S", priceModifier: 0 },
      { size: "M", color: "Blu Navy", colorCode: "#000080", stock: 15, sku: "SCI-BLU-M", priceModifier: 0 },
      { size: "L", color: "Blu Navy", colorCode: "#000080", stock: 10, sku: "SCI-BLU-L", priceModifier: 3 }
    ],
    tags: ["lana", "elegante", "invernale"],
    weight: 120
  },
  {
    name: "Cappello Baseball Nero",
    description: "Cappello da baseball classico con visiera rigida. Regolabile, perfetto per ogni stagione.",
    category: "accessori",
    basePrice: 16.99,
    variants: [
      { size: "S", color: "Nero", colorCode: "#000000", stock: 20, sku: "CAP-NER-S", priceModifier: 0 },
      { size: "M", color: "Nero", colorCode: "#000000", stock: 25, sku: "CAP-NER-M", priceModifier: 0 },
      { size: "L", color: "Nero", colorCode: "#000000", stock: 15, sku: "CAP-NER-L", priceModifier: 0 }
    ],
    tags: ["baseball", "classico", "regolabile"],
    weight: 85
  },
  {
    name: "Maglietta Colorata Rosa",
    description: "Maglietta vivace in cotone colorato. Ideale per aggiungere un tocco di colore al tuo guardaroba.",
    category: "magliette",
    basePrice: 22.99,
    variants: [
      { size: "XS", color: "Rosa", colorCode: "#FFC0CB", stock: 10, sku: "MAG-ROS-XS", priceModifier: 0 },
      { size: "S", color: "Rosa", colorCode: "#FFC0CB", stock: 18, sku: "MAG-ROS-S", priceModifier: 0 },
      { size: "M", color: "Rosa", colorCode: "#FFC0CB", stock: 22, sku: "MAG-ROS-M", priceModifier: 0 },
      { size: "L", color: "Rosa", colorCode: "#FFC0CB", stock: 16, sku: "MAG-ROS-L", priceModifier: 0 }
    ],
    tags: ["colorata", "vivace", "primaverile"],
    weight: 140
  }
];

const createSampleProducts = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Checking for existing products...');
    
    const existingProducts = await Product.countDocuments();
    if (existingProducts > 0) {
      console.log(`✅ Found ${existingProducts} existing products. Skipping creation.`);
      process.exit(0);
    }

    console.log('📦 Creating sample products...');
    
    for (const productData of sampleProducts) {
      const product = new Product(productData);
      await product.save();
      console.log(`✅ Created: ${product.name}`);
    }
    
    console.log(`🎉 Successfully created ${sampleProducts.length} sample products!`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating sample products:', error);
    process.exit(1);
  }
};

createSampleProducts();