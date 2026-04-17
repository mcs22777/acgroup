/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // Docker ortamında 'backend' service adı, lokalde localhost:8000
        destination: `${process.env.API_INTERNAL_URL || 'http://backend:8000'}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
