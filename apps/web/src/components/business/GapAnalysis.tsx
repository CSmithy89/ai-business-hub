/**
 * GapAnalysis Component
 *
 * Displays missing required fields and recommendations.
 * Shows overall completeness score.
 *
 * Story: 08.4 - Implement Document Upload and Extraction Pipeline
 */

'use client'

import { AlertTriangle, CheckCircle, FileQuestion, Lightbulb } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import type { GapAnalysis as GapAnalysisType } from '@/lib/services/document-extraction'

interface GapAnalysisProps {
  gapAnalysis: GapAnalysisType
}

export function GapAnalysis({ gapAnalysis }: GapAnalysisProps) {
  const { missing_sections, incomplete_sections, recommendations, completeness_score } =
    gapAnalysis

  const getCompletenessColor = (score: number) => {
    if (score >= 75) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getCompletenessLabel = (score: number) => {
    if (score >= 75) return 'Good Progress'
    if (score >= 50) return 'Needs Attention'
    return 'More Information Needed'
  }

  const getProgressColor = (score: number) => {
    if (score >= 75) return 'bg-green-500'
    if (score >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-6">
      {/* Completeness Score */}
      <Card>
        <CardHeader>
          <CardTitle>Business Profile Completeness</CardTitle>
          <CardDescription>
            How much of your business information we were able to extract
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">
                <span className={getCompletenessColor(completeness_score)}>
                  {completeness_score}%
                </span>
              </span>
              <Badge variant="outline">{getCompletenessLabel(completeness_score)}</Badge>
            </div>

            <div className="relative">
              <Progress value={completeness_score} className="h-3" />
              <div
                className={`absolute top-0 left-0 h-3 rounded-full transition-all ${getProgressColor(completeness_score)}`}
                style={{ width: `${completeness_score}%` }}
              />
            </div>

            {completeness_score === 100 ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Complete Profile</AlertTitle>
                <AlertDescription className="text-green-700">
                  All required business information has been extracted from your documents.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Additional Information Needed</AlertTitle>
                <AlertDescription>
                  Some information is missing or incomplete. You can add it manually or
                  upload additional documents.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Missing Sections */}
      {missing_sections.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileQuestion className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-800">Missing Information</CardTitle>
            </div>
            <CardDescription>
              These sections were not found in your documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {missing_sections.map((section, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="font-medium">{section}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Incomplete Sections */}
      {incomplete_sections.length > 0 && (
        <Card className="border-yellow-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-yellow-800">Incomplete Information</CardTitle>
            </div>
            <CardDescription>
              These sections need more detail for better accuracy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {incomplete_sections.map((section, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span className="font-medium">{section}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-blue-800">Recommendations</CardTitle>
            </div>
            <CardDescription className="text-blue-700">
              Next steps to complete your business profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                    {index + 1}
                  </div>
                  <p className="text-sm text-blue-900">{recommendation}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Success State */}
      {missing_sections.length === 0 &&
        incomplete_sections.length === 0 &&
        recommendations.length === 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="flex items-center gap-4 py-8">
              <CheckCircle className="h-12 w-12 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-green-800">
                  All Set! Your Profile is Complete
                </h3>
                <p className="text-sm text-green-700">
                  We have all the information we need to help you build your business.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  )
}
