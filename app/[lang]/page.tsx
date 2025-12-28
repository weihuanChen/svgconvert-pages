"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Upload, Download, X, SettingsIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { getTranslation, type Locale, locales, defaultLocale } from "@/app/i18n"
import { useConversionStore } from "@/lib/stores/conversion-store"
import { uploadFile, getTaskStatus, getDownloadUrl, downloadFile, getErrorMessage } from "@/lib/api-client"

type FileStatus = "PENDING" | "CONVERTING" | "COMPLETED" | "ERROR"

interface UploadedFile {
  id: string
  name: string
  size: number
  targetFormat: string
  status: FileStatus
  downloadUrl?: string
  taskId?: string
  file?: File
  progress?: number
  error?: string
}

interface PageProps {
  params: Promise<{ lang: string }>
}

export default function SVGConverterPage({ params }: PageProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [targetFormat, setTargetFormat] = useState("PNG")
  const [quality, setQuality] = useState([80])
  const [transparency, setTransparency] = useState(true)
  const [batchProcess, setBatchProcess] = useState(false)
  const [lang, setLang] = useState<Locale>(defaultLocale)
  const [isDownloading, setIsDownloading] = useState<Record<string, boolean>>({})

  // 使用 useMemo 避免在 useEffect 中处理 Promise
  const langPromise = useMemo(() => params, [params])

  useEffect(() => {
    langPromise.then((p) => {
      const paramLang = p.lang as Locale
      if (locales.includes(paramLang)) {
        setLang(paramLang)
      } else {
        setLang(defaultLocale)
      }
    })
  }, [langPromise])

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
      file: file, // Store the actual File object for upload
      progress: 0,
    }))

    setFiles((prev) => [...prev, ...uploadedFiles])
  }

  const startConversion = async () => {
    // Get all pending files
    const pendingFiles = files.filter((f) => f.status === "PENDING")

    if (pendingFiles.length === 0) {
      return
    }

    // Process each file
    for (const uploadedFile of pendingFiles) {
      if (!uploadedFile.file) {
        console.error(`No file object for ${uploadedFile.id}`)
        continue
      }

      try {
        // Mark as converting
        setFiles((prev) =>
          prev.map((f) => (f.id === uploadedFile.id ? { ...f, status: "CONVERTING" as FileStatus, progress: 0 } : f)),
        )

        // Upload file with options
        // Use current targetFormat state instead of saved value, so user can change format after uploading
        const response = await uploadFile(
          uploadedFile.file,
          {
            targetFormat: targetFormat.toLowerCase() as any,
            quality: quality[0],
            transparency: transparency,
          },
          (progress) => {
            // Update progress
            setFiles((prev) =>
              prev.map((f) => (f.id === uploadedFile.id ? { ...f, progress } : f)),
            )
          },
        )

        if (response.success && response.taskId) {
          // Store taskId and keep status as CONVERTING while waiting for backend processing
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadedFile.id
                ? {
                    ...f,
                    taskId: response.taskId,
                    status: "CONVERTING" as FileStatus,
                    progress: 50, // Upload complete, now processing
                  }
                : f,
            ),
          )

          console.log(`[Upload Success] File: ${uploadedFile.name}, TaskId: ${response.taskId}`)

          // Start polling for task completion
          pollTaskCompletion(uploadedFile.id, response.taskId)
        } else {
          throw new Error(response.error?.message || "Upload failed")
        }
      } catch (error) {
        console.error(`[Upload Error] File: ${uploadedFile.name}`, error)
        const errorMsg = getErrorMessage(error, lang === "ja" ? "ja" : lang === "zh" ? "zh" : "en")

        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id
              ? {
                  ...f,
                  status: "ERROR" as FileStatus,
                  error: errorMsg,
                }
              : f,
          ),
        )
      }
    }
  }

  const pollTaskCompletion = async (fileId: string, taskId: string) => {
    const maxAttempts = 60 // 最多轮询 60 次（2 分钟，每 2 秒一次）
    let attempts = 0

    const poll = async () => {
      try {
        attempts++
        // Use api-client's getTaskStatus function instead of hardcoded URL
        const data = await getTaskStatus(taskId)

        // 添加详细日志以诊断响应格式问题
        console.log(`[Poll] Attempt ${attempts} - Response:`, JSON.stringify(data, null, 2))

        if (data.success && data.task) {
          const taskStatus = data.task.status.toLowerCase()
          console.log(`[Poll] Task status: ${taskStatus}`)

          if (taskStatus === "completed") {
            // 转换完成
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileId
                  ? {
                      ...f,
                      status: "COMPLETED" as FileStatus,
                      progress: 100,
                    }
                  : f,
              ),
            )
            console.log(`[Conversion Complete] TaskId: ${taskId}`)
            return
          } else if (taskStatus === "failed") {
            // 转换失败
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileId
                  ? {
                      ...f,
                      status: "ERROR" as FileStatus,
                      error: data.task.error || "Conversion failed",
                    }
                  : f,
              ),
            )
            console.error(`[Conversion Failed] TaskId: ${taskId}`, data.task.error)
            return
          } else if (taskStatus === "processing") {
            // 正在处理中，更新进度
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileId
                  ? {
                      ...f,
                      progress: 75, // 处理中
                    }
                  : f,
              ),
            )
          }
        }

        // 如果还没完成且未超过最大尝试次数，继续轮询
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000) // 2 秒后再次检查
        } else {
          // 超时
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    status: "ERROR" as FileStatus,
                    error: "Conversion timeout - please try again",
                  }
                : f,
            ),
          )
          console.error(`[Conversion Timeout] TaskId: ${taskId}`)
        }
      } catch (error) {
        console.error(`[Polling Error] TaskId: ${taskId}`, error)
        // 继续轮询，除非超过最大尝试次数
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000)
        }
      }
    }

    // 开始轮询
    poll()
  }

  const cancelAll = () => {
    setFiles([])
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id))
  }

  const handleDownload = async (fileId: string) => {
    setIsDownloading((prev) => ({ ...prev, [fileId]: true }))

    try {
      const file = files.find((f) => f.id === fileId)
      if (!file) {
        alert("文件不存在")
        return
      }

      if (!file.taskId) {
        alert("任务ID不存在，无法下载")
        return
      }

      // 获取下载URL - Use taskId instead of fileId
      const response = await getDownloadUrl(file.taskId)

      if (!response.success || !response.downloadUrl) {
        throw new Error("无法获取下载链接")
      }

      // 触发下载
      await downloadFile(response.downloadUrl, response.fileName || file.name)
    } catch (error) {
      const errorMsg = getErrorMessage(error, lang === "ja" ? "ja" : lang === "zh" ? "zh" : "en")
      alert(`下载失败: ${errorMsg}`)
      console.error("Download error:", error)
    } finally {
      setIsDownloading((prev) => ({ ...prev, [fileId]: false }))
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
    return (bytes / (1024 * 1024)).toFixed(2) + " MB"
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors">

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

            {/* SEO Section */}
            <div className="max-w-4xl mx-auto mb-16">
              <h3 className="text-3xl font-bold text-center mb-8 text-black dark:text-white font-mono">{t.seoSection.title}</h3>
              <p className="text-center text-lg text-black/80 dark:text-white/80 mb-8 font-mono">{t.seoSection.description}</p>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Features */}
                <div className="border-4 border-black dark:border-white shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff] bg-white dark:bg-gray-800 p-6">
                  <h4 className="text-xl font-bold mb-4 text-black dark:text-white font-mono">{t.seoSection.features.title}</h4>
                  <ul className="space-y-2 text-black dark:text-white">
                    <li className="flex items-start">
                      <span className="mr-2 font-bold">•</span>
                      <span>{t.seoSection.features.item1}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 font-bold">•</span>
                      <span>{t.seoSection.features.item2}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 font-bold">•</span>
                      <span>{t.seoSection.features.item3}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 font-bold">•</span>
                      <span>{t.seoSection.features.item4}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 font-bold">•</span>
                      <span>{t.seoSection.features.item5}</span>
                    </li>
                  </ul>
                </div>

                {/* Boundaries */}
                <div className="border-4 border-black dark:border-white shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff] bg-white dark:bg-gray-800 p-6">
                  <h4 className="text-xl font-bold mb-4 text-black dark:text-white font-mono">{t.seoSection.boundaries.title}</h4>
                  <ul className="space-y-2 text-black dark:text-white">
                    <li className="flex items-start">
                      <span className="mr-2 font-bold">•</span>
                      <span>{t.seoSection.boundaries.item1}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 font-bold">•</span>
                      <span>{t.seoSection.boundaries.item2}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 font-bold">•</span>
                      <span>{t.seoSection.boundaries.item3}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 font-bold">•</span>
                      <span>{t.seoSection.boundaries.item4}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 font-bold">•</span>
                      <span>{t.seoSection.boundaries.item5}</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* History Feature */}
              <div className="border-4 border-black dark:border-white shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff] bg-white dark:bg-gray-800 p-6 mb-6">
                <h4 className="text-xl font-bold mb-3 text-black dark:text-white font-mono">{t.seoSection.history.title}</h4>
                <p className="text-black dark:text-white mb-4 font-mono">{t.seoSection.history.description}</p>
                <ul className="space-y-2 text-black dark:text-white">
                  {t.seoSection.history.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-2 font-bold">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Privacy Policy */}
              <div className="border-4 border-black dark:border-white shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff] bg-white dark:bg-gray-800 p-6">
                <h4 className="text-xl font-bold mb-3 text-black dark:text-white font-mono">{t.seoSection.privacy.title}</h4>
                <p className="text-black dark:text-white mb-4 font-mono">{t.seoSection.privacy.description}</p>
                <ul className="space-y-2 text-black dark:text-white">
                  {t.seoSection.privacy.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-2 font-bold">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* FAQ */}
            <div className="max-w-3xl mx-auto">
              <h3 className="text-3xl font-bold text-center mb-8 text-black dark:text-white font-mono">{t.faq}</h3>
              <Accordion type="multiple" defaultValue={["item-0", "item-1", "item-2"]} className="space-y-4">
                {[
                  { q: t.faqQuestion1, a: t.faqAnswer1 },
                  { q: t.faqQuestion2, a: t.faqAnswer2 },
                  { q: t.faqQuestion3, a: t.faqAnswer3 },
                ].map((faq, idx) => (
                  <AccordionItem
                    key={idx}
                    value={`item-${idx}`}
                    className="border-4 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] bg-white dark:bg-gray-800 px-6 last:border-b-4"
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
                          onClick={() => handleDownload(file.id)}
                          disabled={isDownloading[file.id]}
                          className="bg-lime-500 hover:bg-lime-600 text-black border-2 border-black font-bold shadow-[2px_2px_0_0_#000] disabled:opacity-50"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          {isDownloading[file.id] ? "下载中..." : t.download}
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
                        <SelectItem value="WEBP">WebP</SelectItem>
                        <SelectItem value="GIF">GIF</SelectItem>
                        <SelectItem value="PDF">PDF</SelectItem>
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
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-black dark:text-white font-mono text-center sm:text-left">
              © 2025 SVG Converter • Powered by Cloudflare
            </p>
            <div className="flex justify-center sm:justify-end">
              <Link href={`/${lang}/user-service`} className="inline-flex">
                <Button className="border-4 border-black bg-lime-500 text-black shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000] font-mono">
                  {t.userServiceAgreement}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
