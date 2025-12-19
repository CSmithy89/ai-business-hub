import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { AuthGuard } from '../../common/guards/auth.guard'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { VerifyPageDto } from './dto/verify-page.dto'
import { VerificationService } from './verification.service'
import { PageOwnerOrAdminGuard } from './guards/page-owner-or-admin.guard'

@ApiTags('KB Verification')
@Controller('kb/pages/:id/verify')
@UseGuards(AuthGuard, TenantGuard)
@ApiBearerAuth()
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post()
  @UseGuards(PageOwnerOrAdminGuard)
  @ApiOperation({ summary: 'Mark page as verified' })
  @ApiParam({ name: 'id', description: 'Page ID' })
  @ApiResponse({
    status: 200,
    description: 'Page verified successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Only page owner or workspace admin can verify pages',
  })
  @ApiResponse({ status: 404, description: 'Page not found' })
  async verifyPage(
    @Param('id') pageId: string,
    @CurrentUser() actor: any,
    @Body() dto: VerifyPageDto,
  ) {
    return this.verificationService.markVerified(pageId, actor.id, dto)
  }

  @Delete()
  @UseGuards(PageOwnerOrAdminGuard)
  @ApiOperation({ summary: 'Remove verification status' })
  @ApiParam({ name: 'id', description: 'Page ID' })
  @ApiResponse({
    status: 200,
    description: 'Verification removed successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Only page owner or workspace admin can unverify pages',
  })
  @ApiResponse({ status: 404, description: 'Page not found' })
  async unverifyPage(@Param('id') pageId: string, @CurrentUser() actor: any) {
    return this.verificationService.removeVerification(pageId, actor.id)
  }
}
