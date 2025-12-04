/**
 * ExtractionResults Component
 *
 * Displays extracted business data from uploaded documents.
 * Shows confidence scores, allows editing, and highlights gaps.
 *
 * Story: 08.4 - Implement Document Upload and Extraction Pipeline
 */

'use client'

import { useState } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Edit2, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { ExtractionResult } from '@/lib/services/document-extraction'

interface ExtractionResultsProps {
  extractionData: ExtractionResult
  onAccept?: (data: ExtractionResult) => void
  onEdit?: (data: ExtractionResult) => void
}

type ConfidenceLevel = 'high' | 'medium' | 'low'

export function ExtractionResults({
  extractionData,
  onAccept,
  onEdit,
}: ExtractionResultsProps) {
  const [editing, setEditing] = useState(false)
  const [editedData, setEditedData] = useState<ExtractionResult>(extractionData)

  const getConfidenceBadge = (confidence: ConfidenceLevel) => {
    const variants = {
      high: {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
        label: 'High Confidence',
      },
      medium: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: AlertTriangle,
        label: 'Medium Confidence',
      },
      low: {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle,
        label: 'Low Confidence',
      },
    }

    const variant = variants[confidence]
    const Icon = variant.icon

    return (
      <Badge variant="outline" className={cn('gap-1', variant.color)}>
        <Icon className="h-3 w-3" />
        {variant.label}
      </Badge>
    )
  }

  const getConfidenceDescription = (confidence: ConfidenceLevel) => {
    switch (confidence) {
      case 'high':
        return 'Auto-populated with high confidence'
      case 'medium':
        return 'Please review and verify this data'
      case 'low':
        return 'Low confidence - manual review required'
    }
  }

  const handleSave = () => {
    onEdit?.(editedData)
    setEditing(false)
  }

  const handleCancel = () => {
    setEditedData(extractionData)
    setEditing(false)
  }

  const sections = [
    {
      key: 'business_model' as const,
      title: 'Business Model',
      description: 'Value proposition, customer segments, and revenue streams',
    },
    {
      key: 'market_analysis' as const,
      title: 'Market Analysis',
      description: 'Market sizing, competitors, and customer profiles',
    },
    {
      key: 'financial_data' as const,
      title: 'Financial Projections',
      description: 'Revenue, costs, and unit economics',
    },
    {
      key: 'brand_elements' as const,
      title: 'Brand Guidelines',
      description: 'Positioning, colors, typography, and visual identity',
    },
  ]

  const extractedSections = sections.filter((section) => extractionData[section.key])
  const missingSections = sections.filter((section) => !extractionData[section.key])

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Extraction Summary</CardTitle>
          <CardDescription>
            {extractedSections.length} of {sections.length} sections extracted from your
            documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {
                  extractedSections.filter(
                    (s) => extractionData[s.key]?.confidence === 'high'
                  ).length
                }
              </div>
              <div className="text-sm text-muted-foreground">High Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {
                  extractedSections.filter(
                    (s) => extractionData[s.key]?.confidence === 'medium'
                  ).length
                }
              </div>
              <div className="text-sm text-muted-foreground">Medium Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {
                  extractedSections.filter(
                    (s) => extractionData[s.key]?.confidence === 'low'
                  ).length
                }
              </div>
              <div className="text-sm text-muted-foreground">Low Confidence</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Extracted Data</h2>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Data
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Extracted sections */}
      {extractedSections.map((section) => {
        const data = extractionData[section.key]
        if (!data) return null

        return (
          <Card key={section.key}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </div>
                {getConfidenceBadge(data.confidence)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {getConfidenceDescription(data.confidence)}
              </p>
              <p className="text-xs text-muted-foreground">Source: {data.source}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(data.data).map(([key, value]) => {
                  if (!value) return null

                  const displayValue = Array.isArray(value)
                    ? value.join(', ')
                    : String(value)

                  return (
                    <div key={key} className="space-y-1">
                      <label className="text-sm font-medium capitalize">
                        {key.replace(/_/g, ' ')}
                      </label>
                      {editing ? (
                        <Textarea
                          value={displayValue}
                          onChange={(e) => {
                            setEditedData({
                              ...editedData,
                              [section.key]: {
                                ...editedData[section.key],
                                data: {
                                  ...editedData[section.key]?.data,
                                  [key]: e.target.value,
                                },
                              },
                            })
                          }}
                          className="min-h-[60px]"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
                          {displayValue}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Missing sections warning */}
      {missingSections.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Incomplete Data</CardTitle>
            <CardDescription className="text-yellow-700">
              The following sections were not found in your documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {missingSections.map((section) => (
                <li key={section.key} className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">{section.title}</p>
                    <p className="text-xs text-yellow-700">{section.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Accept button */}
      {onAccept && (
        <Button onClick={() => onAccept(editedData)} size="lg" className="w-full">
          <CheckCircle className="h-4 w-4 mr-2" />
          Accept and Continue
        </Button>
      )}
    </div>
  )
}
