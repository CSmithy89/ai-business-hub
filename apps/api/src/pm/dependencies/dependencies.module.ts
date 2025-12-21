import { Module } from '@nestjs/common'
import { CommonModule } from '../../common/common.module'
import { DependenciesController } from './dependencies.controller'
import { DependenciesService } from './dependencies.service'

@Module({
  imports: [CommonModule],
  controllers: [DependenciesController],
  providers: [DependenciesService],
})
export class DependenciesModule {}
