/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.fbcdn.net' },
      { protocol: 'https', hostname: '**.facebook.com' },
      { protocol: 'https', hostname: 'scontent.fxxx1-1.fna.fbcdn.net' },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['playwright'],
  },
}

export default nextConfig
