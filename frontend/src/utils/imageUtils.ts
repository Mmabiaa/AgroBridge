/**
 * Image utility functions
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Normalize image URL to ensure it's absolute
 */
export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // If already absolute URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // If starts with /media/, prepend API base URL
  if (url.startsWith('/media/')) {
    return `${API_BASE_URL}${url}`;
  }

  // If starts with media/ (without leading slash), prepend API base URL with slash
  if (url.startsWith('media/')) {
    return `${API_BASE_URL}/${url}`;
  }

  // If it's a relative path, prepend API base URL
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Get product image URL from various formats
 */
export function getProductImageUrl(product: any): string | null {
  if (!product?.images || product.images.length === 0) {
    return null;
  }

  const firstImage = product.images[0];

  let imageUrl: string | null = null;

  if (typeof firstImage === 'string') {
    imageUrl = firstImage;
  } else if (firstImage?.image) {
    imageUrl = firstImage.image;
  } else if (firstImage?.url) {
    imageUrl = firstImage.url;
  }

  return normalizeImageUrl(imageUrl);
}

/**
 * Get fallback image for products
 */
export function getProductFallbackImage(): string {
  return '/placeholder-product.png'; // You can create this placeholder image
}

/**
 * Handle image load error
 */
export function handleImageError(event: React.SyntheticEvent<HTMLImageElement>) {
  const img = event.currentTarget;
  img.src = getProductFallbackImage();
  img.onerror = null; // Prevent infinite loop
}
