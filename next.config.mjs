/** @type {import('next').NextConfig} */
const nextConfig = {
  // OpenNext configuration for Cloudflare Pages
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
