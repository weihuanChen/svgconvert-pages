const nextConfig = {
  // Use standalone for Cloudflare Pages
  // This allows both static pages and dynamic API routes
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
