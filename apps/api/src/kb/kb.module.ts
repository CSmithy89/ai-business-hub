import { Module, forwardRef } from '@nestjs/common'
import { CommonModule } from '../common/common.module'
import { EventsModule } from '../events/events.module'
import { PagesController } from './pages/pages.controller'
import { PagesService } from './pages/pages.service'
import { VersionsController } from './versions/versions.controller'
import { VersionsService } from './versions/versions.service'
import { SearchController } from './search/search.controller'
import { SearchService } from './search/search.service'
import { LinkingController } from './linking/linking.controller'
import { LinkingService } from './linking/linking.service'

@Module({
  imports: [CommonModule, EventsModule],
  controllers: [PagesController, VersionsController, SearchController, LinkingController],
  providers: [
    PagesService,
    VersionsService,
    SearchService,
    LinkingService,
    {
      provide: 'VersionsService',
      useExisting: forwardRef(() => VersionsService),
    },
  ],
  exports: [PagesService, VersionsService, SearchService, LinkingService],
})
export class KbModule {}
