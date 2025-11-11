/**
 * Root page (/)
 * 
 * Simple root directory page
 * Returns basic HTML without redirects for debugging
 */

export const metadata = {
  title: 'SVG Converter - Root',
  description: 'SVG Converter Application',
}

export default function RootPage() {
  return (
    <html>
      <head>
        <title>SVG Converter</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ fontFamily: 'sans-serif', padding: '20px' }}>
        <h1>SVG Converter</h1>
        <p>Welcome to the SVG Converter application.</p>
        <ul>
          <li><a href="/ja">日本語 (Japanese)</a></li>
          <li><a href="/en">English</a></li>
          <li><a href="/zh">中文 (Chinese)</a></li>
        </ul>
      </body>
    </html>
  )
}

