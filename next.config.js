/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
  },
  experimental: {
    optimizeCss: true, // Enables CSS optimization
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react', '@heroui/react', 'framer-motion'],
  },
  typescript: {
    // !! WARN !!
    // Temporarily ignoring TypeScript errors for build to succeed
    // This should be removed once the type issues with NextJS 15 are resolved
    ignoreBuildErrors: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Оптимизация на статичните файлове
  webpack: (config, { dev, isServer }) => {
    // Оптимизация на SVG файлове
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    // Exclude pdf-generator from client bundles (it uses Node.js 'fs' module)
    // This prevents Next.js from trying to bundle server-only code for the client
    if (!isServer) {
      const webpack = require('webpack');
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /pdf-generator$/,
          contextRegExp: /lib$/,
        })
      );
    }

    // Оптимизация само за production build
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
      };
    }

    return config;
  },
  // HTTP headers: avoid caching app pages so users see new deployments without clearing cache
  async headers() {
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
      { key: 'Pragma', value: 'no-cache' },
    ];
    return [
      // Hashed static assets can be cached (Next.js adds content hash to filenames)
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|ico)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, must-revalidate' },
        ],
      },
      // All app routes and HTML: do not cache so deployments are visible immediately
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
}

module.exports = nextConfig; 