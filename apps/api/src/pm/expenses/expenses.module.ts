import { Module } from '@nestjs/common'
import { CommonModule } from '../../common/common.module'
import { ProjectsModule } from '../projects/projects.module'
import { ExpensesController } from './expenses.controller'
import { ExpensesService } from './expenses.service'

@Module({
  imports: [CommonModule, ProjectsModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
})
export class ExpensesModule {}

