export default function RootPage() {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>SVG Converter</h1>
      <p>Select your language:</p>
      <ul>
        <li><a href="/ja">日本語 (Japanese)</a></li>
        <li><a href="/en">English</a></li>
        <li><a href="/zh">中文 (Chinese)</a></li>
      </ul>
    </div>
  )
}

