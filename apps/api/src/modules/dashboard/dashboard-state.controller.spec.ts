/**
 * Dashboard State Controller Tests
 *
 * Unit tests for dashboard state REST API endpoints.
 *
 * Story: DM-11.1 - Redis State Persistence
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DashboardStateController } from './dashboard-state.controller';
import { DashboardStateService } from './dashboard-state.service';
import { SaveDashboardStateDto } from './dto/dashboard-state.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';

describe('DashboardStateController', () => {
  let controller: DashboardStateController;

  const mockDashboardStateService = {
    saveState: jest.fn(),
    getState: jest.fn(),
    deleteState: jest.fn(),
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockWorkspaceId = 'workspace-456';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardStateController],
      providers: [
        {
          provide: DashboardStateService,
          useValue: mockDashboardStateService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockResolvedValue(true) })
      .overrideGuard(TenantGuard)
      .useValue({ canActivate: jest.fn().mockResolvedValue(true) })
      .compile();

    controller = module.get<DashboardStateController>(DashboardStateController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /dashboard/state (saveState)', () => {
    const validDto: SaveDashboardStateDto = {
      version: 1,
      state: {
        widgets: { projectStatus: null },
        activeProject: null,
      },
      checksum: 'abc123',
    };

    it('should save state successfully', async () => {
      const expectedResponse = {
        success: true,
        serverVersion: 1,
      };
      mockDashboardStateService.saveState.mockResolvedValue(expectedResponse);

      const result = await controller.saveState(
        mockWorkspaceId,
        mockUser,
        validDto
      );

      expect(result).toEqual(expectedResponse);
      expect(mockDashboardStateService.saveState).toHaveBeenCalledWith(
        mockUser.id,
        mockWorkspaceId,
        validDto
      );
    });

    it('should handle conflict resolution', async () => {
      const conflictResponse = {
        success: false,
        serverVersion: 2,
        conflictResolution: 'server',
      };
      mockDashboardStateService.saveState.mockResolvedValue(conflictResponse);

      const result = await controller.saveState(
        mockWorkspaceId,
        mockUser,
        validDto
      );

      expect(result).toEqual(conflictResponse);
      expect(result.conflictResolution).toBe('server');
    });

    it('should handle save failure', async () => {
      const failureResponse = {
        success: false,
        serverVersion: 1,
      };
      mockDashboardStateService.saveState.mockResolvedValue(failureResponse);

      const result = await controller.saveState(
        mockWorkspaceId,
        mockUser,
        validDto
      );

      expect(result.success).toBe(false);
    });
  });

  describe('GET /dashboard/state (getState)', () => {
    it('should return state successfully', async () => {
      const stateResponse = {
        version: 1,
        state: { widgets: { projectStatus: null } },
        lastModified: '2024-01-01T00:00:00.000Z',
      };
      mockDashboardStateService.getState.mockResolvedValue(stateResponse);

      const result = await controller.getState(mockWorkspaceId, mockUser);

      expect(result).toEqual(stateResponse);
      expect(mockDashboardStateService.getState).toHaveBeenCalledWith(
        mockUser.id,
        mockWorkspaceId
      );
    });

    it('should throw NotFoundException when no state exists', async () => {
      mockDashboardStateService.getState.mockResolvedValue(null);

      await expect(
        controller.getState(mockWorkspaceId, mockUser)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('DELETE /dashboard/state (deleteState)', () => {
    it('should delete state successfully', async () => {
      const deleteResponse = { success: true };
      mockDashboardStateService.deleteState.mockResolvedValue(deleteResponse);

      const result = await controller.deleteState(mockWorkspaceId, mockUser);

      expect(result).toEqual(deleteResponse);
      expect(mockDashboardStateService.deleteState).toHaveBeenCalledWith(
        mockUser.id,
        mockWorkspaceId
      );
    });

    it('should return success false when nothing to delete', async () => {
      const deleteResponse = { success: false };
      mockDashboardStateService.deleteState.mockResolvedValue(deleteResponse);

      const result = await controller.deleteState(mockWorkspaceId, mockUser);

      expect(result.success).toBe(false);
    });
  });
});
