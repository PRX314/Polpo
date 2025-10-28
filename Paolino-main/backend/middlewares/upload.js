const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../services/cloudinary');

// Configurazione storage Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'paolino/products',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [
      { width: 1200, height: 1200, crop: 'limit' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ],
    public_id: (req, file) => {
      // Genera un nome univoco per il file
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
      return `${filename}-${uniqueSuffix}`;
    }
  }
});

// Validazione file
const fileFilter = (req, file, cb) => {
  console.log('🔍 Upload middleware - File ricevuto:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    console.log('✅ File accettato:', file.originalname);
    cb(null, true);
  } else {
    console.log('❌ File rifiutato (tipo non permesso):', file.mimetype);
    cb(new Error('Only JPEG, PNG and WebP images are allowed'), false);
  }
};

// Configurazione Multer con Cloudinary
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max per file
  }
});

module.exports = upload;