/**
 * Language-specific page - Pure Static
 * No API calls, no client state, just static HTML
 */

const translations = {
  ja: {
    title: 'SVG コンバーター',
    description: 'SVGファイルをPNG、JPG、PDF、EPSに変換します',
    upload: 'ファイルをアップロード',
    selectFormat: '出力形式を選択',
    convert: '変換する',
  },
  en: {
    title: 'SVG Converter',
    description: 'Convert SVG files to PNG, JPG, PDF, EPS',
    upload: 'Upload File',
    selectFormat: 'Select Format',
    convert: 'Convert',
  },
  zh: {
    title: 'SVG 转换工具',
    description: '将 SVG 文件转换为 PNG、JPG、PDF、EPS',
    upload: '上传文件',
    selectFormat: '选择格式',
    convert: '转换',
  },
}

export default function LangPage({
  params,
}: {
  params: { lang: 'ja' | 'en' | 'zh' }
}) {
  const lang = params.lang
  const t = translations[lang] || translations['en']

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>{t.title}</h1>
      <p style={{ fontSize: '18px', color: '#666', marginBottom: '40px' }}>
        {t.description}
      </p>

      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '40px',
        borderRadius: '8px',
        border: '2px dashed #ccc',
        textAlign: 'center',
        marginBottom: '30px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>📁</div>
        <p style={{ fontSize: '16px', marginBottom: '10px' }}>
          {t.upload}
        </p>
        <p style={{ fontSize: '12px', color: '#999' }}>
          Drag and drop or click to select
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
          {t.selectFormat}
        </label>
        <select style={{
          width: '100%',
          padding: '10px',
          fontSize: '16px',
          border: '1px solid #ddd',
          borderRadius: '4px'
        }}>
          <option>PNG</option>
          <option>JPG</option>
          <option>PDF</option>
          <option>EPS</option>
        </select>
      </div>

      <button style={{
        width: '100%',
        padding: '12px',
        fontSize: '16px',
        fontWeight: 'bold',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}>
        {t.convert}
      </button>

      <div style={{ marginTop: '60px', textAlign: 'center' }}>
        <a href="/" style={{ color: '#007bff', textDecoration: 'none', marginRight: '20px' }}>
          ← Back
        </a>
        <a href="/ja" style={{ color: '#999', textDecoration: 'none', marginRight: '10px' }}>
          日本語
        </a>
        <a href="/en" style={{ color: '#999', textDecoration: 'none', marginRight: '10px' }}>
          English
        </a>
        <a href="/zh" style={{ color: '#999', textDecoration: 'none' }}>
          中文
        </a>
      </div>
    </div>
  )
}

