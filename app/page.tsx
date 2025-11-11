/**
 * Root page (/)
 * 
 * For static export, we use an HTML meta redirect to /ja
 * This ensures the file is generated as out/index.html
 */

export const metadata = {
  title: 'SVG Converter',
  description: 'Convert SVG files to PNG, JPG, PDF, EPS',
}

export default function RootPage() {
  // For static export, we render a simple page with a meta redirect
  return (
    <html>
      <head>
        <meta httpEquiv="refresh" content="0; url=/ja" />
      </head>
      <body>
        <p>Redirecting to Japanese version...</p>
      </body>
    </html>
  )
}

