/** @type {import('next').NextConfig} */
const nextConfig = {
  // OpenNext configuration for Cloudflare Workers
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ["@radix-ui/react-*"],
  },
}

export default nextConfig
