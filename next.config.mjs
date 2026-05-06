/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: "/favicon.ico", destination: "/apple-touch-icon.png" },
    ];
  },
};

export default nextConfig;
