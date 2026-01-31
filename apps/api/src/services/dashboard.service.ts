import { prisma } from '../lib/prisma';

export interface DashboardStats {
    totalWorkflows: number;
    activeWorkflows: number;
    totalExecutions: number;
    successRate: number;
}

export interface ActivityItem {
    id: string;
    type: 'execution' | 'workflow_created';
    title: string;
    status?: string;
    timestamp: Date;
    meta: any;
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
    // Parallelize queries for performance
    const [totalWorkflows, activeWorkflows, stats] = await Promise.all([
        prisma.userWorkflow.count({ where: { userId } }),
        prisma.userWorkflow.count({ where: { userId, status: 'active' } }),
        prisma.execution.groupBy({
            by: ['status'],
            where: { userWorkflow: { userId } },
            _count: true,
        }),
    ]);

    let successfulExecutions = 0;
    let totalExecutions = 0;

    stats.forEach((group) => {
        totalExecutions += group._count;
        if (group.status === 'success') {
            successfulExecutions += group._count;
        }
    });

    const successRate = totalExecutions > 0
        ? Math.round((successfulExecutions / totalExecutions) * 100)
        : 0;

    return {
        totalWorkflows,
        activeWorkflows,
        totalExecutions,
        successRate,
    };
}

export async function getRecentActivity(userId: string, limit = 10): Promise<ActivityItem[]> {
    // Fetch recent executions
    const executions = await prisma.execution.findMany({
        where: { userWorkflow: { userId } },
        take: limit,
        orderBy: { startedAt: 'desc' },
        include: {
            userWorkflow: {
                select: { name: true, id: true }
            }
        }
    });

    // Fetch recently created workflows
    const newWorkflows = await prisma.userWorkflow.findMany({
        where: { userId },
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            name: true,
            createdAt: true,
            template: {
                select: { name: true }
            }
        }
    });

    // Combine and sort
    const activities: ActivityItem[] = [
        ...executions.map(exec => ({
            id: exec.id,
            type: 'execution' as const,
            title: `Executed ${exec.userWorkflow.name}`,
            status: exec.status,
            timestamp: exec.startedAt,
            meta: {
                workflowId: exec.userWorkflowId,
                duration: exec.durationMs
            }
        })),
        ...newWorkflows.map(wf => ({
            id: wf.id,
            type: 'workflow_created' as const,
            title: `Created workflow ${wf.name}`,
            timestamp: wf.createdAt,
            meta: {
                workflowId: wf.id,
                templateName: wf.template.name
            }
        }))
    ];

    return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
}
