import { Module, forwardRef } from '@nestjs/common'
import { CommonModule } from '../common/common.module'
import { EventsModule } from '../events/events.module'
import { PagesController } from './pages/pages.controller'
import { PagesService } from './pages/pages.service'
import { VersionsController } from './versions/versions.controller'
import { VersionsService } from './versions/versions.service'
import { SearchController } from './search/search.controller'
import { SearchService } from './search/search.service'

@Module({
  imports: [CommonModule, EventsModule],
  controllers: [PagesController, VersionsController, SearchController],
  providers: [
    PagesService,
    VersionsService,
    SearchService,
    {
      provide: 'VersionsService',
      useExisting: forwardRef(() => VersionsService),
    },
  ],
  exports: [PagesService, VersionsService, SearchService],
})
export class KbModule {}
