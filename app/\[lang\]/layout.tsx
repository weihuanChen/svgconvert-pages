export function generateStaticParams() {
  return [
    { lang: 'ja' },
    { lang: 'en' },
    { lang: 'zh' },
  ]
}

export default function LangLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

