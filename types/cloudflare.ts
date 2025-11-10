/**
 * Cloudflare Services Type Definitions
 *
 * This file contains all TypeScript interfaces and types for interacting with
 * Cloudflare services: R2, D1, KV, and Queues.
 */

// ============================================================================
// Task Status & Conversion Types
// ============================================================================

/**
 * Task processing status enum
 */
export enum TaskStatus {
  PENDING = 'PENDING',       // Task created, waiting in queue
  PROCESSING = 'PROCESSING', // VPS is processing the task
  COMPLETED = 'COMPLETED',   // Conversion successful
  FAILED = 'FAILED',         // Conversion failed
  CANCELLED = 'CANCELLED'    // User cancelled the task
}

/**
 * Supported file formats for conversion
 */
export type FileFormat = 'svg' | 'png' | 'jpg' | 'jpeg' | 'pdf' | 'eps'

/**
 * Conversion direction
 */
export type ConversionDirection =
  | 'svg-to-raster'  // SVG → PNG/JPG
  | 'svg-to-vector'  // SVG → PDF/EPS
  | 'raster-to-svg'  // PNG/JPG → SVG
  | 'vector-to-svg'  // PDF/EPS → SVG

// ============================================================================
// Conversion Parameters
// ============================================================================

/**
 * Base conversion options
 */
export interface BaseConversionOptions {
  /** Target output format */
  targetFormat: FileFormat

  /** User ID (for tracking and cleanup) */
  userId?: string

  /** Language code for error messages */
  locale?: 'ja' | 'en' | 'zh'
}

/**
 * Options for SVG to raster (PNG/JPG) conversion
 */
export interface SVGToRasterOptions extends BaseConversionOptions {
  targetFormat: 'png' | 'jpg' | 'jpeg'

  /** Output width in pixels */
  width?: number

  /** Output height in pixels */
  height?: number

  /** Background color (hex or 'transparent' for PNG) */
  backgroundColor?: string

  /** JPEG quality (1-100, default: 85) */
  quality?: number

  /** Enable PNG optimization */
  optimize?: boolean
}

/**
 * Options for raster to SVG conversion (vectorization)
 */
export interface RasterToSVGOptions extends BaseConversionOptions {
  targetFormat: 'svg'

  /** Vectorization algorithm mode */
  mode?: 'edge-detection' | 'color-tracing' | 'simplified'

  /** Maximum number of colors in output SVG */
  maxColors?: number

  /** Path smoothness (0-1, higher = smoother) */
  smoothness?: number
}

/**
 * Options for vector format conversions (SVG ↔ PDF/EPS)
 */
export interface VectorConversionOptions extends BaseConversionOptions {
  targetFormat: 'pdf' | 'eps' | 'svg'

  /** Page size for PDF output */
  pageSize?: 'A4' | 'Letter' | 'Custom'

  /** Custom dimensions (for pageSize='Custom') */
  customWidth?: number
  customHeight?: number
}

/**
 * Union type for all conversion options
 */
export type ConversionOptions =
  | SVGToRasterOptions
  | RasterToSVGOptions
  | VectorConversionOptions

// ============================================================================
// Task & File Metadata
// ============================================================================

/**
 * Task metadata stored in D1/KV
 */
export interface TaskMetadata {
  /** Unique task ID (UUID v4) */
  taskId: string

  /** User ID (optional, for authenticated users) */
  userId?: string

  /** Original file name */
  originalFileName: string

  /** Source file format */
  sourceFormat: FileFormat

  /** Target file format */
  targetFormat: FileFormat

  /** R2 key for source file */
  sourceFileKey: string

  /** R2 key for output file (set after completion) */
  outputFileKey?: string

  /** Current task status */
  status: TaskStatus

  /** Conversion options */
  options: ConversionOptions

  /** Task creation timestamp (ISO 8601) */
  createdAt: string

  /** Task start timestamp (ISO 8601) */
  startedAt?: string

