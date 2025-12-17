/**
 * Task Attachments Upload (MVP)
 * POST /api/pm/tasks/[taskId]/attachments/upload
 *
 * Stores file using configured storage adapter (default: local) and returns file metadata.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import { getSession } from '@/lib/auth-server'
import { getFileStorage } from '@/lib/storage'

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024

export async function POST(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const { taskId } = await params
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'You must be signed in to upload attachments' },
        { status: 401 },
      )
    }

    const workspaceId = session.session.activeWorkspaceId
    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'NO_WORKSPACE', message: 'No active workspace selected' },
        { status: 400 },
      )
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, workspaceId, deletedAt: null },
      select: { id: true },
    })
    if (!task) {
      return NextResponse.json({ success: false, error: 'NOT_FOUND', message: 'Task not found' }, { status: 404 })
    }

    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'NO_FILE', message: 'No file provided' }, { status: 400 })
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'FILE_TOO_LARGE', message: 'File exceeds 50MB limit' },
        { status: 400 },
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const storage = getFileStorage()
    const stored = await storage.store(buffer, file.name, file.type, { businessId: taskId, directory: 'task-attachments' })

    return NextResponse.json({
      success: true,
      data: {
        fileName: file.name,
        fileUrl: stored.url,
        fileType: file.type,
        fileSize: file.size,
      },
    })
  } catch (error) {
    console.error('Error uploading task attachment:', error)
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'An error occurred while uploading attachment' },
      { status: 500 },
    )
  }
}

