/**
 * Helper per gestire URL delle immagini prodotto
 * Supporta sia URL Cloudinary (assoluti) che URL locali (relativi)
 */

import { API_SERVER_URL } from '../services/api';

/**
 * Genera l'URL corretto per visualizzare un'immagine
 * @param {string} imageUrl - URL dell'immagine (può essere assoluto o relativo)
 * @returns {string} - URL completo dell'immagine
 */
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) {
    return null;
  }

  // Se l'URL è già assoluto (Cloudinary, http, https), restituiscilo così com'è
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Se è un URL relativo (vecchio sistema locale), concatena con il server URL
  return `${API_SERVER_URL}${imageUrl}`;
};

/**
 * Genera l'URL di un'immagine prodotto dalla struttura completa
 * @param {Object} product - Oggetto prodotto
 * @param {number} index - Indice dell'immagine (default: 0 per immagine principale)
 * @returns {string|null} - URL dell'immagine o null
 */
export const getProductImageUrl = (product, index = 0) => {
  if (!product?.images || !product.images[index]) {
    return null;
  }

  return getImageUrl(product.images[index].url);
};

/**
 * Ottiene tutte le immagini di un prodotto come array di URL
 * @param {Object} product - Oggetto prodotto
 * @returns {Array<string>} - Array di URL delle immagini
 */
export const getAllProductImages = (product) => {
  if (!product?.images || product.images.length === 0) {
    return [];
  }

  return product.images.map(img => getImageUrl(img.url)).filter(Boolean);
};

/**
 * Verifica se un'immagine è salvata su Cloudinary
 * @param {string} imageUrl - URL dell'immagine
 * @returns {boolean} - true se è un URL Cloudinary
 */
export const isCloudinaryImage = (imageUrl) => {
  if (!imageUrl) return false;
  return imageUrl.includes('cloudinary.com');
};
