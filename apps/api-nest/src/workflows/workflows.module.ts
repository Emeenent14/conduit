import { Module } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { WorkflowsController } from './workflows.controller';
import { AuthModule } from '../auth/auth.module';
import { CredentialsModule } from '../credentials/credentials.module';
import { ExecutionsModule } from '../executions/executions.module';

@Module({
  imports: [AuthModule, CredentialsModule, ExecutionsModule],
  controllers: [WorkflowsController],
  providers: [WorkflowsService],
})
export class WorkflowsModule {}
