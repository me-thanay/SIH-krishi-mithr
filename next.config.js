/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Permissions-Policy",
            // microphone=(self) is required for the My Farm voice assistant (and voice demo);
            // geolocation=(self) lets My Farm pin the field from GPS.
            value: "camera=(self), microphone=(self), geolocation=(self), publickey-credentials-get=(self), publickey-credentials-create=(self)",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
