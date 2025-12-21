import { Module } from '@nestjs/common'
import { CommonModule } from '../../common/common.module'
import { ExportsController } from './exports.controller'
import { ExportsService } from './exports.service'

@Module({
  imports: [CommonModule],
  controllers: [ExportsController],
  providers: [ExportsService],
})
export class ExportsModule {}