  /** Task completion timestamp (ISO 8601) */
  completedAt?: string

  /** Error message (if status is FAILED) */
  errorMessage?: string

  /** File size in bytes (original) */
  sourceFileSize: number

  /** Output file size in bytes */
  outputFileSize?: number

  /** Processing duration in milliseconds */
  processingDuration?: number
}

// ============================================================================
// Queue Message Format
// ============================================================================

/**
 * Message payload for Cloudflare Queues
 *
 * This message is sent from Workers to VPS via Cloudflare Queues
 */
export interface QueueMessage {
  /** Task ID for tracking */
  taskId: string

  /** R2 bucket name */
  bucketName: string

  /** R2 key for source file */
  sourceFileKey: string

  /** Original file name */
  fileName: string

  /** Source file format */
  sourceFormat: FileFormat

  /** Conversion options */
  options: ConversionOptions

  /** Callback URL for VPS to report completion */
  callbackUrl: string

  /** Authentication token for callback */
  callbackToken: string
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * POST /api/upload - Request body
 */
export interface UploadRequest {
  /** File data (base64 or multipart) */
  file: File | Blob

  /** Original file name */
  fileName: string

  /** Conversion options */
  options: ConversionOptions
}

/**
 * POST /api/upload - Response
 */
export interface UploadResponse {
  success: boolean
  taskId: string
  message: string
}

/**
 * GET /api/status/:taskId - Response
 */
export interface StatusResponse {
  success: boolean
  task: TaskMetadata
}

/**
 * GET /api/download/:taskId - Response
 */
export interface DownloadResponse {
  success: boolean
  /** Pre-signed R2 URL for direct download */
  downloadUrl: string
  /** File name for download */
  fileName: string
  /** File size in bytes */
  fileSize: number
  /** URL expiration time (ISO 8601) */
  expiresAt: string
}

/**
 * POST /api/callback - Request body (from VPS)
 */
export interface CallbackRequest {
  /** Task ID */
  taskId: string

  /** Task status after processing */
  status: TaskStatus.COMPLETED | TaskStatus.FAILED

  /** R2 key for output file (if successful) */
  outputFileKey?: string

  /** Output file size in bytes */
  outputFileSize?: number

  /** Error message (if failed) */
  errorMessage?: string

  /** Processing duration in milliseconds */
  processingDuration: number

  /** Authentication token */
  token: string
}

/**
 * POST /api/callback - Response
 */
export interface CallbackResponse {
  success: boolean
  message: string
}

/**
 * DELETE /api/cleanup/:taskId - Response
 */
export interface CleanupResponse {
  success: boolean
  message: string
  deletedFiles: string[]
}

// ============================================================================
// Error Response Type
// ============================================================================

/**
 * Standard error response format
 */
export interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

// ============================================================================
// Cloudflare Service Bindings (for Workers/Pages)
// ============================================================================

/**
 * Environment bindings for Cloudflare Workers/Pages
 *
 * These should be configured in wrangler.toml
 */
export interface CloudflareEnv {
  // R2 Bucket binding
  SVG_CONVERTER_BUCKET: R2Bucket

  // D1 Database binding
  SVG_CONVERTER_DB: D1Database

  // KV Namespace binding
  SVG_CONVERTER_KV: KVNamespace

  // Queue binding
  SVG_CONVERTER_QUEUE: Queue

