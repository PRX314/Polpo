const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Mongoose 6+ non richiede più useNewUrlParser e useUnifiedTopology
    // Sono ora comportamenti predefiniti
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/paolino_ecommerce');

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;