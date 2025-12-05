/**
 * Document Extraction Service
 *
 * Extracts structured business data from document text using AI.
 * For MVP, uses mock extraction with pattern matching.
 * In production, will use BYOAI provider for real AI extraction.
 *
 * Story: 08.4 - Implement Document Upload and Extraction Pipeline
 */

import { inferDocumentType } from './document-parser'

export interface ExtractionResult {
  business_model?: {
    data: {
      value_proposition?: string
      customer_segments?: string[]
      revenue_streams?: string[]
      cost_structure?: string[]
    }
    confidence: 'high' | 'medium' | 'low'
    source: string
  }
  market_analysis?: {
    data: {
      tam?: string
      sam?: string
      som?: string
      competitors?: string[]
      customer_profiles?: string[]
    }
    confidence: 'high' | 'medium' | 'low'
    source: string
  }
  financial_data?: {
    data: {
      revenue_projections?: string
      cost_projections?: string
      unit_economics?: string
      funding_requirements?: string
    }
    confidence: 'high' | 'medium' | 'low'
    source: string
  }
  brand_elements?: {
    data: {
      positioning?: string
      values?: string[]
      voice_tone?: string
      colors?: string[]
      typography?: string
    }
    confidence: 'high' | 'medium' | 'low'
    source: string
  }
}

export interface GapAnalysis {
  missing_sections: string[]
  incomplete_sections: string[]
  recommendations: string[]
  completeness_score: number
}

export interface ExtractionSummary {
  total_sections: number
  extracted_sections: number
  high_confidence: number
  medium_confidence: number
  low_confidence: number
  gaps: GapAnalysis
}

/**
 * Mock AI extraction for MVP
 * In production, this would call the BYOAI provider with a structured prompt
 *
 * @param text - Document text content
 * @param documentType - Inferred document type
 * @param filename - Original filename
 * @returns Extracted structured data with confidence scores
 */
export async function extractBusinessData(
  text: string,
  _documentType: ReturnType<typeof inferDocumentType>,
  filename: string
): Promise<ExtractionResult> {
  // MVP: Mock extraction with simple pattern matching
  // Production: Use BYOAI provider with structured prompt

  const result: ExtractionResult = {}
  const lowerText = text.toLowerCase()

  // Extract business model elements
  if (
    lowerText.includes('value proposition') ||
    lowerText.includes('customer') ||
    lowerText.includes('revenue')
  ) {
    const hasValueProp = lowerText.includes('value proposition')
    const hasCustomers = lowerText.includes('customer segment')
    const hasRevenue = lowerText.includes('revenue stream')

    let confidence: 'high' | 'medium' | 'low' = 'low'
    if (hasValueProp && hasCustomers && hasRevenue) {
      confidence = 'high'
    } else if (hasValueProp || hasCustomers || hasRevenue) {
      confidence = 'medium'
    }

    result.business_model = {
      data: {
        value_proposition: hasValueProp
          ? 'Value proposition mentioned in document'
          : undefined,
        customer_segments: hasCustomers ? ['Customer segments identified'] : [],
        revenue_streams: hasRevenue ? ['Revenue streams outlined'] : [],
        cost_structure: lowerText.includes('cost') ? ['Costs mentioned'] : [],
      },
      confidence,
      source: filename,
    }
  }

  // Extract market analysis
  if (
    lowerText.includes('market') ||
    lowerText.includes('tam') ||
    lowerText.includes('competitor')
  ) {
    const hasTAM =
      lowerText.includes('tam') || lowerText.includes('total addressable market')
    const hasSAM = lowerText.includes('sam') || lowerText.includes('serviceable available')
    const hasSOM = lowerText.includes('som') || lowerText.includes('serviceable obtainable')
    const hasCompetitors = lowerText.includes('competitor')

    let confidence: 'high' | 'medium' | 'low' = 'low'
    if ((hasTAM || hasSAM || hasSOM) && hasCompetitors) {
      confidence = 'high'
    } else if (hasTAM || hasSAM || hasSOM || hasCompetitors) {
      confidence = 'medium'
    }

    result.market_analysis = {
      data: {
        tam: hasTAM ? 'TAM data found in document' : undefined,
        sam: hasSAM ? 'SAM data found in document' : undefined,
        som: hasSOM ? 'SOM data found in document' : undefined,
        competitors: hasCompetitors ? ['Competitors mentioned'] : [],
        customer_profiles: lowerText.includes('persona') ? ['Personas identified'] : [],
      },
      confidence,
      source: filename,
    }
  }

  // Extract financial data
  if (
    lowerText.includes('financial') ||
    lowerText.includes('revenue') ||
    lowerText.includes('projection')
  ) {
    const hasRevenue = lowerText.includes('revenue')
    const hasCosts = lowerText.includes('cost')
    const hasProjections =
      lowerText.includes('projection') || lowerText.includes('forecast')
    const hasFunding = lowerText.includes('funding') || lowerText.includes('investment')

    let confidence: 'high' | 'medium' | 'low' = 'low'
    if (hasRevenue && hasCosts && hasProjections) {
      confidence = 'high'
    } else if (hasRevenue || hasProjections) {
      confidence = 'medium'
    }

    result.financial_data = {
      data: {
        revenue_projections: hasRevenue ? 'Revenue data found' : undefined,
        cost_projections: hasCosts ? 'Cost data found' : undefined,
        unit_economics: lowerText.includes('unit economics') ? 'Unit economics mentioned' : undefined,
        funding_requirements: hasFunding ? 'Funding requirements outlined' : undefined,
      },
      confidence,
      source: filename,
    }
  }

  // Extract brand elements
  if (
    lowerText.includes('brand') ||
    lowerText.includes('color') ||
    lowerText.includes('logo')
  ) {
    const hasBranding = lowerText.includes('brand')
    const hasColors = lowerText.includes('color')
    const hasTypography = lowerText.includes('typography') || lowerText.includes('font')
    const hasValues = lowerText.includes('value')
    const hasVoice = lowerText.includes('tone') || lowerText.includes('voice')

    let confidence: 'high' | 'medium' | 'low' = 'low'
    if (hasBranding && hasColors && hasTypography) {
      confidence = 'high'
    } else if (hasBranding || hasColors) {
      confidence = 'medium'
    }

    result.brand_elements = {
      data: {
        positioning: hasBranding ? 'Brand positioning mentioned' : undefined,
        values: hasValues ? ['Core values identified'] : [],
        voice_tone: hasVoice ? 'Voice and tone guidelines found' : undefined,
        colors: hasColors ? ['Color palette mentioned'] : [],
        typography: hasTypography ? 'Typography guidelines found' : undefined,
      },
      confidence,
      source: filename,
    }
  }

  return result
}

