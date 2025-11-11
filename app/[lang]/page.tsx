const translations = {
  ja: { title: 'SVG コンバーター', desc: 'SVGファイルを変換します' },
  en: { title: 'SVG Converter', desc: 'Convert SVG files' },
  zh: { title: 'SVG 转换工具', desc: '转换 SVG 文件' },
}

export default function LangPage({ params }: { params: { lang: string } }) {
  const t = translations[params.lang as keyof typeof translations] || translations.en

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>{t.title}</h1>
      <p>{t.desc}</p>
      <a href="/">← Back</a>
    </div>
  )
}
