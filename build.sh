#!/bin/bash
# Cloudflare Pages build script for Next.js with @cloudflare/next-on-pages

set -e

echo "🔨 Building Next.js with @cloudflare/next-on-pages..."
npm run pages:build

echo "✅ Build complete!"
ls -la .vercel/output/static/ | head -20

