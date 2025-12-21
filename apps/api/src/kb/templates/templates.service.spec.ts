import { TemplatesService } from './templates.service'

const mockPrismaService = {
  knowledgePage: {
    findMany: jest.fn(),
  },
}

const mockPagesService = {
  create: jest.fn(),
}

describe('TemplatesService', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('lists built-in and custom templates', async () => {
    mockPrismaService.knowledgePage.findMany.mockResolvedValue([
      {
        id: 'custom-1',
        title: 'Retro Template',
        templateCategory: 'Custom',
        content: { type: 'doc', content: [] },
      },
    ])

    const service = new TemplatesService(
      mockPrismaService as any,
      mockPagesService as any,
    )

    const result = await service.listTemplates('workspace-1', 'tenant-1')

    expect(result.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'template-meeting-notes', isBuiltIn: true }),
        expect.objectContaining({ id: 'custom-1', isBuiltIn: false }),
      ]),
    )
  })

  it('creates a custom template via pages service', async () => {
    mockPagesService.create.mockResolvedValue({
      data: {
        id: 'template-123',
        title: 'My Template',
        content: { type: 'doc', content: [] },
      },
    })

    const service = new TemplatesService(
      mockPrismaService as any,
      mockPagesService as any,
    )

    const result = await service.createTemplate('tenant-1', 'workspace-1', 'user-1', {
      title: 'My Template',
      category: 'Custom',
      content: { type: 'doc', content: [] },
    })

    expect(mockPagesService.create).toHaveBeenCalledWith(
      'tenant-1',
      'workspace-1',
      'user-1',
      expect.objectContaining({ isTemplate: true }),
    )
    expect(result.data.id).toBe('template-123')
  })
})
