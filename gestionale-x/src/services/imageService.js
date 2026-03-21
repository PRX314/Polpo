// Image upload service — Cloudinary unsigned upload
// Config via env vars or fallback defaults

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dlejf1f6l'
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'polpo_unsigned'

const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`

/**
 * Upload an image file to Cloudinary
 * @param {File} file - The image file to upload
 * @param {string} folder - Optional folder name
 * @returns {Promise<{url: string, publicId: string, width: number, height: number}>}
 */
export async function uploadImage(file, folder = 'polpo-gestionale') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', folder)

  const res = await fetch(UPLOAD_URL, {
    method: 'POST',
    body: formData
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || 'Errore nel caricamento immagine')
  }

  const data = await res.json()
  return {
    url: data.secure_url,
    publicId: data.public_id,
    width: data.width,
    height: data.height
  }
}

/**
 * Get a Cloudinary thumbnail URL
 * @param {string} url - Original Cloudinary URL
 * @param {number} width - Desired width
 * @returns {string} Transformed URL
 */
export function getThumbnail(url, width = 300) {
  if (!url || !url.includes('cloudinary.com')) return url
  return url.replace('/upload/', `/upload/w_${width},c_limit,q_auto,f_auto/`)
}