/**
 * Calculate confidence score for extracted data
 * Based on completeness and data quality
 *
 * @param extractedData - Extraction result
 * @returns Confidence score 0-100
 */
export function calculateConfidenceScore(extractedData: ExtractionResult): number {
  let score = 0
  let maxScore = 0

  // Business model section (25 points)
  maxScore += 25
  if (extractedData.business_model) {
    const bm = extractedData.business_model
    if (bm.confidence === 'high') score += 25
    else if (bm.confidence === 'medium') score += 15
    else score += 5
  }

  // Market analysis section (25 points)
  maxScore += 25
  if (extractedData.market_analysis) {
    const ma = extractedData.market_analysis
    if (ma.confidence === 'high') score += 25
    else if (ma.confidence === 'medium') score += 15
    else score += 5
  }

  // Financial data section (25 points)
  maxScore += 25
  if (extractedData.financial_data) {
    const fd = extractedData.financial_data
    if (fd.confidence === 'high') score += 25
    else if (fd.confidence === 'medium') score += 15
    else score += 5
  }

  // Brand elements section (25 points)
  maxScore += 25
  if (extractedData.brand_elements) {
    const be = extractedData.brand_elements
    if (be.confidence === 'high') score += 25
    else if (be.confidence === 'medium') score += 15
    else score += 5
  }

  return Math.round((score / maxScore) * 100)
}

/**
 * Generate gap analysis for extracted data
 * Identifies missing or incomplete sections
 *
 * @param extractedData - Extraction result
 * @returns Gap analysis with recommendations
 */
export function generateGapAnalysis(extractedData: ExtractionResult): GapAnalysis {
  const missing: string[] = []
  const incomplete: string[] = []
  const recommendations: string[] = []

  // Check business model
  if (!extractedData.business_model) {
    missing.push('Business Model')
    recommendations.push('Add information about your value proposition and revenue model')
  } else if (extractedData.business_model.confidence === 'low') {
    incomplete.push('Business Model')
    recommendations.push('Provide more details about customer segments and revenue streams')
  }

  // Check market analysis
  if (!extractedData.market_analysis) {
    missing.push('Market Analysis')
    recommendations.push('Include market sizing (TAM/SAM/SOM) and competitor analysis')
  } else if (extractedData.market_analysis.confidence === 'low') {
    incomplete.push('Market Analysis')
    recommendations.push('Add more detailed competitive analysis and customer profiles')
  }

  // Check financial data
  if (!extractedData.financial_data) {
    missing.push('Financial Projections')
    recommendations.push('Include revenue projections and cost structure')
  } else if (extractedData.financial_data.confidence === 'low') {
    incomplete.push('Financial Projections')
    recommendations.push('Provide more comprehensive financial forecasts')
  }

  // Check brand elements
  if (!extractedData.brand_elements) {
    missing.push('Brand Guidelines')
    recommendations.push('Add brand positioning, colors, and visual identity')
  } else if (extractedData.brand_elements.confidence === 'low') {
    incomplete.push('Brand Guidelines')
    recommendations.push('Expand brand guidelines with detailed visual specifications')
  }

  const totalSections = 4
  const extractedSections = totalSections - missing.length
  const completeness = Math.round((extractedSections / totalSections) * 100)

  return {
    missing_sections: missing,
    incomplete_sections: incomplete,
    recommendations,
    completeness_score: completeness,
  }
}

/**
 * Generate extraction summary with statistics
 *
 * @param results - Array of extraction results from multiple documents
 * @returns Summary statistics
 */
export function generateExtractionSummary(results: ExtractionResult[]): ExtractionSummary {
  let totalSections = 0
  let extractedSections = 0
  let highConfidence = 0
  let mediumConfidence = 0
  let lowConfidence = 0

  // Aggregate all sections across documents
  const aggregated: ExtractionResult = {}

  for (const result of results) {
    for (const [key, value] of Object.entries(result)) {
      if (value) {
        totalSections++
        extractedSections++

        // Track confidence levels
        if (value.confidence === 'high') highConfidence++
        else if (value.confidence === 'medium') mediumConfidence++
        else lowConfidence++

        // Merge into aggregated result (use highest confidence)
        if (!aggregated[key as keyof ExtractionResult]) {
          aggregated[key as keyof ExtractionResult] = value
        } else {
          const existing = aggregated[key as keyof ExtractionResult]
          if (existing && value.confidence === 'high') {
            aggregated[key as keyof ExtractionResult] = value
          }
        }
      }
    }
  }

  const gaps = generateGapAnalysis(aggregated)

  return {
    total_sections: totalSections || 4, // Use counted sections or default to 4 expected sections
    extracted_sections: extractedSections,
    high_confidence: highConfidence,
    medium_confidence: mediumConfidence,
    low_confidence: lowConfidence,
    gaps,
  }
}
