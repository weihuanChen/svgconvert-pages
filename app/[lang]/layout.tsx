const locales = ['ja', 'en', 'zh']

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }))
}

export default function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { lang: string }
}) {
  const lang = params.lang

  return (
    <>
      {children}
    </>
  )
}

