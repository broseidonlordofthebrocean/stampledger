/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Required for Cloudflare Pages deployment
  output: 'standalone',

  // Image optimization config for Cloudflare
  images: {
    loader: 'custom',
    loaderFile: './lib/cloudflare-image-loader.js',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.stampledger.com',
      },
    ],
  },

  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_CHAIN_RPC: process.env.NEXT_PUBLIC_CHAIN_RPC || 'https://rpc.stampledger.com',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.stampledger.com',
  },
}

module.exports = nextConfig
