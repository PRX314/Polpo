const cloudinary = require('cloudinary').v2;

// Configurazione Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Estrae il public_id da un URL Cloudinary
 * @param {string} imageUrl - URL completo dell'immagine Cloudinary
 * @returns {string} - public_id dell'immagine
 */
const extractPublicId = (imageUrl) => {
  if (!imageUrl) return null;

  // Se è un URL Cloudinary, estrai il public_id
  if (imageUrl.includes('cloudinary.com')) {
    const parts = imageUrl.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex !== -1) {
      // Prendi tutto dopo /upload/v123456789/
      const pathAfterUpload = parts.slice(uploadIndex + 2).join('/');
      // Rimuovi l'estensione del file
      return pathAfterUpload.replace(/\.[^/.]+$/, '');
    }
  }

  // Se è già un public_id, restituiscilo così com'è
  return imageUrl.replace(/\.[^/.]+$/, '');
};

/**
 * Upload di una singola immagine su Cloudinary
 * @param {string} filePath - Path del file locale o buffer
 * @param {Object} options - Opzioni aggiuntive per l'upload
 * @returns {Promise<Object>} - Risultato dell'upload con url e public_id
 */
const uploadImage = async (filePath, options = {}) => {
  try {
    const defaultOptions = {
      folder: 'paolino/products',
      resource_type: 'image',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ],
      ...options
    };

    const result = await cloudinary.uploader.upload(filePath, defaultOptions);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
  }
};

/**
 * Elimina una singola immagine da Cloudinary
 * @param {string} imageUrl - URL o public_id dell'immagine da eliminare
 * @returns {Promise<Object>} - Risultato della cancellazione
 */
const deleteImage = async (imageUrl) => {
  try {
    if (!imageUrl) {
      throw new Error('Image URL or public_id is required');
    }

    const publicId = extractPublicId(imageUrl);

    if (!publicId) {
      throw new Error('Could not extract public_id from image URL');
    }

    const result = await cloudinary.uploader.destroy(publicId);

    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete image from Cloudinary: ${error.message}`);
  }
};

/**
 * Elimina più immagini da Cloudinary
 * @param {Array<string>} imageUrls - Array di URL o public_id delle immagini
 * @returns {Promise<Array>} - Array dei risultati delle cancellazioni
 */
const deleteMultipleImages = async (imageUrls) => {
  try {
    if (!imageUrls || imageUrls.length === 0) {
      return [];
    }

    const deletePromises = imageUrls.map(url => deleteImage(url));
    const results = await Promise.allSettled(deletePromises);

    return results.map((result, index) => ({
      url: imageUrls[index],
      status: result.status,
      value: result.value,
      reason: result.reason?.message
    }));
  } catch (error) {
    console.error('Cloudinary multiple delete error:', error);
    throw new Error(`Failed to delete multiple images: ${error.message}`);
  }
};

/**
 * Ottiene i dettagli di un'immagine da Cloudinary
 * @param {string} publicId - public_id dell'immagine
 * @returns {Promise<Object>} - Dettagli dell'immagine
 */
const getImageDetails = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary get details error:', error);
    throw new Error(`Failed to get image details: ${error.message}`);
  }
};

/**
 * Genera un URL trasformato per un'immagine
 * @param {string} publicId - public_id dell'immagine
 * @param {Object} transformations - Trasformazioni da applicare
 * @returns {string} - URL trasformato
 */
const getTransformedUrl = (publicId, transformations = {}) => {
  try {
    return cloudinary.url(publicId, {
      transformation: transformations,
      secure: true
    });
  } catch (error) {
    console.error('Cloudinary transform error:', error);
    throw new Error(`Failed to generate transformed URL: ${error.message}`);
  }
};

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage,
  deleteMultipleImages,
  getImageDetails,
  getTransformedUrl,
  extractPublicId
};
