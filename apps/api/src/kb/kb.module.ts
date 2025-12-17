import { Module, forwardRef } from '@nestjs/common'
import { CommonModule } from '../common/common.module'
import { EventsModule } from '../events/events.module'
import { PagesController } from './pages/pages.controller'
import { PagesService } from './pages/pages.service'
import { VersionsController } from './versions/versions.controller'
import { VersionsService } from './versions/versions.service'

@Module({
  imports: [CommonModule, EventsModule],
  controllers: [PagesController, VersionsController],
  providers: [
    PagesService,
    VersionsService,
    {
      provide: 'VersionsService',
      useExisting: forwardRef(() => VersionsService),
    },
  ],
  exports: [PagesService, VersionsService],
})
export class KbModule {}
