/**
 * Image helper for responsive, optimized ImageKit transformations
 * Appends tr=w-<w>,h-<h>,q-<q>,f-auto query parameters
 */
export function img(url, options = {}) {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('data:') || url.startsWith('blob:') || url.endsWith('.svg')) {
    return url;
  }

  const { w, h, q = 75, fit } = options;
  const transforms = [];

  if (w) transforms.push(`w-${Math.round(w)}`);
  if (h) transforms.push(`h-${Math.round(h)}`);
  if (q) transforms.push(`q-${q}`);
  if (fit) transforms.push(`c-${fit}`);
  transforms.push('f-auto');

  const trString = `tr=${transforms.join(',')}`;

  if (url.includes('?')) {
    if (url.includes('tr=')) {
      // Replace existing tr param if present
      return url.replace(/tr=[^&]+/, trString);
    }
    return `${url}&${trString}`;
  }

  return `${url}?${trString}`;
}

/**
 * Returns a 1x and 2x srcSet for retina displays
 */
export function srcSet(url, options = {}) {
  if (!url || typeof url !== 'string') return '';
  const { w, h, q = 75 } = options;
  if (!w) return img(url, options);

  const img1x = img(url, { w, h, q });
  const img2x = img(url, { w: w * 2, h: h ? h * 2 : undefined, q: Math.max(q - 10, 50) });

  return `${img1x} 1x, ${img2x} 2x`;
}

export default img;
