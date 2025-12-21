import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { updatePreferencesSchema, UpdatePreferencesDto } from './dto/update-preferences.dto';
import { ZodError } from 'zod';

@Controller('pm/notifications/preferences')
@UseGuards(AuthGuard)
export class NotificationPreferencesController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Get current user's notification preferences
   * Auto-creates with defaults if not exists
   */
  @Get()
  async getUserPreferences(@CurrentUser('id') userId: string) {
    const preferences = await this.notificationsService.getUserPreferences(userId);
    return { data: preferences };
  }

  /**
   * Update notification preferences (partial updates)
   */
  @Patch()
  async updatePreferences(
    @CurrentUser('id') userId: string,
    @Body() body: UpdatePreferencesDto
  ) {
    // Validate with Zod schema
    try {
      const validatedData = updatePreferencesSchema.parse(body);
      const updated = await this.notificationsService.updateUserPreferences(
        userId,
        validatedData
      );
      return { data: updated };
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: error.errors,
        });
      }
      throw error;
    }
  }

  /**
   * Reset preferences to platform defaults
   */
  @Post('reset')
  @HttpCode(HttpStatus.OK)
  async resetToDefaults(@CurrentUser('id') userId: string) {
    const preferences = await this.notificationsService.resetToDefaults(userId);
    return { data: preferences };
  }
}
