const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const deleteAllProducts = async () => {
  try {
    // Connetti a MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/paolino_ecommerce';
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected:', mongoose.connection.host);

    // Conta i prodotti prima dell'eliminazione
    const count = await Product.countDocuments();
    console.log(`\n🔍 Trovati ${count} prodotti nel database`);

    if (count === 0) {
      console.log('✅ Database già pulito! Nessun prodotto da eliminare.\n');
      process.exit(0);
    }

    // Conferma eliminazione
    console.log('⚠️  ATTENZIONE: Stai per eliminare TUTTI i prodotti dal database!');
    console.log('   Questa operazione è IRREVERSIBILE!\n');

    // Elimina tutti i prodotti
    const result = await Product.deleteMany({});
    console.log(`✅ Eliminati ${result.deletedCount} prodotti dal database`);
    console.log('🎯 Database pulito e pronto per i tuoi prodotti reali!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Errore durante l\'eliminazione:', error);
    process.exit(1);
  }
};

deleteAllProducts();
