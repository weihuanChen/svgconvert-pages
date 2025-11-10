"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Upload, Sun, Moon, Share2, Download, X, SettingsIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useTheme } from "next-themes"
import { getTranslation, type Locale, locales, defaultLocale } from "@/app/i18n"
import { useRouter } from "next/navigation"

type FileStatus = "PENDING" | "CONVERTING" | "COMPLETED" | "ERROR"

interface UploadedFile {
  id: string
  name: string
  size: number
  targetFormat: string
  status: FileStatus
  downloadUrl?: string
}

interface PageProps {
  params: Promise<{ lang: string }>
}

export default function SVGConverterPage({ params }: PageProps) {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [targetFormat, setTargetFormat] = useState("PNG")
  const [quality, setQuality] = useState([80])
  const [transparency, setTransparency] = useState(true)
  const [batchProcess, setBatchProcess] = useState(false)
  const { theme, setTheme } = useTheme()
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [lang, setLang] = useState<Locale>(defaultLocale)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    // Get language from params
    params.then((p) => {
      const paramLang = p.lang as Locale
      if (locales.includes(paramLang)) {
        setLang(paramLang)
      } else {
        setLang(defaultLocale)
      }
      setIsLoading(false)
    })
  }, [params])

  const t = getTranslation(lang)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      handleFiles(selectedFiles)
    }
  }

  const handleFiles = (newFiles: File[]) => {
    const uploadedFiles: UploadedFile[] = newFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      targetFormat: targetFormat,
      status: "PENDING" as FileStatus,
    }))

    setFiles((prev) => [...prev, ...uploadedFiles])
  }

  const startConversion = () => {
    setFiles((prev) =>
      prev.map((file) => (file.status === "PENDING" ? { ...file, status: "CONVERTING" as FileStatus } : file)),
    )

    // Simulate conversion
    setTimeout(() => {
      setFiles((prev) =>
        prev.map((file) =>
          file.status === "CONVERTING"
            ? {
                ...file,
                status: "COMPLETED" as FileStatus,
                downloadUrl: "#",
              }
            : file,
        ),
      )
    }, 2000)
  }

  const cancelAll = () => {
    setFiles([])
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
    return (bytes / (1024 * 1024)).toFixed(2) + " MB"
  }

  const copyLink = () => {
    const currentUrl = window.location.href
    navigator.clipboard.writeText(currentUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleLanguageChange = (newLang: string) => {
    if (locales.includes(newLang as Locale)) {
      router.push(`/${newLang}`)
    }
  }

  if (!mounted || isLoading) {
    return null
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors">
      {/* Header */}
      <header className="border-b-4 border-black dark:border-white bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="text-2xl md:text-3xl font-bold font-mono text-black dark:text-white">SVG CONVERTER</h1>

            <div className="flex items-center gap-3">
              <Select value={lang} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-20 border-4 border-black dark:border-white bg-white dark:bg-gray-800 text-black dark:text-white font-mono font-bold shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-4 border-black dark:border-white bg-white dark:bg-gray-800">
                  <SelectItem value="ja">JA</SelectItem>
                  <SelectItem value="en">EN</SelectItem>
                  <SelectItem value="zh">ZH</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="border-4 border-black dark:border-white bg-white dark:bg-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={copyLink}
                className="border-4 border-black dark:border-white bg-white dark:bg-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] relative"
                title={t.shareLink}
              >
                <Share2 className="h-5 w-5" />
                {copied && (
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-mono bg-lime-500 dark:bg-lime-500 text-black px-2 py-1 border-2 border-black dark:border-white whitespace-nowrap shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]">
                    {t.linkCopied}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {files.length === 0 ? (
          <>
            {/* Hero Section */}
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold text-black dark:text-white mb-4">{t.title}</h2>
              <p className="text-xl md:text-2xl text-black dark:text-white font-mono">{t.subtitle}</p>
            </div>

            {/* Drop Zone */}
            <div className="max-w-3xl mx-auto mb-16">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  border-4 border-black dark:border-white
                  shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff]
                  bg-gray-100 dark:bg-gray-800
                  p-12 md:p-20
                  text-center
                  cursor-pointer
                  transition-all
                  ${isDragging ? "scale-105 shadow-[12px_12px_0_0_#000] dark:shadow-[12px_12px_0_0_#fff]" : ""}
                `}
              >
                <input
                  type="file"
                  id="fileInput"
                  multiple
                  accept=".svg,.png,.jpg,.jpeg,.pdf"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <label htmlFor="fileInput" className="cursor-pointer">
                  <Upload className="w-16 h-16 mx-auto mb-6 text-black dark:text-white" />
                  <p className="text-2xl font-bold text-black dark:text-white mb-2 font-mono">{t.dropZone}</p>
                  <p className="text-lg text-black dark:text-white font-mono mb-4">{t.orClick}</p>
                  <p className="text-sm text-black/70 dark:text-white/70 font-mono">{t.supportedFormats}</p>
                  <p className="text-xs text-black/60 dark:text-white/60 font-mono mt-3 border-t-2 border-black/20 dark:border-white/20 pt-3">
                    {t.multiSelectHint}
                  </p>
                </label>
              </div>

              <Button
                onClick={() => document.getElementById("fileInput")?.click()}
                className="w-full mt-6 h-14 text-lg font-bold bg-lime-400 dark:bg-lime-500 hover:bg-lime-500 dark:hover:bg-lime-600 text-black border-4 border-black dark:border-black shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#000] hover:shadow-[8px_8px_0_0_#000] dark:hover:shadow-[8px_8px_0_0_#000] transition-all font-mono"
              >
                {t.uploadButton}
              </Button>
            </div>

            {/* How to Use */}
            <div className="mb-16">
              <h3 className="text-3xl font-bold text-center mb-8 text-black dark:text-white font-mono">{t.howToUse}</h3>
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {[
                  { num: "1", title: t.step1Title, content: t.step1Content },
                  { num: "2", title: t.step2Title, content: t.step2Content },
                  { num: "3", title: t.step3Title, content: t.step3Content },
                ].map((step) => (
                  <div
                    key={step.num}
                    className="border-4 border-black dark:border-white shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff] bg-white dark:bg-gray-800 p-6"
                  >
                    <div className="text-5xl font-bold mb-4 text-black dark:text-white font-mono">{step.num}</div>
                    <h4 className="text-xl font-bold mb-2 text-black dark:text-white">{step.title}</h4>
                    <p className="text-black dark:text-white">{step.content}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div className="max-w-3xl mx-auto">
              <h3 className="text-3xl font-bold text-center mb-8 text-black dark:text-white font-mono">{t.faq}</h3>
              <Accordion type="single" collapsible className="space-y-4">
                {[
                  { q: t.faqQuestion1, a: t.faqAnswer1 },
                  { q: t.faqQuestion2, a: t.faqAnswer2 },
                  { q: t.faqQuestion3, a: t.faqAnswer3 },
                ].map((faq, idx) => (
                  <AccordionItem
                    key={idx}
                    value={`item-${idx}`}
                    className="border-4 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] bg-white dark:bg-gray-800 px-6"
                  >
                    <AccordionTrigger className="text-lg font-bold text-black dark:text-white hover:no-underline">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-black dark:text-white">{faq.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </>
        ) : (
          // Conversion Status Page
          <div className="grid lg:grid-cols-3 gap-8">
            {/* File List */}
            <div className="lg:col-span-2">
              <h2 className="text-3xl font-bold mb-6 text-black dark:text-white font-mono">Files</h2>
              <div className="space-y-4">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="border-4 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] bg-white dark:bg-gray-800 p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-black dark:text-white font-mono truncate flex-1">
                        {file.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(file.id)}
                        className="ml-2 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-black dark:text-white font-mono">
                      <span>{formatFileSize(file.size)}</span>
                      <span>→ {file.targetFormat}</span>
                      <span
                        className={`
                          px-3 py-1 font-bold border-2 border-black dark:border-white
                          ${file.status === "PENDING" ? "bg-yellow-400 text-black" : ""}
                          ${file.status === "CONVERTING" ? "bg-lime-500 text-black animate-pulse" : ""}
                          ${file.status === "COMPLETED" ? "bg-black text-white dark:bg-white dark:text-black" : ""}
                          ${file.status === "ERROR" ? "bg-red-500 text-white" : ""}
                        `}
                      >
                        {file.status}
                      </span>
                      {file.status === "COMPLETED" && (
                        <Button
                          size="sm"
                          className="bg-lime-500 hover:bg-lime-600 text-black border-2 border-black font-bold shadow-[2px_2px_0_0_#000]"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          {t.download}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Settings Panel */}
            <div className="lg:col-span-1">
              <div className="border-4 border-black dark:border-white shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff] bg-white dark:bg-gray-800 p-6 sticky top-6">
                <h3 className="text-2xl font-bold mb-6 text-black dark:text-white font-mono flex items-center gap-2">
                  <SettingsIcon className="h-6 w-6" />
                  Settings
                </h3>

                <div className="space-y-6">
                  <div>
                    <Label className="text-black dark:text-white font-bold mb-2 block">{t.targetFormat}</Label>
                    <Select value={targetFormat} onValueChange={setTargetFormat}>
                      <SelectTrigger className="border-4 border-black dark:border-white bg-white dark:bg-gray-800 text-black dark:text-white font-mono font-bold shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-4 border-black dark:border-white bg-white dark:bg-gray-800">
                        <SelectItem value="PNG">PNG</SelectItem>
                        <SelectItem value="JPG">JPG</SelectItem>
                        <SelectItem value="PDF">PDF</SelectItem>
                        <SelectItem value="EPS">EPS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-black dark:text-white font-bold mb-2 block font-mono">
                      {t.quality}: {quality[0]}%
                    </Label>
                    <Slider
                      value={quality}
                      onValueChange={setQuality}
                      min={1}
                      max={100}
                      step={1}
                      className="[&_[role=slider]]:border-4 [&_[role=slider]]:border-black dark:[&_[role=slider]]:border-white [&_[role=slider]]:bg-lime-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="transparency" className="text-black dark:text-white font-bold">
                      {t.transparencyLabel}
                    </Label>
                    <Switch
                      id="transparency"
                      checked={transparency}
                      onCheckedChange={setTransparency}
                      className="data-[state=checked]:bg-lime-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="batch" className="text-black dark:text-white font-bold">
                      {t.batchLabel}
                    </Label>
                    <Switch
                      id="batch"
                      checked={batchProcess}
                      onCheckedChange={setBatchProcess}
                      className="data-[state=checked]:bg-lime-500"
                    />
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <Button
                    onClick={startConversion}
                    disabled={files.every((f) => f.status !== "PENDING")}
                    className="w-full h-12 font-bold bg-lime-500 hover:bg-lime-600 text-black border-4 border-black shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000] transition-all font-mono disabled:opacity-50"
                  >
                    {t.startConversion}
                  </Button>
                  <Button
                    onClick={cancelAll}
                    variant="outline"
                    className="w-full h-12 font-bold bg-red-500 hover:bg-red-600 text-white border-4 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] hover:shadow-[6px_6px_0_0_#000] dark:hover:shadow-[6px_6px_0_0_#fff] transition-all font-mono"
                  >
                    {t.cancelAll}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-black dark:border-white mt-20 py-8 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 text-center">
          <p className="text-black dark:text-white font-mono">© 2025 SVG Converter • Powered by Cloudflare</p>
        </div>
      </footer>
    </div>
  )
}

