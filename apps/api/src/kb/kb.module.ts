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
import { KbCollabModule } from './collab/kb-collab.module'
import { EmbeddingsModule } from './embeddings/embeddings.module'
import { RagController } from './rag/rag.controller'
import { RagService } from './rag/rag.service'
import { KbAiController } from './ai/ai.controller'
import { KbAiService } from './ai/ai.service'
import { KbAskController } from './ai/ask.controller'
import { VerificationModule } from './verification/verification.module'
import { MentionModule } from './mentions/mention.module'

@Module({
  imports: [
    CommonModule,
    EventsModule,
    KbCollabModule,
    EmbeddingsModule,
    VerificationModule,
    MentionModule,
  ],
  controllers: [
    PagesController,
    VersionsController,
    SearchController,
    LinkingController,
    RagController,
    KbAiController,
    KbAskController,
  ],
  providers: [
    PagesService,
    VersionsService,
    SearchService,
    RagService,
    KbAiService,
    LinkingService,
    {
      provide: 'VersionsService',
      useExisting: forwardRef(() => VersionsService),
    },
  ],
  exports: [PagesService, VersionsService, SearchService, LinkingService, EmbeddingsModule],
})
export class KbModule {}
