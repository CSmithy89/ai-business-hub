import { Metadata } from 'next'
import { GapAnalysisDashboard } from '@/components/kb/GapAnalysisDashboard'

export const metadata: Metadata = {
  title: 'Gap Analysis',
  description: 'Identify missing KB topics and outdated pages',
}

export default function GapAnalysisPage() {
  return (
    <div className="container mx-auto py-8">
      <GapAnalysisDashboard />
    </div>
  )
}
