/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  output: 'standalone',
  poweredByHeader: false,
  images: {
    domains: ['image.tmdb.org', 'rb.gy'],
  },
}
