/**
 * Wizard Step 1: Choice Component
 *
 * Presents two options:
 * - "I have documents" - Upload existing business documents
 * - "Start from scratch" - AI-guided process
 *
 * Story: 08.3 - Implement Onboarding Wizard UI
 */

'use client'

import { useState } from 'react'
import { FileText, Sparkles, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface WizardStepChoiceProps {
  initialValue?: boolean | null
  onContinue: (hasDocuments: boolean) => void
}

export function WizardStepChoice({ initialValue, onContinue }: WizardStepChoiceProps) {
  const [selectedOption, setSelectedOption] = useState<'documents' | 'fresh' | null>(
    initialValue === true ? 'documents' : initialValue === false ? 'fresh' : null
  )

  const handleContinue = () => {
    if (selectedOption) {
      onContinue(selectedOption === 'documents')
    }
  }

  const handleKeyDown = (option: 'documents' | 'fresh', event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setSelectedOption(option)
    }
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
            'cursor-pointer border-2 transition-all hover:border-primary',
            selectedOption === 'documents' && 'border-primary bg-primary/5'
          )}
          onClick={() => setSelectedOption('documents')}
          onKeyDown={(e) => handleKeyDown('documents', e)}
          role="button"
          tabIndex={0}
          aria-pressed={selectedOption === 'documents'}
        >
          <CardContent className="flex flex-col items-center p-8 text-center">
            <FileText className="mb-4 h-12 w-12 text-primary" />
            <h3 className="mb-2 text-xl font-semibold">I have documents</h3>
            <p className="text-sm text-muted-foreground">
              Upload existing business plans, market research, or brand guidelines. AI will extract
              information and identify gaps.
            </p>
          </CardContent>
        </Card>

        {/* Fresh Start Option */}
        <Card
          className={cn(
            'cursor-pointer border-2 transition-all hover:border-primary',
            selectedOption === 'fresh' && 'border-primary bg-primary/5'
          )}
          onClick={() => setSelectedOption('fresh')}
          onKeyDown={(e) => handleKeyDown('fresh', e)}
          role="button"
          tabIndex={0}
          aria-pressed={selectedOption === 'fresh'}
        >
          <CardContent className="flex flex-col items-center p-8 text-center">
            <Sparkles className="mb-4 h-12 w-12 text-primary" />
            <h3 className="mb-2 text-xl font-semibold">Start from scratch</h3>
            <p className="text-sm text-muted-foreground">
              AI will guide you through the complete process: validation, planning, and branding.
            </p>
          </CardContent>
        </Card>
      </div>

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
