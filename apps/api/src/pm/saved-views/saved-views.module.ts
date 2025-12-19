import { Module } from '@nestjs/common'
import { CommonModule } from '../../common/common.module'
import { SavedViewsController } from './saved-views.controller'
import { SavedViewsService } from './saved-views.service'

@Module({
  imports: [CommonModule],
  controllers: [SavedViewsController],
  providers: [SavedViewsService],
  exports: [SavedViewsService],
})
export class SavedViewsModule {}
