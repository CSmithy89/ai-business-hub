/**
 * Wizard Step 1: Choice Component
 *
 * Presents two options:
 * - "I have documents" - Upload existing business documents with drag-drop zone
 * - "Start from scratch" - AI-guided process
 *
 * Story: 08.3 - Implement Onboarding Wizard UI
 * Story: 15.16 - Enhance Business Onboarding Wizard
 * Story: 16-21 - Option Card Selection Polish
 */

'use client'

import { useState, useCallback, useRef } from 'react'
import { FileText, Sparkles, ArrowRight, Upload, X, CheckCircle2, File, Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface WizardStepChoiceProps {
  initialValue?: boolean | null
  initialFiles?: string[]
  onContinue: (hasDocuments: boolean, fileNames?: string[]) => void
}

const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/markdown',
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_FILES = 5

export function WizardStepChoice({ initialValue, initialFiles: _initialFiles = [], onContinue }: WizardStepChoiceProps) {
  const [selectedOption, setSelectedOption] = useState<'documents' | 'fresh' | null>(
    initialValue === true ? 'documents' : initialValue === false ? 'fresh' : null
  )
  // Note: initialFiles contains file names from localStorage, but we can't restore actual File objects
  // Users will need to re-upload if they return to this step after page refresh
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return `${file.name}: Only PDF, DOCX, and MD files are allowed`
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: File must be less than 10MB`
    }
    return null
  }

  const handleFiles = useCallback((files: FileList | File[]) => {
    setUploadError(null)
    const fileArray = Array.from(files)

    // Check max files limit
    if (uploadedFiles.length + fileArray.length > MAX_FILES) {
      setUploadError(`Maximum ${MAX_FILES} files allowed`)
      return
    }

    const validFiles: File[] = []
    const errors: string[] = []

    for (const file of fileArray) {
      const error = validateFile(file)
      if (error) {
        errors.push(error)
      } else {
        // Check for duplicates
        if (!uploadedFiles.some(f => f.name === file.name && f.size === file.size)) {
          validFiles.push(file)
        }
      }
    }

    if (errors.length > 0) {
      setUploadError(errors[0])
    }

    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles])
      setSelectedOption('documents')
    }
  }, [uploadedFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFiles(files)
    }
  }, [handleFiles])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleContinue = () => {
    if (selectedOption) {
      const fileNames = uploadedFiles.map(f => f.name)
      onContinue(selectedOption === 'documents', fileNames)
    }
  }

  const handleKeyDown = (option: 'documents' | 'fresh', event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setSelectedOption(option)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Do you have existing business documents?</h2>
        <p className="text-muted-foreground">Choose how you&apos;d like to start</p>
      </div>

      {/* Option Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Documents Option */}
        <Card
          className={cn(
            'relative cursor-pointer border-2 transition-all duration-200',
            // Hover state: lift effect and border highlight
            'hover:-translate-y-1 hover:shadow-lg hover:border-[rgb(var(--color-primary-500))]',
            // Selected state: coral border, shadow, background
            selectedOption === 'documents'
              ? 'border-[rgb(var(--color-primary-500))] bg-[rgb(var(--color-primary-50))]/50 shadow-[0_0_0_3px_rgba(255,107,107,0.15)]'
              : 'border-[rgb(var(--color-border-default))]'
          )}
          onClick={() => setSelectedOption('documents')}
          onKeyDown={(e) => handleKeyDown('documents', e)}
          role="button"
          tabIndex={0}
          aria-pressed={selectedOption === 'documents'}
        >
          {/* Checkmark badge in corner */}
          {selectedOption === 'documents' && (
            <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[rgb(var(--color-primary-500))] text-white shadow-md">
              <Check className="h-4 w-4" />
            </div>
          )}
          <CardContent className="flex flex-col items-center p-8 text-center">
            <FileText className={cn(
              'mb-4 h-12 w-12 transition-colors',
              selectedOption === 'documents' ? 'text-[rgb(var(--color-primary-500))]' : 'text-muted-foreground'
            )} />
            <h3 className="mb-2 text-xl font-semibold">I have documents</h3>
            <p className="text-sm text-muted-foreground">
              Upload existing business plans, market research, or brand guidelines. AI will extract
              information and identify gaps.
            </p>
            <span className="mt-3 text-xs text-muted-foreground">PDF, DOCX, MD supported</span>
          </CardContent>
        </Card>

        {/* Fresh Start Option */}
        <Card
          className={cn(
            'relative cursor-pointer border-2 transition-all duration-200',
            // Hover state: lift effect and border highlight
            'hover:-translate-y-1 hover:shadow-lg hover:border-[rgb(var(--color-primary-500))]',
            // Selected state: coral border, shadow, background
            selectedOption === 'fresh'
              ? 'border-[rgb(var(--color-primary-500))] bg-[rgb(var(--color-primary-50))]/50 shadow-[0_0_0_3px_rgba(255,107,107,0.15)]'
              : 'border-[rgb(var(--color-border-default))]'
          )}
          onClick={() => setSelectedOption('fresh')}
          onKeyDown={(e) => handleKeyDown('fresh', e)}
          role="button"
          tabIndex={0}
          aria-pressed={selectedOption === 'fresh'}
        >
          {/* Checkmark badge in corner */}
          {selectedOption === 'fresh' && (
            <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[rgb(var(--color-primary-500))] text-white shadow-md">
              <Check className="h-4 w-4" />
            </div>
          )}
          <CardContent className="flex flex-col items-center p-8 text-center">
            <Sparkles className={cn(
              'mb-4 h-12 w-12 transition-colors',
              selectedOption === 'fresh' ? 'text-[rgb(var(--color-primary-500))]' : 'text-muted-foreground'
            )} />
            <h3 className="mb-2 text-xl font-semibold">Start from scratch</h3>
            <p className="text-sm text-muted-foreground">
              AI will guide you through the complete process: validation, planning, and branding.
              Takes 2-4 hours.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Document Upload Zone - only shown when documents option is selected */}
      {selectedOption === 'documents' && (
        <div className="space-y-4">
          {/* Drag and Drop Zone */}
          <div
            className={cn(
              'flex flex-col items-center gap-4 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors cursor-pointer',
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                fileInputRef.current?.click()
              }
            }}
          >
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="font-semibold">
              Drag and drop files here, or{' '}
              <span className="text-primary font-semibold">click to browse</span>
            </p>
            <p className="text-sm text-muted-foreground">
              PDF, DOCX, MD • Max 10MB per file • Up to {MAX_FILES} files
            </p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.md"
              multiple
              onChange={handleFileInputChange}
            />
          </div>

          {/* Error Message */}
          {uploadError && (
            <p className="text-sm text-destructive">{uploadError}</p>
          )}

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between rounded-lg bg-muted/50 p-3 border"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <File className="h-5 w-5 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(index)
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove {file.name}</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Continue Button */}
      <div className="flex justify-end">
        <Button onClick={handleContinue} disabled={!selectedOption} size="lg">
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
