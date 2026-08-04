import { Injectable, Logger } from '@nestjs/common';
import { ExecutionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { N8nClientService } from '../n8n/n8n-client.service';

/**
 * Port of services/execution.service.ts. Used by WorkflowsController's
 * `/:id/executions` route -- ExecutionsController itself is still a stub in
 * the Express app (see executions.controller.ts).
 */
@Injectable()
export class ExecutionsService {
  private readonly logger = new Logger(ExecutionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly n8nClient: N8nClientService,
  ) {}

  async syncWorkflowExecutions(userWorkflowId: string, limit = 20) {
    const workflow = await this.prisma.userWorkflow.findUnique({
      where: { id: userWorkflowId },
    });

    if (!workflow || !workflow.n8nWorkflowId) {
      return [];
    }

    try {
      const n8nExecutions = await this.n8nClient.getExecutions(
        workflow.n8nWorkflowId,
        limit,
      );

      for (const n8nExec of n8nExecutions) {
        let status: ExecutionStatus = 'running';
        if (n8nExec.finished) {
          status = n8nExec.status === 'success' ? 'success' : 'error';
        } else if (n8nExec.status === 'running') {
          status = 'running';
        } else if (n8nExec.status === 'waiting') {
          status = 'waiting';
        }

        let durationMs = 0;
        const start = new Date(n8nExec.startedAt);
        if (n8nExec.stoppedAt) {
          durationMs = new Date(n8nExec.stoppedAt).getTime() - start.getTime();
        }

        const existing = await this.prisma.execution.findFirst({
          where: { n8nExecutionId: n8nExec.id },
        });

        if (!existing) {
          await this.prisma.execution.create({
            data: {
              userWorkflowId,
              n8nExecutionId: n8nExec.id,
              status,
              startedAt: start,
              finishedAt: n8nExec.stoppedAt
                ? new Date(n8nExec.stoppedAt)
                : null,
              durationMs,
              isTestRun: n8nExec.mode === 'manual',
            },
          });
        } else if (existing.status !== status) {
          await this.prisma.execution.update({
            where: { id: existing.id },
            data: {
              status,
              finishedAt: n8nExec.stoppedAt
                ? new Date(n8nExec.stoppedAt)
                : null,
              durationMs,
            },
          });
        }
      }

      await this.updateWorkflowStatistics(userWorkflowId);
    } catch (error) {
      this.logger.error(
        `Failed to sync executions for workflow ${userWorkflowId}: ${error}`,
      );
    }

    return this.prisma.execution.findMany({
      where: { userWorkflowId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  async getWorkflowExecutions(userWorkflowId: string, limit = 20) {
    return this.prisma.execution.findMany({
      where: { userWorkflowId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  private async updateWorkflowStatistics(userWorkflowId: string) {
    const stats = await this.prisma.execution.groupBy({
      by: ['status'],
      where: { userWorkflowId },
      _count: true,
    });

    let success = 0;
    let failed = 0;
    let total = 0;

    for (const group of stats) {
      if (group.status === 'success') success = group._count;
      if (group.status === 'error') failed = group._count;
      total += group._count;
    }

    const lastExec = await this.prisma.execution.findFirst({
      where: { userWorkflowId },
      orderBy: { startedAt: 'desc' },
    });

    const lastSuccess = await this.prisma.execution.findFirst({
      where: { userWorkflowId, status: 'success' },
      orderBy: { startedAt: 'desc' },
    });

    const lastFailure = await this.prisma.execution.findFirst({
      where: { userWorkflowId, status: 'error' },
      orderBy: { startedAt: 'desc' },
    });

    const avgDurationAgg = await this.prisma.execution.aggregate({
      where: { userWorkflowId, status: 'success' },
      _avg: { durationMs: true },
    });

    const avgDurationMs = avgDurationAgg._avg.durationMs
      ? Math.round(avgDurationAgg._avg.durationMs)
      : 0;

    await this.prisma.workflowStatistics.upsert({
      where: { userWorkflowId },
      create: {
        userWorkflowId,
        totalExecutions: total,
        successfulExecutions: success,
        failedExecutions: failed,
        lastExecutionAt: lastExec?.startedAt,
        lastSuccessAt: lastSuccess?.startedAt,
        lastFailureAt: lastFailure?.startedAt,
        avgDurationMs,
      },
      update: {
        totalExecutions: total,
        successfulExecutions: success,
        failedExecutions: failed,
        lastExecutionAt: lastExec?.startedAt,
        lastSuccessAt: lastSuccess?.startedAt,
        lastFailureAt: lastFailure?.startedAt,
        avgDurationMs,
      },
    });
  }
}
