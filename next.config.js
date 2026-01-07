/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN,
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_ACCESS_TOKEN,
  },
  images: {
    domains: ['images.unsplash.com'],
  },
  // Optimize performance (SWC minification is enabled by default in Next.js 15)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  // Disable prefetching globally for faster navigation (can be overridden per Link)
  // This makes navigation instant like React Router
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  // Optimize page transitions
  poweredByHeader: false,
  compress: true,
  webpack: (config, { isServer }) => {
    // Handle mapbox-gl - only load on client side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig

