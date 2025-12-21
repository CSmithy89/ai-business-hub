import { Module } from '@nestjs/common'
import { CommonModule } from '../../common/common.module'
import { TasksModule } from '../tasks/tasks.module'
import { IntegrationsController } from './integrations.controller'
import { IntegrationsService } from './integrations.service'
import { GithubIntegrationsController } from './github.controller'
import { GithubIssuesService } from './github-issues.service'

@Module({
  imports: [CommonModule, TasksModule],
  controllers: [IntegrationsController, GithubIntegrationsController],
  providers: [IntegrationsService, GithubIssuesService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
