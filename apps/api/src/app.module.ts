import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { AuditModule } from './audit/audit.module';
import { MembersModule } from './members/members.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { validate } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      envFilePath: ['../../.env.local', '../../.env', '.env.local', '.env'],
    }),
    CommonModule,
    AuditModule,
    MembersModule,
    ApprovalsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
