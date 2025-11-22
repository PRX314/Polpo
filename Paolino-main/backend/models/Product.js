const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['magliette', 'felpe', 'sciarpe', 'accessori'],
    lowercase: true
  },
  collectionType: {
    type: String,
    enum: ['standard', 'fijo', 'gpower'],
    default: 'standard',
    lowercase: true
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  variants: [{
    size: {
      type: String,
      required: true,
      enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Unica']
    },
    color: {
      type: String,
      required: false
    },
    colorCode: String,
    printPosition: {
      type: String,
      enum: ['centro', 'sinistra', 'destra', 'dietro', 'manica-sx', 'manica-dx', null],
      required: false
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    sku: {
      type: String,
      required: false
    },
    priceModifier: {
      type: Number,
      default: 0
    }
  }],
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  weight: {
    type: Number,
    min: 0
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  stripeProductId: String,
  stripePriceId: String
}, {
  timestamps: true
});

productSchema.virtual('finalPrice').get(function() {
  return this.basePrice;
});

productSchema.virtual('totalStock').get(function() {
  return this.variants.reduce((total, variant) => total + variant.stock, 0);
});

productSchema.methods.getVariantBySkuOrId = function(identifier) {
  return this.variants.find(variant => 
    variant.sku === identifier || variant._id.toString() === identifier
  );
};

productSchema.methods.updateStock = function(variantId, quantity) {
  const variant = this.variants.id(variantId);
  if (variant && variant.stock >= quantity) {
    variant.stock -= quantity;
    return true;
  }
  return false;
};

module.exports = mongoose.model('Product', productSchema);