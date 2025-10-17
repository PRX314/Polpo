const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variant: {
    size: { type: String, required: true },
    color: { type: String, required: true },
    sku: { type: String, required: true }
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  price: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

cartSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

cartSchema.virtual('totalPrice').get(function() {
  return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
});

cartSchema.methods.addItem = function(productId, variant, price, quantity = 1) {
  const existingItemIndex = this.items.findIndex(item => 
    item.product.toString() === productId.toString() && 
    item.variant.sku === variant.sku
  );

  if (existingItemIndex > -1) {
    this.items[existingItemIndex].quantity += quantity;
  } else {
    this.items.push({
      product: productId,
      variant,
      price,
      quantity
    });
  }
  
  this.lastUpdated = new Date();
  return this;
};

cartSchema.methods.removeItem = function(itemId) {
  this.items.id(itemId).remove();
  this.lastUpdated = new Date();
  return this;
};

cartSchema.methods.updateItemQuantity = function(itemId, quantity) {
  const item = this.items.id(itemId);
  if (item) {
    if (quantity <= 0) {
      item.remove();
    } else {
      item.quantity = quantity;
    }
    this.lastUpdated = new Date();
  }
  return this;
};

cartSchema.methods.clearCart = function() {
  this.items = [];
  this.lastUpdated = new Date();
  return this;
};

module.exports = mongoose.model('Cart', cartSchema);