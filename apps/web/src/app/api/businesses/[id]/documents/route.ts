/**
 * Business Documents API Routes
 * POST /api/businesses/[id]/documents - Upload and extract documents
 *
 * Story: 08.4 - Implement Document Upload and Extraction Pipeline
 */

import { NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import { getSession } from '@/lib/auth-server'
import { storeFileLocally, validateFileSize, validateMimeType } from '@/lib/utils/file-storage'
import { parseDocument, inferDocumentType } from '@/lib/services/document-parser'
import {
  extractBusinessData,
  generateExtractionSummary,
  type ExtractionResult,
} from '@/lib/services/document-extraction'

/**
 * POST /api/businesses/:id/documents
 *
 * Upload documents and extract business data.
 * Handles multipart form data with file uploads.
 * Stores files locally and creates OnboardingDocument records.
 * Performs synchronous extraction for MVP.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params
    // Get authenticated session
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'You must be signed in to upload documents',
        },
        { status: 401 }
      )
    }

    const workspaceId = session.session.activeWorkspaceId

    if (!workspaceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'NO_WORKSPACE',
          message: 'No active workspace selected',
        },
        { status: 400 }
      )
    }

    
    // Verify business exists and belongs to workspace
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        workspaceId,
      },
    })

    if (!business) {
      return NextResponse.json(
        {
          success: false,
          error: 'NOT_FOUND',
          message: 'Business not found',
        },
        { status: 404 }
      )
    }

    // Parse multipart form data
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'NO_FILES',
          message: 'No files provided',
        },
        { status: 400 }
      )
    }

    if (files.length > 5) {
      return NextResponse.json(
        {
          success: false,
          error: 'TOO_MANY_FILES',
          message: 'Maximum 5 files allowed',
        },
        { status: 400 }
      )
    }

    // Validate all files before processing
    for (const file of files) {
      if (!validateFileSize(file.size)) {
        return NextResponse.json(
          {
            success: false,
            error: 'FILE_TOO_LARGE',
            message: `File ${file.name} exceeds 10MB limit`,
          },
          { status: 400 }
        )
      }

      if (!validateMimeType(file.type)) {
        return NextResponse.json(
          {
            success: false,
            error: 'INVALID_FILE_TYPE',
            message: `File ${file.name} has invalid type. Only PDF, DOCX, and MD files are allowed`,
          },
          { status: 400 }
        )
      }
    }

    // Process each file
    const extractionResults: ExtractionResult[] = []
    const documents = []

    for (const file of files) {
      try {
        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Store file locally
        const storedFile = await storeFileLocally(
          businessId,
          buffer,
          file.name,
          file.type
        )

        // Parse document to extract text
        const text = await parseDocument(buffer, file.type)

        // Infer document type
        const documentType = inferDocumentType(file.name, text)

        // Create OnboardingDocument record (pending status)
        const document = await prisma.onboardingDocument.create({
          data: {
            businessId,
            fileName: file.name,
            fileUrl: storedFile.url,
            fileType: file.type,
            fileSize: file.size,
            extractionStatus: 'processing',
          },
        })

        try {
          // Extract structured data using AI (mock for MVP)
          const extractedData = await extractBusinessData(text, documentType, file.name)

          // Update document with extraction results
          await prisma.onboardingDocument.update({
            where: { id: document.id },
            data: {
              extractedData: extractedData as any,
              extractionStatus: 'complete',
            },
          })

          extractionResults.push(extractedData)
          documents.push({ ...document, extractedData })
        } catch (extractionError) {
          console.error('Extraction error:', extractionError)

          // Update document with error status
          await prisma.onboardingDocument.update({
            where: { id: document.id },
            data: {
              extractionStatus: 'error',
              extractionError:
                extractionError instanceof Error
                  ? extractionError.message
                  : 'Unknown extraction error',
            },
          })

          // Continue processing other files
          documents.push({
            ...document,
            extractionStatus: 'error',
            extractionError: 'Failed to extract data from document',
          })
        }
      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError)

        // Continue processing other files - omit document from results if creation failed
        // Frontend will handle missing documents gracefully
      }
    }

    // Generate extraction summary
    const summary = generateExtractionSummary(extractionResults)

    // Update business onboarding progress if documents were successfully processed
    if (documents.some((doc) => doc.extractionStatus === 'complete')) {
      await prisma.business.update({
        where: { id: businessId },
        data: {
          onboardingProgress: Math.max(business.onboardingProgress || 0, 25),
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        documents,
        summary,
      },
    })
  } catch (error) {
    console.error('Error uploading documents:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An error occurred while uploading documents',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/businesses/:id/documents
 *
 * Get all documents for a business
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params
    // Get authenticated session
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'You must be signed in to view documents',
        },
        { status: 401 }
      )
    }

    const workspaceId = session.session.activeWorkspaceId

    if (!workspaceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'NO_WORKSPACE',
          message: 'No active workspace selected',
        },
        { status: 400 }
      )
    }

    
    // Verify business exists and belongs to workspace
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        workspaceId,
      },
    })

    if (!business) {
      return NextResponse.json(
        {
          success: false,
          error: 'NOT_FOUND',
          message: 'Business not found',
        },
        { status: 404 }
      )
    }

    // Get all documents for business
    const documents = await prisma.onboardingDocument.findMany({
      where: {
        businessId,
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: documents,
    })
  } catch (error) {
    console.error('Error fetching documents:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching documents',
      },
      { status: 500 }
    )
  }
}
