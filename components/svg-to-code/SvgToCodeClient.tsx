"use client"

import { useEffect, useRef, useState } from "react"
import { Upload, Clipboard, Check, RefreshCw, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { getTranslation, type Locale } from "@/app/i18n"

interface SvgToCodeClientProps {
  lang: Locale
}

export function SvgToCodeClient({ lang }: SvgToCodeClientProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [svgMarkup, setSvgMarkup] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previousUrl = useRef<string | null>(null)
  const t = getTranslation(lang).svgToCode

  useEffect(() => {
    return () => {
      if (previousUrl.current) {
        URL.revokeObjectURL(previousUrl.current)
      }
    }
  }, [])

  const handleFile = (file: File) => {
    const isSvg = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")

    if (!isSvg) {
      setError(t.invalidFile)
      setSvgMarkup("")
      setPreviewUrl(null)
      setFileName(null)
      return
    }

    setError(null)
    setFileName(file.name)

    if (previousUrl.current) {
      URL.revokeObjectURL(previousUrl.current)
    }
    const objectUrl = URL.createObjectURL(file)
    previousUrl.current = objectUrl
    setPreviewUrl(objectUrl)

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === "string") {
        setSvgMarkup(result)
      } else {
        setSvgMarkup("")
        setError(t.readError)
      }
    }
    reader.onerror = () => {
      setSvgMarkup("")
      setError(t.readError)
    }
    reader.readAsText(file)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const clearSelection = () => {
    setFileName(null)
    setSvgMarkup("")
    setPreviewUrl(null)
    setError(null)
    if (previousUrl.current) {
      URL.revokeObjectURL(previousUrl.current)
      previousUrl.current = null
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const copyCode = async () => {
    if (!svgMarkup) return
    await navigator.clipboard.writeText(svgMarkup)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-100 via-white to-sky-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border-4 border-black bg-white px-4 py-2 font-mono text-sm font-bold uppercase shadow-[6px_6px_0_0_#000] dark:border-white dark:bg-gray-900 dark:shadow-[6px_6px_0_0_#fff]">
              <FileText className="h-4 w-4" />
              <span>SVG → CODE</span>
            </div>
            <h1 className="text-3xl font-black leading-tight md:text-4xl">{t.title}</h1>
            <p className="max-w-3xl text-lg text-gray-700 dark:text-gray-200">{t.subtitle}</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="border-4 border-black bg-lime-400 text-black shadow-[6px_6px_0_0_#000] hover:-translate-y-1 hover:shadow-[10px_10px_0_0_#000] transition-transform dark:border-white dark:bg-lime-500 dark:text-black dark:shadow-[6px_6px_0_0_#fff]"
            >
              <Upload className="mr-2 h-4 w-4" />
              {t.uploadCta}
            </Button>
            <Button
              variant="outline"
              onClick={clearSelection}
              className="border-4 border-black bg-white text-black shadow-[6px_6px_0_0_#000] hover:bg-gray-100 dark:border-white dark:bg-gray-900 dark:text-white dark:shadow-[6px_6px_0_0_#fff]"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {t.clear}
            </Button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".svg,image/svg+xml"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="grid gap-8 lg:grid-cols-[1.1fr_1.2fr]">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex min-h-[360px] cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border-4 border-black p-8 shadow-[10px_10px_0_0_#000] transition-all dark:border-white dark:shadow-[10px_10px_0_0_#fff] ${
              isDragging ? "bg-lime-200 dark:bg-lime-700/50" : "bg-white dark:bg-gray-900"
            }`}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(132,204,22,0.15),transparent_25%),radial-gradient(circle_at_80%_0,rgba(59,130,246,0.15),transparent_30%)]" />
            <div className="relative space-y-4">
              <h2 className="text-2xl font-black">{t.uploadCta}</h2>
              <p className="text-gray-700 dark:text-gray-200">{t.dropHint}</p>
              <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-black bg-white/70 p-4 text-left font-mono text-sm shadow-[4px_4px_0_0_#000] dark:border-white dark:bg-gray-800/70 dark:shadow-[4px_4px_0_0_#fff]">
                <Upload className="h-5 w-5" />
                <div className="space-y-1">
                  <p className="font-bold">{t.uploadCta}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">SVG · image/svg+xml</p>
                </div>
              </div>
              {error && (
                <div className="rounded-xl border-4 border-black bg-red-100 px-4 py-3 text-sm font-bold text-black shadow-[6px_6px_0_0_#000] dark:border-white dark:bg-red-400/20 dark:text-white dark:shadow-[6px_6px_0_0_#fff]">
                  {error}
                </div>
              )}
              {fileName && (
                <div className="rounded-xl border-4 border-black bg-lime-200 px-4 py-3 font-bold text-black shadow-[6px_6px_0_0_#000] dark:border-white dark:bg-lime-500/40 dark:text-black dark:shadow-[6px_6px_0_0_#fff]">
                  {t.fileLabel}: {fileName}
                </div>
              )}
            </div>
            <div className="relative mt-8 space-y-3 rounded-xl border-4 border-black bg-gray-100 px-4 py-3 font-mono text-sm shadow-[6px_6px_0_0_#000] dark:border-white dark:bg-gray-800 dark:text-white dark:shadow-[6px_6px_0_0_#fff]">
              <p className="font-bold uppercase tracking-wide">{t.tipsTitle}</p>
              <ul className="list-disc space-y-2 pl-5">
                {t.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="overflow-hidden rounded-3xl border-4 border-black bg-white shadow-[10px_10px_0_0_#000] dark:border-white dark:bg-gray-900 dark:shadow-[10px_10px_0_0_#fff]">
              <div className="flex items-center justify-between border-b-4 border-black px-6 py-4 dark:border-white">
                <div>
                  <p className="text-xs font-mono uppercase tracking-wide text-gray-600 dark:text-gray-300">
                    {t.previewTitle}
                  </p>
                  <p className="text-lg font-black">{fileName || "SVG PREVIEW"}</p>
                </div>
              </div>
              <div className="relative min-h-[260px] bg-white px-6 py-6 dark:bg-gray-900">
                {previewUrl ? (
                  <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-black bg-gray-50 p-4 shadow-[6px_6px_0_0_#000] dark:border-white dark:bg-gray-800 dark:shadow-[6px_6px_0_0_#fff]">
                    <img
                      src={previewUrl}
                      alt={fileName || "SVG preview"}
                      className="max-h-[320px] w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-full min-h-[240px] items-center justify-center rounded-xl border-2 border-dashed border-black bg-gray-50 p-6 text-center text-sm font-mono text-gray-600 shadow-[6px_6px_0_0_#000] dark:border-white dark:bg-gray-800 dark:text-gray-200 dark:shadow-[6px_6px_0_0_#fff]">
                    {t.emptyState}
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border-4 border-black bg-white shadow-[10px_10px_0_0_#000] dark:border-white dark:bg-gray-900 dark:shadow-[10px_10px_0_0_#fff]">
              <div className="flex items-center justify-between border-b-4 border-black px-6 py-4 dark:border-white">
                <div>
                  <p className="text-xs font-mono uppercase tracking-wide text-gray-600 dark:text-gray-300">
                    {t.codeTitle}
                  </p>
                  <p className="text-lg font-black">{fileName || "RAW SVG"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!svgMarkup}
                    onClick={copyCode}
                    className="border-2 border-black bg-white text-black shadow-[4px_4px_0_0_#000] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#000] disabled:cursor-not-allowed disabled:shadow-none dark:border-white dark:bg-gray-800 dark:text-white dark:shadow-[4px_4px_0_0_#fff] dark:hover:shadow-[6px_6px_0_0_#fff]"
                  >
                    {copied ? <Check className="mr-2 h-4 w-4" /> : <Clipboard className="mr-2 h-4 w-4" />}
                    {copied ? t.copySuccess : t.copyCode}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearSelection}
                    className="border-2 border-black bg-white text-black shadow-[4px_4px_0_0_#000] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#000] dark:border-white dark:bg-gray-800 dark:text-white dark:shadow-[4px_4px_0_0_#fff] dark:hover:shadow-[6px_6px_0_0_#fff]"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t.clear}
                  </Button>
                </div>
              </div>
              <div className="relative bg-gray-50 px-6 py-4 dark:bg-gray-950">
                <pre className="h-[280px] overflow-auto rounded-xl border-2 border-black bg-white p-4 font-mono text-xs leading-relaxed shadow-[6px_6px_0_0_#000] dark:border-white dark:bg-gray-900 dark:text-gray-100 dark:shadow-[6px_6px_0_0_#fff]">
                  {svgMarkup || t.emptyState}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border-4 border-black bg-white p-6 shadow-[10px_10px_0_0_#000] dark:border-white dark:bg-gray-900 dark:shadow-[10px_10px_0_0_#fff]">
            <p className="text-xs font-mono uppercase tracking-wide text-gray-600 dark:text-gray-300">{t.howToTitle}</p>
            <div className="mt-4 space-y-4">
              {t.steps.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-2xl border-2 border-black bg-gray-50 px-4 py-3 shadow-[6px_6px_0_0_#000] dark:border-white dark:bg-gray-800 dark:shadow-[6px_6px_0_0_#fff]"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lime-400 font-mono text-lg font-black text-black shadow-[3px_3px_0_0_#000] dark:bg-lime-500 dark:text-black dark:shadow-[3px_3px_0_0_#fff]">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-lg font-black">{step.title}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-200">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border-4 border-black bg-white p-6 pb-8 shadow-[10px_10px_0_0_#000] dark:border-white dark:bg-gray-900 dark:shadow-[10px_10px_0_0_#fff]">
            <p className="text-xs font-mono uppercase tracking-wide text-gray-600 dark:text-gray-300">{t.faqTitle}</p>
            <Accordion type="single" collapsible className="mt-4 space-y-3 pb-2">
              {t.faq.map((item) => (
                <AccordionItem
                  key={item.question}
                  value={item.question}
                  className="overflow-hidden rounded-2xl border-2 border-black bg-gray-50 shadow-[6px_6px_0_0_#000] last:border-b-2 dark:border-white dark:bg-gray-800 dark:shadow-[6px_6px_0_0_#fff] dark:last:border-b-2"
                >
                  <AccordionTrigger className="px-4 py-3 text-left text-sm font-black leading-snug">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-6 text-sm text-gray-700 dark:text-gray-200">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  )
}
