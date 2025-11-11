const nextConfig = {
  // Use export for Cloudflare Pages (static deployment)
  // API routes will be handled by wrangler functions
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  skipTrailingSlashRedirect: true,
  trailingSlash: false,
}

export default nextConfig
