/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add response headers for face-api model files
  async headers() {
    return [
      {
        source: "/models/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400", // Cache models for 1 day
          },
        ],
      },
    ];
  },

  // Optional for flexibility — safe to keep
  images: {
    unoptimized: true,
  },

  // Fix Webpack warnings from node-only modules
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        encoding: false,
      };
    }
    return config;
  },
};

export default nextConfig;
