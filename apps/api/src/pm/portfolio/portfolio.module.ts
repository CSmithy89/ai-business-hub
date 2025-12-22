import { Module } from '@nestjs/common'
import { CommonModule } from '../../common/common.module'
import { EventsModule } from '../../events/events.module'
import { PortfolioController } from './portfolio.controller'
import { PortfolioService } from './portfolio.service'
import { PortfolioListener } from './listeners/portfolio.listener'

@Module({
  imports: [CommonModule, EventsModule],
  controllers: [PortfolioController],
  providers: [PortfolioService, PortfolioListener],
  exports: [PortfolioService],
})
export class PortfolioModule {}
