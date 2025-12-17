import { HttpException } from '@nestjs/common'
import { SearchController } from './search.controller'

describe('SearchController', () => {
  describe('rate limiting', () => {
    it('enforces a per-user/workspace rate limit', async () => {
      const searchService = {
        search: jest.fn().mockResolvedValue({ results: [], total: 0 }),
      }
      const controller = new SearchController(searchService as any)

      const user = { tenantId: 'tenant-1', id: 'user-1' }
      const workspaceId = 'ws-1'
      const query = { q: 'hello', limit: 20, offset: 0 }

      for (let i = 0; i < 30; i += 1) {
        await controller.search(user, workspaceId, query as any)
      }

      try {
        await controller.search(user, workspaceId, query as any)
        throw new Error('Expected rate limit to throw')
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException)
        expect((error as HttpException).getStatus()).toBe(429)
      }
    })

    it('resets the window after the rate limit window passes', async () => {
      const searchService = {
        search: jest.fn().mockResolvedValue({ results: [], total: 0 }),
      }
      const controller = new SearchController(searchService as any)

      const nowSpy = jest.spyOn(Date, 'now')
      nowSpy.mockReturnValue(0)

      const user = { tenantId: 'tenant-1', id: 'user-1' }
      const workspaceId = 'ws-1'
      const query = { q: 'hello', limit: 20, offset: 0 }

      for (let i = 0; i < 30; i += 1) {
        await controller.search(user, workspaceId, query as any)
      }

      try {
        await controller.search(user, workspaceId, query as any)
        throw new Error('Expected rate limit to throw')
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException)
        expect((error as HttpException).getStatus()).toBe(429)
      }

      nowSpy.mockReturnValue(61_000)

      await expect(controller.search(user, workspaceId, query as any)).resolves.toBeDefined()
      nowSpy.mockRestore()
    })
  })
})
