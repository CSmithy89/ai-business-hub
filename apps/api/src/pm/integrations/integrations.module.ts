import { Module } from '@nestjs/common'
import { CommonModule } from '../../common/common.module'
import { EventsModule } from '../../events/events.module'
import { TasksModule } from '../tasks/tasks.module'
import { IntegrationsController } from './integrations.controller'
import { IntegrationsService } from './integrations.service'
import { GithubIntegrationsController } from './github.controller'
import { GithubIssuesService } from './github-issues.service'
import { GithubPullRequestsService } from './github-pull-requests.service'
import { GithubWebhookController } from './github-webhook.controller'

@Module({
  imports: [CommonModule, EventsModule, TasksModule],
  controllers: [IntegrationsController, GithubIntegrationsController, GithubWebhookController],
  providers: [IntegrationsService, GithubIssuesService, GithubPullRequestsService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
