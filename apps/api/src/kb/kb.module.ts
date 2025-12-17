import { Module } from '@nestjs/common'
import { CommonModule } from '../common/common.module'
import { EventsModule } from '../events/events.module'
import { PagesController } from './pages/pages.controller'
import { PagesService } from './pages/pages.service'

@Module({
  imports: [CommonModule, EventsModule],
  controllers: [PagesController],
  providers: [PagesService],
  exports: [PagesService],
})
export class KbModule {}
