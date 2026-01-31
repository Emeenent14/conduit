import { prisma } from '../lib/prisma';
import { n8nClient } from './n8n.client';
import { ExecutionStatus } from '@prisma/client';
import { logger } from '../lib/logger';

// ============================================
// Execution Service
// ============================================

/**
 * Sync executions for a workflow from n8n
 */
export async function syncWorkflowExecutions(userWorkflowId: string, limit = 20) {
    const workflow = await prisma.userWorkflow.findUnique({
        where: { id: userWorkflowId },
    });

    if (!workflow || !workflow.n8nWorkflowId) {
        return [];
    }

    try {
        const n8nExecutions = await n8nClient.getExecutions(workflow.n8nWorkflowId, limit);

        // Process executions
        for (const n8nExec of n8nExecutions) {
            // Map status
            let status: ExecutionStatus = 'running';
            if (n8nExec.finished) {
                status = n8nExec.status === 'success' ? 'success' : 'error';
            } else if (n8nExec.status === 'running') {
                status = 'running';
            } else if (n8nExec.status === 'waiting') {
                status = 'waiting';
            }

            // Calculate duration
            let durationMs = 0;
            const start = new Date(n8nExec.startedAt);
            if (n8nExec.stoppedAt) {
                const end = new Date(n8nExec.stoppedAt);
                durationMs = end.getTime() - start.getTime();
            }

            // Upsert execution
            // using n8nExecutionId as unique key via findFirst logic or just create if not exists
            // Prisma doesn't always support upsert on non-unique fields easily if n8nExecutionId isn't marked unique in schema?
            // Schema: @@index([n8nExecutionId]) but NOT @unique. 
            // So we should check existence first.

            const existing = await prisma.execution.findFirst({
                where: { n8nExecutionId: n8nExec.id }
            });

            if (!existing) {
                await prisma.execution.create({
                    data: {
                        userWorkflowId,
                        n8nExecutionId: n8nExec.id,
                        status,
                        startedAt: start,
                        finishedAt: n8nExec.stoppedAt ? new Date(n8nExec.stoppedAt) : null,
                        durationMs,
                        isTestRun: n8nExec.mode === 'manual',
                        // We could fetch details for error message if status is error
                        // For now, minimal info
                    }
                });
            } else {
                // Update if status changed (e.g. was running, now finished)
                if (existing.status !== status) {
                    await prisma.execution.update({
                        where: { id: existing.id },
                        data: {
                            status,
                            finishedAt: n8nExec.stoppedAt ? new Date(n8nExec.stoppedAt) : null,
                            durationMs
                        }
                    });
                }
            }
        }

        // Update statistics
        await updateWorkflowStatistics(userWorkflowId);

    } catch (error) {
        logger.error('Failed to sync executions', { error, userWorkflowId });
        // Don't throw, just return local DB executions
    }

    // Return all executions from DB sorted
    return prisma.execution.findMany({
        where: { userWorkflowId },
        orderBy: { startedAt: 'desc' },
        take: limit
    });
}

/**
 * Get executions for a workflow (local DB only)
 */
export async function getWorkflowExecutions(userWorkflowId: string, limit = 20) {
    return prisma.execution.findMany({
        where: { userWorkflowId },
        orderBy: { startedAt: 'desc' },
        take: limit
    });
}

/**
 * Update aggregate statistics for a workflow
 */
async function updateWorkflowStatistics(userWorkflowId: string) {
    const stats = await prisma.execution.groupBy({
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

    const lastExec = await prisma.execution.findFirst({
        where: { userWorkflowId },
        orderBy: { startedAt: 'desc' }
    });

    const lastSuccess = await prisma.execution.findFirst({
        where: { userWorkflowId, status: 'success' },
        orderBy: { startedAt: 'desc' }
    });

    const lastFailure = await prisma.execution.findFirst({
        where: { userWorkflowId, status: 'error' },
        orderBy: { startedAt: 'desc' }
    });

    // Avg duration (only successful ones)
    const avgDurationAgg = await prisma.execution.aggregate({
        where: { userWorkflowId, status: 'success' },
        _avg: { durationMs: true }
    });

    await prisma.workflowStatistics.upsert({
        where: { userWorkflowId },
        create: {
            userWorkflowId,
            totalExecutions: total,
            successfulExecutions: success,
            failedExecutions: failed,
            lastExecutionAt: lastExec?.startedAt,
            lastSuccessAt: lastSuccess?.startedAt,
            lastFailureAt: lastFailure?.startedAt,
            avgDurationMs: avgDurationAgg._avg.durationMs ? Math.round(avgDurationAgg._avg.durationMs) : 0
        },
        update: {
            totalExecutions: total,
            successfulExecutions: success,
            failedExecutions: failed,
            lastExecutionAt: lastExec?.startedAt,
            lastSuccessAt: lastSuccess?.startedAt,
            lastFailureAt: lastFailure?.startedAt,
            avgDurationMs: avgDurationAgg._avg.durationMs ? Math.round(avgDurationAgg._avg.durationMs) : 0
        }
    });
}
