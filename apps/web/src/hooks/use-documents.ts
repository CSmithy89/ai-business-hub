/**
 * useDocuments Hook
 *
 * React Query hook for document operations.
 * Handles upload, fetching, and state management.
 *
 * Story: 08.4 - Implement Document Upload and Extraction Pipeline
 */

'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { safeJson } from '@/lib/utils/safe-json'

interface Document {
  id: string
  businessId: string
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
  extractedData: any
  extractionStatus: string
  extractionError: string | null
  uploadedAt: string
}

interface UploadResponse {
  success: boolean
  data: {
    documents: Document[]
    summary: {
      total_sections: number
      extracted_sections: number
      high_confidence: number
      medium_confidence: number
      low_confidence: number
      gaps: {
        missing_sections: string[]
        incomplete_sections: string[]
        recommendations: string[]
        completeness_score: number
      }
    }
  }
  error?: string
  message?: string
}

/**
 * Hook to fetch documents for a business
 */
export function useDocuments(businessId: string | undefined) {
  return useQuery({
    queryKey: ['documents', businessId],
    queryFn: async () => {
      if (!businessId) throw new Error('Business ID is required')

      const response = await fetch(`/api/businesses/${businessId}/documents`)
      const data = await safeJson<UploadResponse>(response)

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to fetch documents')
      }

      return data.data.documents as Document[]
    },
    enabled: !!businessId,
  })
}

/**
 * Hook to upload documents
 */
export function useUploadDocuments(businessId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData()
      files.forEach((file) => {
        formData.append('files', file)
      })

      const response = await fetch(`/api/businesses/${businessId}/documents`, {
        method: 'POST',
        body: formData,
      })

      const data = await safeJson<UploadResponse>(response)

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to upload documents')
      }

      return data.data
    },
    onSuccess: () => {
      // Invalidate documents query to refetch
      queryClient.invalidateQueries({ queryKey: ['documents', businessId] })
      // Also invalidate business query to update progress
      queryClient.invalidateQueries({ queryKey: ['business', businessId] })
    },
  })
}

/**
 * Hook to get upload state
 */
export function useDocumentUpload(businessId: string) {
  const { data: documents, isLoading, error, refetch } = useDocuments(businessId)
  const uploadMutation = useUploadDocuments(businessId)

  return {
    documents,
    isLoading,
    error,
    refetch,
    upload: uploadMutation.mutate,
    uploadAsync: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,
    uploadData: uploadMutation.data,
  }
}
