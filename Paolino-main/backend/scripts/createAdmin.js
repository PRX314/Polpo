require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/database');

const createAdmin = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Checking for existing admin user...');
    
    const existingAdmin = await User.findOne({ email: 'admin@paolino.com' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists!');
      console.log('📧 Email: admin@paolino.com');
      console.log('🔑 Password: admin123');
      process.exit(0);
    }

    console.log('👤 Creating admin user...');
    
    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'Paolino',
      email: 'admin@paolino.com',
      password: 'admin123',
      role: 'admin',
      address: {
        street: 'Via Roma 1',
        city: 'Milano',
        postalCode: '20100',
        country: 'Italia'
      },
      phone: '+39 123 456 7890'
    });

    await adminUser.save();
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@paolino.com');
    console.log('🔑 Password: admin123');
    console.log('🎯 Role: admin');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin();