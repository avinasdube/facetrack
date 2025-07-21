/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static file serving for model files
  async headers() {
    return [
      {
        source: "/models/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400", // Cache models for 24 hours
          },
        ],
      },
    ];
  },
  // Optimize images and static assets
  images: {
    unoptimized: true, // For static deployment compatibility
  },
};

export default nextConfig;
