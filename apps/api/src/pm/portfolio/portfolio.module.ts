import { Module } from '@nestjs/common'
import { CommonModule } from '../../common/common.module'
import { PortfolioController } from './portfolio.controller'
import { PortfolioService } from './portfolio.service'

@Module({
  imports: [CommonModule],
  controllers: [PortfolioController],
  providers: [PortfolioService],
})
export class PortfolioModule {}
