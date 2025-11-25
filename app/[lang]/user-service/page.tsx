import type { Metadata } from "next"
import { Disclaimer } from "@/components/Disclaimer"
import { locales } from "@/app/i18n"
import { getUserServiceCopy } from "@/lib/legal/user-service"
import { type Locale } from "@/lib/types"

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }))
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: paramLang } = await params
  const lang = (paramLang && locales.includes(paramLang as Locale) ? paramLang : "en") as Locale
  const copy = getUserServiceCopy(lang)

  return {
    title: `${copy.pageTitle} | SVG Converter`,
    description: copy.seoDescription
  }
}

export default async function UserServicePage({
  params
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang: paramLang } = await params
  const lang = (paramLang && locales.includes(paramLang as Locale) ? paramLang : "en") as Locale
  const copy = getUserServiceCopy(lang)

  return (
    <div className="bg-background text-foreground">
      <div className="container mx-auto max-w-4xl space-y-10 px-4 py-12">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {copy.effectiveDateLabel}: {copy.effectiveDate}
          </p>
          <h1 className="text-4xl font-bold tracking-tight">{copy.pageTitle}</h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {copy.summary}
          </p>
        </header>

        <Disclaimer message={copy.disclaimer} />

        <div className="space-y-10">
          {copy.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="space-y-4 rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm backdrop-blur"
            >
              <h2 className="text-2xl font-semibold">{section.heading}</h2>

              {section.paragraphs.map((paragraph, index) => (
                <p key={index} className="text-base leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}

              {section.lists?.map((list, listIndex) => (
                <div key={listIndex} className="space-y-2">
                  {list.title ? (
                    <p className="font-medium text-foreground">{list.title}</p>
                  ) : null}
                  <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                    {list.items.map((item, itemIndex) => (
                      <li key={itemIndex}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ))}
        </div>

        <footer className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm backdrop-blur">
          <h3 className="text-xl font-semibold">{copy.contactHeading}</h3>
          <p className="mt-2 text-muted-foreground">{copy.contactDescription}</p>
          <p className="mt-3 text-muted-foreground">
            <span className="font-medium text-foreground">{copy.contactEmailLabel}:</span>{" "}
            <a
              href={`mailto:${copy.contactEmail}`}
              className="underline underline-offset-4"
            >
              {copy.contactEmail}
            </a>
          </p>
        </footer>
      </div>
    </div>
  )
}
