/**
 * Onboarding Documents Page
 *
 * Document upload page for business onboarding.
 * Receives businessId from query parameter.
 * Shows upload interface and extraction results.
 *
 * Story: 08.4 - Implement Document Upload and Extraction Pipeline
 */

'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DocumentUpload } from '@/components/business/DocumentUpload'
import { ExtractionResults } from '@/components/business/ExtractionResults'
import { GapAnalysis } from '@/components/business/GapAnalysis'
import type { ExtractionResult } from '@/lib/services/document-extraction'

interface UploadData {
  documents: any[]
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

export default function OnboardingDocumentsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const businessId = searchParams.get('businessId')

  const [uploadData, setUploadData] = useState<UploadData | null>(null)
  const [aggregatedExtraction, setAggregatedExtraction] = useState<ExtractionResult | null>(
    null
  )

  if (!businessId) {
    return (
      <div className="container max-w-2xl py-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle>Missing Business ID</CardTitle>
            <CardDescription>
              No business ID provided. Please start from the beginning.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleUploadComplete = (data: UploadData) => {
    setUploadData(data)

    // Aggregate extraction results from all documents
    const aggregated: ExtractionResult = {}

    // Rank confidences so we can prefer higher-confidence values
    const rankConfidence = (c?: 'high' | 'medium' | 'low') =>
      c === 'high' ? 3 : c === 'medium' ? 2 : c === 'low' ? 1 : 0

    for (const doc of data.documents) {
      if (doc.extractedData) {
        for (const [key, value] of Object.entries(doc.extractedData)) {
          if (value) {
            const existing = aggregated[key as keyof ExtractionResult] as any
            if (!existing) {
              aggregated[key as keyof ExtractionResult] = value as any
            } else {
              const existingRank = rankConfidence(existing.confidence)
              const newRank = rankConfidence((value as any).confidence)
              // Replace when new value has higher confidence
              if (newRank > existingRank) {
                aggregated[key as keyof ExtractionResult] = value as any
              }
            }
          }
        }
      }
    }

    setAggregatedExtraction(aggregated)
  }

  const handleAccept = async () => {
    // In a real implementation, this would save the extracted data to the business record
    // For now, just navigate to validation page
    router.push(`/dashboard/${businessId}/validation` as any)
  }

  const handleSkip = () => {
    router.push(`/dashboard/${businessId}/validation` as any)
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <h1 className="text-3xl font-bold tracking-tight">Upload Business Documents</h1>
          <p className="text-muted-foreground mt-2">
            Upload existing business documents to accelerate your onboarding. We'll extract
            key information automatically.
          </p>
        </div>

        {/* Upload Section */}
        {!uploadData && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Documents</CardTitle>
              <CardDescription>
                Upload business plans, market research, brand guides, or pitch decks. We
                support PDF, DOCX, and MD files.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentUpload
                businessId={businessId}
                onUploadComplete={handleUploadComplete}
                onUploadError={(error) => {
                  console.error('Upload error:', error)
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {uploadData && aggregatedExtraction && (
          <>
            {/* Extraction Results */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Extracted Information</h2>
              <ExtractionResults
                extractionData={aggregatedExtraction}
                onAccept={handleAccept}
              />
            </div>

            {/* Gap Analysis */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Completeness Analysis</h2>
              <GapAnalysis gapAnalysis={uploadData.summary.gaps} />
            </div>
          </>
        )}

        {/* Skip Section */}
        {!uploadData && (
          <Card className="border-muted">
            <CardContent className="flex items-center justify-between py-6">
              <div>
                <h3 className="font-semibold">Don't have documents?</h3>
                <p className="text-sm text-muted-foreground">
                  You can skip this step and enter information manually during validation.
                </p>
              </div>
              <Button variant="outline" onClick={handleSkip}>
                Skip for Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
