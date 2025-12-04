/**
 * DocumentUpload Component
 *
 * Drag-and-drop file upload interface for business documents.
 * Supports PDF, DOCX, MD files (max 10MB each, max 5 files).
 *
 * Story: 08.4 - Implement Document Upload and Extraction Pipeline
 */

'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/markdown': ['.md'],
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_FILES = 5

interface FileWithPreview extends File {
  preview?: string
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error'
  uploadError?: string
}

interface DocumentUploadProps {
  businessId: string
  onUploadComplete?: (data: any) => void
  onUploadError?: (error: string) => void
}

export function DocumentUpload({
  businessId,
  onUploadComplete,
  onUploadError,
}: DocumentUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null)

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map((file) => {
        const errorCode = file.errors[0]?.code
        if (errorCode === 'file-too-large') {
          return `${file.file.name} is too large (max 10MB)`
        }
        if (errorCode === 'file-invalid-type') {
          return `${file.file.name} is not a supported file type`
        }
        return `${file.file.name} was rejected`
      })
      setError(errors.join(', '))
      return
    }

    // Check total file count
    if (files.length + acceptedFiles.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files allowed`)
      return
    }

    // Add accepted files
    const newFiles = acceptedFiles.map((file) => {
      const fileWithPreview: FileWithPreview = Object.assign(file, {
        preview: URL.createObjectURL(file),
        uploadStatus: 'pending' as const,
      })
      return fileWithPreview
    })

    setFiles((prev) => [...prev, ...newFiles])
  }, [files.length])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: MAX_FILES - files.length,
    disabled: uploading,
  })

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev]
      const removed = newFiles.splice(index, 1)[0]
      if (removed.preview) {
        URL.revokeObjectURL(removed.preview)
      }
      return newFiles
    })
    setError(null)
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    setUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      const formData = new FormData()
      files.forEach((file) => {
        formData.append('files', file)
      })

      const response = await fetch(`/api/businesses/${businessId}/documents`, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Upload failed')
      }

      setUploadProgress(100)

      // Update file statuses
      setFiles((prev) =>
        prev.map((file) => ({
          ...file,
          uploadStatus: 'success' as const,
        }))
      )

      // Callback with results
      onUploadComplete?.(result.data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload documents'
      setError(errorMessage)
      onUploadError?.(errorMessage)

      // Mark files as errored
      setFiles((prev) =>
        prev.map((file) => ({
          ...file,
          uploadStatus: 'error' as const,
          uploadError: errorMessage,
        }))
      )
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') return '📄'
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      return '📝'
    if (file.type === 'text/markdown') return '📋'
    return '📁'
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50',
          uploading && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        {isDragActive ? (
          <p className="text-lg font-medium">Drop files here...</p>
        ) : (
          <>
            <p className="text-lg font-medium mb-2">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-muted-foreground">
              Supports PDF, DOCX, MD files • Max 10MB per file • Up to {MAX_FILES} files
            </p>
          </>
        )}
      </div>

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              Selected Files ({files.length}/{MAX_FILES})
            </h3>
            {!uploading && (
              <Button size="sm" onClick={() => setFiles([])}>
                Clear All
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 border rounded-lg bg-card"
              >
                <div className="text-2xl">{getFileIcon(file)}</div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {file.uploadStatus === 'success' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {file.uploadStatus === 'error' && (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                  {!uploading && file.uploadStatus === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Uploading and extracting...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      {/* Upload button */}
      {files.length > 0 && !uploading && files.some((f) => f.uploadStatus === 'pending') && (
        <Button onClick={uploadFiles} className="w-full" size="lg">
          <Upload className="mr-2 h-4 w-4" />
          Upload {files.length} {files.length === 1 ? 'File' : 'Files'}
        </Button>
      )}

      {/* Processing indicator */}
      {uploading && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing documents and extracting data...
        </div>
      )}
    </div>
  )
}
