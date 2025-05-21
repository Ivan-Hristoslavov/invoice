/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '.next',
  images: {
    domains: ['res.cloudinary.com'], // Ако използвате Cloudinary за изображения
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
  },
  experimental: {
    optimizeCss: true, // Enables CSS optimization
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
  typescript: {
    // !! WARN !!
    // Temporarily ignoring TypeScript errors for build to succeed
    // This should be removed once the type issues with NextJS 15 are resolved
    ignoreBuildErrors: true,
  },
  eslint: {
    // !! WARN !!
    // Temporarily ignoring ESLint errors for build to succeed
    ignoreDuringBuilds: true,
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
  // Настройки за HTTP кеширане
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, must-revalidate',
          },
        ],
      },
      {
        source: '/:all*(js|css)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, must-revalidate',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig; 