// Cloudflare Image Resizing loader for Next.js
// https://developers.cloudflare.com/images/transform-images/

export default function cloudflareLoader({ src, width, quality }) {
  const params = [`width=${width}`, `quality=${quality || 75}`, 'format=auto']

  // If the image is already an absolute URL, use Cloudflare's transform
  if (src.startsWith('http')) {
    return `/cdn-cgi/image/${params.join(',')}/${src}`
  }

  // For relative URLs, just return them as-is (static assets)
  return src
}
