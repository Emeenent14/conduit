import { DashboardService } from './dashboard.service';

describe(DashboardService, () => {
  let service: DashboardService;
  let mockPrisma: {
    userWorkflow: {
      count: jest.Mock;
      findMany: jest.Mock;
    };
    execution: {
      groupBy: jest.Mock;
      findMany: jest.Mock;
    };
  };

  beforeEach(() => {
    mockPrisma = {
      userWorkflow: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      execution: {
        groupBy: jest.fn(),
        findMany: jest.fn(),
      },
    };
    service = new DashboardService(mockPrisma as any);
  });

  describe('getDashboardStats', () => {
    it('computes successRate as a rounded percentage from grouped execution counts', async () => {
      mockPrisma.userWorkflow.count
        .mockResolvedValueOnce(5) // totalWorkflows
        .mockResolvedValueOnce(3); // activeWorkflows
      mockPrisma.execution.groupBy.mockResolvedValue([
        { status: 'success', _count: 7 },
        { status: 'error', _count: 2 },
        { status: 'running', _count: 1 },
      ]);

      const result = await service.getDashboardStats('user-1');

      // successful=7, total=10 -> 70%
      expect(result).toEqual({
        totalWorkflows: 5,
        activeWorkflows: 3,
        totalExecutions: 10,
        successRate: 70,
      });
      expect(mockPrisma.userWorkflow.count).toHaveBeenNthCalledWith(1, {
        where: { userId: 'user-1' },
      });
      expect(mockPrisma.userWorkflow.count).toHaveBeenNthCalledWith(2, {
        where: { userId: 'user-1', status: 'active' },
      });
      expect(mockPrisma.execution.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        where: { userWorkflow: { userId: 'user-1' } },
        _count: true,
      });
    });

    it('rounds the success rate to the nearest integer', async () => {
      mockPrisma.userWorkflow.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockPrisma.execution.groupBy.mockResolvedValue([
        { status: 'success', _count: 1 },
        { status: 'error', _count: 2 },
      ]);

      const result = await service.getDashboardStats('user-1');

      // successful=1, total=3 -> 33.33...% rounds to 33
      expect(result.successRate).toBe(33);
      expect(result.totalExecutions).toBe(3);
    });

    it('returns successRate 0 (not NaN) when there are zero total executions', async () => {
      mockPrisma.userWorkflow.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockPrisma.execution.groupBy.mockResolvedValue([]);

      const result = await service.getDashboardStats('user-1');

      expect(result.totalExecutions).toBe(0);
      expect(result.successRate).toBe(0);
      expect(Number.isNaN(result.successRate)).toBe(false);
    });
  });

  describe('getRecentActivity', () => {
    it('merges executions and workflow creations into typed activity items', async () => {
      mockPrisma.execution.findMany.mockResolvedValue([
        {
          id: 'exec-1',
          status: 'success',
          startedAt: new Date('2026-08-01T10:00:00Z'),
          userWorkflowId: 'wf-1',
          durationMs: 1234,
          userWorkflow: { name: 'My Workflow', id: 'wf-1' },
        },
      ]);
      mockPrisma.userWorkflow.findMany.mockResolvedValue([
        {
          id: 'wf-2',
          name: 'New Workflow',
          createdAt: new Date('2026-08-02T10:00:00Z'),
          template: { name: 'Slack Template' },
        },
      ]);

      const result = await service.getRecentActivity('user-1', 10);

      expect(result).toEqual([
        {
          id: 'wf-2',
          type: 'workflow_created',
          title: 'Created workflow New Workflow',
          timestamp: new Date('2026-08-02T10:00:00Z'),
          meta: { workflowId: 'wf-2', templateName: 'Slack Template' },
        },
        {
          id: 'exec-1',
          type: 'execution',
          title: 'Executed My Workflow',
          status: 'success',
          timestamp: new Date('2026-08-01T10:00:00Z'),
          meta: { workflowId: 'wf-1', duration: 1234 },
        },
      ]);
    });

    it('sorts merged activity descending by timestamp', async () => {
      mockPrisma.execution.findMany.mockResolvedValue([
        {
          id: 'exec-old',
          status: 'success',
          startedAt: new Date('2026-01-01T00:00:00Z'),
          userWorkflowId: 'wf-1',
          durationMs: 100,
          userWorkflow: { name: 'Old Exec', id: 'wf-1' },
        },
        {
          id: 'exec-new',
          status: 'success',
          startedAt: new Date('2026-08-03T00:00:00Z'),
          userWorkflowId: 'wf-1',
          durationMs: 200,
          userWorkflow: { name: 'New Exec', id: 'wf-1' },
        },
      ]);
      mockPrisma.userWorkflow.findMany.mockResolvedValue([
        {
          id: 'wf-mid',
          name: 'Mid Workflow',
          createdAt: new Date('2026-04-01T00:00:00Z'),
          template: { name: 'Template' },
        },
      ]);

      const result = await service.getRecentActivity('user-1', 10);

      expect(result.map((a) => a.id)).toEqual([
        'exec-new',
        'wf-mid',
        'exec-old',
      ]);
    });

    it('caps the merged list at limit even when combined sources exceed it', async () => {
      mockPrisma.execution.findMany.mockResolvedValue([
        {
          id: 'exec-1',
          status: 'success',
          startedAt: new Date('2026-08-04T00:00:00Z'),
          userWorkflowId: 'wf-1',
          durationMs: 10,
          userWorkflow: { name: 'Exec 1', id: 'wf-1' },
        },
        {
          id: 'exec-2',
          status: 'success',
          startedAt: new Date('2026-08-03T00:00:00Z'),
          userWorkflowId: 'wf-1',
          durationMs: 20,
          userWorkflow: { name: 'Exec 2', id: 'wf-1' },
        },
        {
          id: 'exec-3',
          status: 'success',
          startedAt: new Date('2026-08-02T00:00:00Z'),
          userWorkflowId: 'wf-1',
          durationMs: 30,
          userWorkflow: { name: 'Exec 3', id: 'wf-1' },
        },
      ]);
      mockPrisma.userWorkflow.findMany.mockResolvedValue([
        {
          id: 'wf-a',
          name: 'Workflow A',
          createdAt: new Date('2026-08-01T00:00:00Z'),
          template: { name: 'Template A' },
        },
        {
          id: 'wf-b',
          name: 'Workflow B',
          createdAt: new Date('2026-07-31T00:00:00Z'),
          template: { name: 'Template B' },
        },
      ]);

      const result = await service.getRecentActivity('user-1', 2);

      expect(result).toHaveLength(2);
      expect(result.map((a) => a.id)).toEqual(['exec-1', 'exec-2']);
      expect(mockPrisma.execution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 2 }),
      );
      expect(mockPrisma.userWorkflow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 2 }),
      );
    });

    it('defaults limit to 10 when not provided', async () => {
      mockPrisma.execution.findMany.mockResolvedValue([]);
      mockPrisma.userWorkflow.findMany.mockResolvedValue([]);

      await service.getRecentActivity('user-1');

      expect(mockPrisma.execution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 }),
      );
      expect(mockPrisma.userWorkflow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 }),
      );
    });
  });
});
