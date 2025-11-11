/**
 * Pure Static Root Page
 * 
 * No server-side logic, no middleware, no redirects
 * Just plain HTML rendered as static
 */

export default function RootPage() {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>SVG Converter</h1>
      <p style={{ fontSize: '18px', color: '#666' }}>
        Welcome to the SVG Converter application. Choose your language to get started.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginTop: '40px'
      }}>
        <a href="/ja" style={{
          padding: '20px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          textDecoration: 'none',
          color: '#333',
          textAlign: 'center',
          transition: 'all 0.3s'
        }} onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
           onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>🇯🇵</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>日本語</div>
          <div style={{ fontSize: '14px', color: '#999' }}>Japanese</div>
        </a>

        <a href="/en" style={{
          padding: '20px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          textDecoration: 'none',
          color: '#333',
          textAlign: 'center',
          transition: 'all 0.3s'
        }} onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
           onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>🇬🇧</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>English</div>
          <div style={{ fontSize: '14px', color: '#999' }}>English</div>
        </a>

        <a href="/zh" style={{
          padding: '20px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          textDecoration: 'none',
          color: '#333',
          textAlign: 'center',
          transition: 'all 0.3s'
        }} onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
           onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>🇨🇳</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>中文</div>
          <div style={{ fontSize: '14px', color: '#999' }}>Chinese</div>
        </a>
      </div>

      <footer style={{ marginTop: '60px', paddingTop: '20px', borderTop: '1px solid #eee', textAlign: 'center', color: '#999', fontSize: '14px' }}>
        <p>© 2025 SVG Converter • Powered by Cloudflare Pages</p>
      </footer>
    </div>
  )
}

