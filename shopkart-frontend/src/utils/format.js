export const formatINR = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const shortId = (id = '') => String(id).slice(-8);

export const getErrorMessage = (err, fallback = 'Something went wrong. Please try again.') =>
  err?.response?.data?.message || (err?.request ? 'Cannot reach the server. Is the backend running?' : err?.message) || fallback;

// Inline SVG used when a product image fails to load (no external placeholder service).
export const FALLBACK_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="100%" height="100%" fill="#f1f5f9"/><text x="50%" y="50%" fill="#94a3b8" font-family="sans-serif" font-size="18" text-anchor="middle" dominant-baseline="middle">No image</text></svg>`
  );

export const onImgError = (e) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = FALLBACK_IMG;
};
