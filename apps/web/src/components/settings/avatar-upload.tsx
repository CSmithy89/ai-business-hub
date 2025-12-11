'use client'

/**
 * Avatar Upload Component
 * Story 15.6: Implements avatar upload with drag-drop and preview
 */

import { useState, useRef, useCallback } from 'react'
import { Camera, Upload, X, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AvatarUploadProps {
  currentImage?: string | null
  onImageChange: (imageBase64: string | null) => void
  disabled?: boolean
  className?: string
}

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export function AvatarUpload({
  currentImage,
  onImageChange,
  disabled = false,
  className,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Please upload a JPG, PNG, GIF, or WebP image'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Image must be smaller than 2MB'
    }
    return null
  }

  const processFile = useCallback((file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      setPreview(base64)
      onImageChange(base64)
    }
    reader.onerror = () => {
      setError('Failed to read file')
    }
    reader.readAsDataURL(file)
  }, [onImageChange])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (disabled) return

    const file = e.dataTransfer.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreview(null)
    setError(null)
    onImageChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative w-32 h-32 rounded-full overflow-hidden cursor-pointer',
          'border-2 border-dashed transition-colors duration-200',
          'flex items-center justify-center',
          'group',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Avatar preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="h-8 w-8 text-white" />
            </div>
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-0 right-0 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleRemove}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            {isDragging ? (
              <Upload className="h-8 w-8 text-primary" />
            ) : (
              <User className="h-12 w-12" />
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <p className="text-xs text-muted-foreground">
        Click or drag to upload. Max 2MB (JPG, PNG, GIF, WebP)
      </p>
    </div>
  )
}
