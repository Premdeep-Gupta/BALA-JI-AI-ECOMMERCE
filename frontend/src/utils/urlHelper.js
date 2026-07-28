/**
 * Secure URL helper to prevent Mixed Content warnings.
 * Converts any http:// URL to https:// on-the-fly.
 */
export const secureUrl = (url) => {
  if (!url || typeof url !== "string") return url;
  if (url.startsWith("http://")) {
    return url.replace("http://", "https://");
  }
  return url;
};

/**
 * Parses and returns a secure product image URL.
 */
export const getSecureProductImage = (product) => {
  if (!product) return null;
  
  const images = product.images;
  if (!images) {
    const fallback = product.image || product.image_url;
    return secureUrl(fallback) || null;
  }

  let parsed = [];
  try {
    parsed = typeof images === "string" ? JSON.parse(images) : images;
  } catch (_) {
    parsed = [];
  }

  if (Array.isArray(parsed) && parsed.length > 0) {
    const item = parsed[0];
    const url = typeof item === "string" ? item : item?.url;
    return secureUrl(url);
  }

  if (typeof images === "string" && images.startsWith("http")) {
    return secureUrl(images);
  }

  return null;
};
