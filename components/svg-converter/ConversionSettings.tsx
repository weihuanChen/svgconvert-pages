/**
 * Conversion Settings Component
 *
 * Allows users to configure conversion parameters
 */

'use client'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import type { FileFormat } from '@/types/cloudflare'
import type { Locale } from '@/app/i18n'

interface ConversionSettingsProps {
  /** Source file format */
  sourceFormat: FileFormat

  /** Target file format */
  targetFormat: FileFormat

  /** Callback when target format changes */
  onTargetFormatChange: (format: FileFormat) => void

  /** Quality setting (for JPEG) */
  quality: number

  /** Callback when quality changes */
  onQualityChange: (quality: number) => void

  /** Transparency enabled (for PNG) */
  transparency: boolean

  /** Callback when transparency changes */
  onTransparencyChange: (enabled: boolean) => void

  /** Batch mode enabled */
  batchMode: boolean

  /** Callback when batch mode changes */
  onBatchModeChange: (enabled: boolean) => void

  /** Current language */
  locale: Locale

  /** Custom translations */
  translations: {
    targetFormat: string
    quality: string
    transparency: string
    batchMode: string
    formats: Record<FileFormat, string>
  }

  /** Disable settings */
  disabled?: boolean
}

export function ConversionSettings({
  sourceFormat,
  targetFormat,
  onTargetFormatChange,
  quality,
  onQualityChange,
  transparency,
  onTransparencyChange,
  batchMode,
  onBatchModeChange,
  locale,
  translations,
  disabled = false
}: ConversionSettingsProps) {
  // Determine available target formats based on source format
  const getAvailableFormats = (): FileFormat[] => {
    const source = sourceFormat.toLowerCase()

    if (source === 'svg') {
      return ['png', 'jpg', 'pdf', 'eps']
    }

    if (['png', 'jpg', 'jpeg'].includes(source)) {
      return ['svg', 'png', 'jpg', 'pdf']
    }

    if (['pdf', 'eps'].includes(source)) {
      return ['svg', 'png', 'jpg']
    }

    return ['png', 'jpg', 'svg', 'pdf']
  }

  const availableFormats = getAvailableFormats()

  // Show quality slider only for JPEG output
  const showQuality = targetFormat === 'jpg' || targetFormat === 'jpeg'

  // Show transparency toggle only for PNG output
  const showTransparency = targetFormat === 'png'

  return (
    <div className="space-y-6 border-4 border-black dark:border-white bg-white dark:bg-neutral-900 p-6">
      <h3 className="text-xl font-bold text-black dark:text-white">
        {locale === 'ja' && '変換設定'}
        {locale === 'en' && 'Conversion Settings'}
        {locale === 'zh' && '转换设置'}
      </h3>

      <div className="space-y-4">
        {/* Target Format */}
        <div className="space-y-2">
          <Label htmlFor="target-format" className="text-base font-medium">
            {translations.targetFormat}
          </Label>
          <Select
            value={targetFormat}
            onValueChange={(value) => onTargetFormatChange(value as FileFormat)}
            disabled={disabled}
          >
            <SelectTrigger
              id="target-format"
              className="border-4 border-black dark:border-white"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableFormats.map((format) => (
                <SelectItem key={format} value={format}>
                  {translations.formats[format] || format.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quality Slider (JPEG only) */}
        {showQuality && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="quality-slider" className="text-base font-medium">
                {translations.quality}
              </Label>
              <span className="text-sm font-bold text-black dark:text-white">
                {quality}%
              </span>
            </div>
            <Slider
              id="quality-slider"
              min={1}
              max={100}
              step={1}
              value={[quality]}
              onValueChange={(values) => onQualityChange(values[0])}
              disabled={disabled}
              className="py-4"
            />
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              {locale === 'ja' && '高い値ほど品質が向上しますが、ファイルサイズが大きくなります'}
              {locale === 'en' && 'Higher values improve quality but increase file size'}
              {locale === 'zh' && '较高的值可提高质量但会增加文件大小'}
            </p>
          </div>
        )}

        {/* Transparency Toggle (PNG only) */}
        {showTransparency && (
          <div className="flex items-center justify-between space-x-2 py-2">
            <div className="space-y-0.5">
              <Label htmlFor="transparency-toggle" className="text-base font-medium">
                {translations.transparency}
              </Label>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                {locale === 'ja' && '透明な背景を有効にする'}
                {locale === 'en' && 'Enable transparent background'}
                {locale === 'zh' && '启用透明背景'}
              </p>
            </div>
            <Switch
              id="transparency-toggle"
              checked={transparency}
              onCheckedChange={onTransparencyChange}
              disabled={disabled}
            />
          </div>
        )}

        {/* Batch Mode Toggle */}
        <div className="flex items-center justify-between space-x-2 border-t-4 border-black dark:border-white pt-4">
          <div className="space-y-0.5">
            <Label htmlFor="batch-mode-toggle" className="text-base font-medium">
              {translations.batchMode}
            </Label>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              {locale === 'ja' && '複数のファイルを同時に変換'}
              {locale === 'en' && 'Convert multiple files simultaneously'}
              {locale === 'zh' && '同时转换多个文件'}
            </p>
          </div>
          <Switch
            id="batch-mode-toggle"
            checked={batchMode}
            onCheckedChange={onBatchModeChange}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  )
}