  // Environment variables
  VPS_CALLBACK_SECRET: string
  R2_PUBLIC_URL: string
  MAX_FILE_SIZE: string
  FILE_RETENTION_MINUTES: string
}

/**
 * R2 Bucket interface (Cloudflare SDK)
 */
export interface R2Bucket {
  put(key: string, value: ReadableStream | ArrayBuffer | string, options?: R2PutOptions): Promise<R2Object>
  get(key: string, options?: R2GetOptions): Promise<R2Object | null>
  delete(key: string): Promise<void>
  list(options?: R2ListOptions): Promise<R2Objects>
}

export interface R2PutOptions {
  httpMetadata?: {
    contentType?: string
    contentDisposition?: string
  }
  customMetadata?: Record<string, string>
}

export interface R2GetOptions {
  range?: { offset: number; length?: number }
}

export interface R2ListOptions {
  prefix?: string
  delimiter?: string
  cursor?: string
  limit?: number
}

export interface R2Object {
  key: string
  size: number
  etag: string
  httpEtag: string
  uploaded: Date
  httpMetadata: {
    contentType?: string
  }
  customMetadata: Record<string, string>
  body: ReadableStream
  arrayBuffer(): Promise<ArrayBuffer>
  text(): Promise<string>
  json<T>(): Promise<T>
  blob(): Promise<Blob>
}

export interface R2Objects {
  objects: R2Object[]
  truncated: boolean
  cursor?: string
  delimitedPrefixes: string[]
}

/**
 * D1 Database interface (Cloudflare SDK)
 */
export interface D1Database {
  prepare(query: string): D1PreparedStatement
  dump(): Promise<ArrayBuffer>
  batch<T>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>
  exec(query: string): Promise<D1ExecResult>
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = unknown>(colName?: string): Promise<T>
  run(): Promise<D1Result>
  all<T = unknown>(): Promise<D1Result<T>>
  raw<T = unknown>(): Promise<T[]>
}

export interface D1Result<T = unknown> {
  results: T[]
  success: boolean
  meta: {
    duration: number
    rows_read: number
    rows_written: number
  }
}

export interface D1ExecResult {
  count: number
  duration: number
}

/**
 * KV Namespace interface (Cloudflare SDK)
 */
export interface KVNamespace {
  get(key: string, options?: { type: 'text' }): Promise<string | null>
  get(key: string, options: { type: 'json' }): Promise<unknown>
  get(key: string, options: { type: 'arrayBuffer' }): Promise<ArrayBuffer | null>
  get(key: string, options: { type: 'stream' }): Promise<ReadableStream | null>
  put(key: string, value: string | ArrayBuffer | ReadableStream, options?: KVPutOptions): Promise<void>
  delete(key: string): Promise<void>
  list(options?: KVListOptions): Promise<KVListResult>
}

export interface KVPutOptions {
  expiration?: number
  expirationTtl?: number
  metadata?: unknown
}

export interface KVListOptions {
  prefix?: string
  limit?: number
  cursor?: string
}

export interface KVListResult {
  keys: { name: string; expiration?: number; metadata?: unknown }[]
  list_complete: boolean
  cursor?: string
}

/**
 * Queue interface (Cloudflare SDK)
 */
export interface Queue {
  send(message: QueueMessage): Promise<void>
  sendBatch(messages: QueueMessage[]): Promise<void>
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Type guard to check if a format is a raster format
 */
export function isRasterFormat(format: FileFormat): format is 'png' | 'jpg' | 'jpeg' {
  return ['png', 'jpg', 'jpeg'].includes(format)
}

/**
 * Type guard to check if a format is a vector format
 */
export function isVectorFormat(format: FileFormat): format is 'svg' | 'pdf' | 'eps' {
  return ['svg', 'pdf', 'eps'].includes(format)
}

/**
 * Get MIME type from file format
 */
export function getMimeType(format: FileFormat): string {
  const mimeTypes: Record<FileFormat, string> = {
    svg: 'image/svg+xml',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    pdf: 'application/pdf',
    eps: 'application/postscript'
  }
  return mimeTypes[format]
}

/**
 * Generate unique task ID (UUID v4)
 */
export function generateTaskId(): string {
  return crypto.randomUUID()
}

/**
 * Generate R2 file key with timestamp prefix for organization
 */
export function generateR2Key(taskId: string, fileName: string, type: 'source' | 'output'): string {
  const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${type}/${timestamp}/${taskId}/${sanitizedFileName}`
}
