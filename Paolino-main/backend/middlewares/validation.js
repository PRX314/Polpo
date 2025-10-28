const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

const registerSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  address: Joi.object({
    street: Joi.string().allow(''),
    city: Joi.string().allow(''),
    postalCode: Joi.string().allow(''),
    country: Joi.string().allow('')
  }).optional(),
  phone: Joi.string().allow('').optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const productSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().required(),
  category: Joi.string().valid('magliette', 'felpe', 'sciarpe', 'accessori').required(),
  basePrice: Joi.number().min(0).required(),
  variants: Joi.array().items(
    Joi.object({
      size: Joi.string().valid('XS', 'S', 'M', 'L', 'XL', 'XXL').required(),
      color: Joi.string().required(),
      colorCode: Joi.string().allow('', null).optional(),
      stock: Joi.number().min(0).required(),
      sku: Joi.string().required(),
      priceModifier: Joi.number().default(0)
    })
  ).min(1).required(),
  tags: Joi.array().items(Joi.string()).optional(),
  weight: Joi.number().min(0).optional(),
  dimensions: Joi.object({
    length: Joi.number().min(0),
    width: Joi.number().min(0),
    height: Joi.number().min(0)
  }).optional(),
  isActive: Joi.boolean().optional().default(true)
}).unknown(true);

module.exports = {
  validateRequest,
  registerSchema,
  loginSchema,
  productSchema
};