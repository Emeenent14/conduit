import { ExecutionsService } from './executions.service';

describe(ExecutionsService, () => {
  let service: ExecutionsService;
  let mockPrisma: {
    userWorkflow: {
      findUnique: jest.Mock;
    };
    execution: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      findMany: jest.Mock;
      groupBy: jest.Mock;
      aggregate: jest.Mock;
    };
    workflowStatistics: {
      upsert: jest.Mock;
    };
  };
  let mockN8n: {
    getExecutions: jest.Mock;
  };

  beforeEach(() => {
    mockPrisma = {
      userWorkflow: {
        findUnique: jest.fn(),
      },
      execution: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        groupBy: jest.fn(),
        aggregate: jest.fn(),
      },
      workflowStatistics: {
        upsert: jest.fn(),
      },
    };
    mockN8n = {
      getExecutions: jest.fn(),
    };

    service = new ExecutionsService(mockPrisma as any, mockN8n as any);

    // Default stats-related mocks so tests that don't care about statistics
    // don't have to stub every call individually.
    mockPrisma.execution.groupBy.mockResolvedValue([]);
    mockPrisma.execution.findFirst.mockResolvedValue(null);
    mockPrisma.execution.aggregate.mockResolvedValue({
      _avg: { durationMs: null },
    });
    mockPrisma.workflowStatistics.upsert.mockResolvedValue({});
    mockPrisma.execution.findMany.mockResolvedValue([]);
  });

  describe('syncWorkflowExecutions', () => {
    it('returns [] immediately when the workflow is not found', async () => {
      mockPrisma.userWorkflow.findUnique.mockResolvedValue(null);

      const result = await service.syncWorkflowExecutions('uw-1');

      expect(result).toEqual([]);
      expect(mockN8n.getExecutions).not.toHaveBeenCalled();
    });

    it('returns [] immediately when the workflow has no n8nWorkflowId', async () => {
      mockPrisma.userWorkflow.findUnique.mockResolvedValue({
        id: 'uw-1',
        n8nWorkflowId: null,
      });

      const result = await service.syncWorkflowExecutions('uw-1');

      expect(result).toEqual([]);
      expect(mockN8n.getExecutions).not.toHaveBeenCalled();
    });

    describe('status mapping and creation', () => {
      beforeEach(() => {
        mockPrisma.userWorkflow.findUnique.mockResolvedValue({
          id: 'uw-1',
          n8nWorkflowId: 'n8n-wf-1',
        });
        // No existing execution row for any of these -> create path.
        mockPrisma.execution.findFirst.mockImplementation((args: any) => {
          // stats lookups pass { userWorkflowId, ... } without n8nExecutionId
          if (args?.where?.n8nExecutionId) return Promise.resolve(null);
          return Promise.resolve(null);
        });
      });

      it('maps finished + status success -> success', async () => {
        mockN8n.getExecutions.mockResolvedValue([
          {
            id: 'exec-1',
            finished: true,
            mode: 'trigger',
            status: 'success',
            startedAt: '2024-01-01T00:00:00.000Z',
            stoppedAt: '2024-01-01T00:00:05.000Z',
            workflowId: 'n8n-wf-1',
          },
        ]);

        await service.syncWorkflowExecutions('uw-1');

        expect(mockPrisma.execution.create).toHaveBeenCalledWith({
          data: {
            userWorkflowId: 'uw-1',
            n8nExecutionId: 'exec-1',
            status: 'success',
            startedAt: new Date('2024-01-01T00:00:00.000Z'),
            finishedAt: new Date('2024-01-01T00:00:05.000Z'),
            durationMs: 5000,
            isTestRun: false,
          },
        });
      });

      it('maps finished + status other than success -> error', async () => {
        mockN8n.getExecutions.mockResolvedValue([
          {
            id: 'exec-2',
            finished: true,
            mode: 'manual',
            status: 'error',
            startedAt: '2024-01-01T00:00:00.000Z',
            stoppedAt: '2024-01-01T00:00:02.000Z',
            workflowId: 'n8n-wf-1',
          },
        ]);

        await service.syncWorkflowExecutions('uw-1');

        expect(mockPrisma.execution.create).toHaveBeenCalledWith({
          data: {
            userWorkflowId: 'uw-1',
            n8nExecutionId: 'exec-2',
            status: 'error',
            startedAt: new Date('2024-01-01T00:00:00.000Z'),
            finishedAt: new Date('2024-01-01T00:00:02.000Z'),
            durationMs: 2000,
            isTestRun: true,
          },
        });
      });

      it('maps not-finished + status running -> running', async () => {
        mockN8n.getExecutions.mockResolvedValue([
          {
            id: 'exec-3',
            finished: false,
            mode: 'trigger',
            status: 'running',
            startedAt: '2024-01-01T00:00:00.000Z',
            workflowId: 'n8n-wf-1',
          },
        ]);

        await service.syncWorkflowExecutions('uw-1');

        expect(mockPrisma.execution.create).toHaveBeenCalledWith({
          data: {
            userWorkflowId: 'uw-1',
            n8nExecutionId: 'exec-3',
            status: 'running',
            startedAt: new Date('2024-01-01T00:00:00.000Z'),
            finishedAt: null,
            durationMs: 0,
            isTestRun: false,
          },
        });
      });

      it('maps not-finished + status waiting -> waiting', async () => {
        mockN8n.getExecutions.mockResolvedValue([
          {
            id: 'exec-4',
            finished: false,
            mode: 'trigger',
            status: 'waiting',
            startedAt: '2024-01-01T00:00:00.000Z',
            workflowId: 'n8n-wf-1',
          },
        ]);

        await service.syncWorkflowExecutions('uw-1');

        expect(mockPrisma.execution.create).toHaveBeenCalledWith({
          data: {
            userWorkflowId: 'uw-1',
            n8nExecutionId: 'exec-4',
            status: 'waiting',
            startedAt: new Date('2024-01-01T00:00:00.000Z'),
            finishedAt: null,
            durationMs: 0,
            isTestRun: false,
          },
        });
      });
    });

    describe('updating existing rows', () => {
      beforeEach(() => {
        mockPrisma.userWorkflow.findUnique.mockResolvedValue({
          id: 'uw-1',
          n8nWorkflowId: 'n8n-wf-1',
        });
      });

      it('updates the existing row when the freshly-computed status differs', async () => {
        mockN8n.getExecutions.mockResolvedValue([
          {
            id: 'exec-1',
            finished: true,
            mode: 'trigger',
            status: 'success',
            startedAt: '2024-01-01T00:00:00.000Z',
            stoppedAt: '2024-01-01T00:00:05.000Z',
            workflowId: 'n8n-wf-1',
          },
        ]);
        mockPrisma.execution.findFirst.mockImplementation((args: any) => {
          if (args?.where?.n8nExecutionId === 'exec-1') {
            return Promise.resolve({
              id: 'row-1',
              status: 'running',
            });
          }
          return Promise.resolve(null);
        });

        await service.syncWorkflowExecutions('uw-1');

        expect(mockPrisma.execution.create).not.toHaveBeenCalled();
        expect(mockPrisma.execution.update).toHaveBeenCalledWith({
          where: { id: 'row-1' },
          data: {
            status: 'success',
            finishedAt: new Date('2024-01-01T00:00:05.000Z'),
            durationMs: 5000,
          },
        });
      });

      it('does NOT call update when the stored status already matches (no-op)', async () => {
        mockN8n.getExecutions.mockResolvedValue([
          {
            id: 'exec-1',
            finished: true,
            mode: 'trigger',
            status: 'success',
            startedAt: '2024-01-01T00:00:00.000Z',
            stoppedAt: '2024-01-01T00:00:05.000Z',
            workflowId: 'n8n-wf-1',
          },
        ]);
        mockPrisma.execution.findFirst.mockImplementation((args: any) => {
          if (args?.where?.n8nExecutionId === 'exec-1') {
            return Promise.resolve({
              id: 'row-1',
              status: 'success',
            });
          }
          return Promise.resolve(null);
        });

        await service.syncWorkflowExecutions('uw-1');

        expect(mockPrisma.execution.create).not.toHaveBeenCalled();
        expect(mockPrisma.execution.update).not.toHaveBeenCalled();
      });
    });

    describe('duration computation', () => {
      beforeEach(() => {
        mockPrisma.userWorkflow.findUnique.mockResolvedValue({
          id: 'uw-1',
          n8nWorkflowId: 'n8n-wf-1',
        });
        mockPrisma.execution.findFirst.mockImplementation((args: any) => {
          if (args?.where?.n8nExecutionId) return Promise.resolve(null);
          return Promise.resolve(null);
        });
      });

      it('computes durationMs as 0 when stoppedAt is absent', async () => {
        mockN8n.getExecutions.mockResolvedValue([
          {
            id: 'exec-1',
            finished: false,
            mode: 'trigger',
            status: 'running',
            startedAt: '2024-01-01T00:00:00.000Z',
            workflowId: 'n8n-wf-1',
          },
        ]);

        await service.syncWorkflowExecutions('uw-1');

        expect(mockPrisma.execution.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ durationMs: 0 }),
          }),
        );
      });
    });

    describe('statistics aggregation', () => {
      beforeEach(() => {
        mockPrisma.userWorkflow.findUnique.mockResolvedValue({
          id: 'uw-1',
          n8nWorkflowId: 'n8n-wf-1',
        });
        mockN8n.getExecutions.mockResolvedValue([]);
      });

      it('upserts workflowStatistics with aggregated values from groupBy/aggregate', async () => {
        mockPrisma.execution.groupBy.mockResolvedValue([
          { status: 'success', _count: 7 },
          { status: 'error', _count: 3 },
          { status: 'running', _count: 1 },
        ]);
        const lastExecAt = new Date('2024-01-05T00:00:00.000Z');
        const lastSuccessAt = new Date('2024-01-04T00:00:00.000Z');
        const lastFailureAt = new Date('2024-01-03T00:00:00.000Z');
        mockPrisma.execution.findFirst.mockImplementation((args: any) => {
          if (args?.where?.status === 'success') {
            return Promise.resolve({ startedAt: lastSuccessAt });
          }
          if (args?.where?.status === 'error') {
            return Promise.resolve({ startedAt: lastFailureAt });
          }
          return Promise.resolve({ startedAt: lastExecAt });
        });
        mockPrisma.execution.aggregate.mockResolvedValue({
          _avg: { durationMs: 1234.6 },
        });

        await service.syncWorkflowExecutions('uw-1');

        expect(mockPrisma.execution.groupBy).toHaveBeenCalledWith({
          by: ['status'],
          where: { userWorkflowId: 'uw-1' },
          _count: true,
        });
        expect(mockPrisma.execution.aggregate).toHaveBeenCalledWith({
          where: { userWorkflowId: 'uw-1', status: 'success' },
          _avg: { durationMs: true },
        });
        expect(mockPrisma.workflowStatistics.upsert).toHaveBeenCalledWith({
          where: { userWorkflowId: 'uw-1' },
          create: {
            userWorkflowId: 'uw-1',
            totalExecutions: 11,
            successfulExecutions: 7,
            failedExecutions: 3,
            lastExecutionAt: lastExecAt,
            lastSuccessAt: lastSuccessAt,
            lastFailureAt: lastFailureAt,
            avgDurationMs: 1235,
          },
          update: {
            totalExecutions: 11,
            successfulExecutions: 7,
            failedExecutions: 3,
            lastExecutionAt: lastExecAt,
            lastSuccessAt: lastSuccessAt,
            lastFailureAt: lastFailureAt,
            avgDurationMs: 1235,
          },
        });
      });

      it('defaults avgDurationMs to 0 when there is no average', async () => {
        mockPrisma.execution.groupBy.mockResolvedValue([]);
        mockPrisma.execution.aggregate.mockResolvedValue({
          _avg: { durationMs: null },
        });

        await service.syncWorkflowExecutions('uw-1');

        expect(mockPrisma.workflowStatistics.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            create: expect.objectContaining({ avgDurationMs: 0 }),
          }),
        );
      });
    });

    describe('n8n failure handling', () => {
      it('catches a rejection from n8nClient.getExecutions and still returns current Prisma rows', async () => {
        mockPrisma.userWorkflow.findUnique.mockResolvedValue({
          id: 'uw-1',
          n8nWorkflowId: 'n8n-wf-1',
        });
        mockN8n.getExecutions.mockRejectedValue(new Error('n8n is down'));
        const existingRows = [{ id: 'row-1' }];
        mockPrisma.execution.findMany.mockResolvedValue(existingRows);

        const result = await service.syncWorkflowExecutions('uw-1');

        expect(result).toEqual(existingRows);
        // Statistics update is inside the try block after the loop, so a
        // rejection from getExecutions means it's never reached.
        expect(mockPrisma.workflowStatistics.upsert).not.toHaveBeenCalled();
        expect(mockPrisma.execution.findMany).toHaveBeenCalledWith({
          where: { userWorkflowId: 'uw-1' },
          orderBy: { startedAt: 'desc' },
          take: 20,
        });
      });
    });

    it('uses the provided limit for getExecutions and the final findMany', async () => {
      mockPrisma.userWorkflow.findUnique.mockResolvedValue({
        id: 'uw-1',
        n8nWorkflowId: 'n8n-wf-1',
      });
      mockN8n.getExecutions.mockResolvedValue([]);

      await service.syncWorkflowExecutions('uw-1', 5);

      expect(mockN8n.getExecutions).toHaveBeenCalledWith('n8n-wf-1', 5);
      expect(mockPrisma.execution.findMany).toHaveBeenCalledWith({
        where: { userWorkflowId: 'uw-1' },
        orderBy: { startedAt: 'desc' },
        take: 5,
      });
    });
  });

  describe('getWorkflowExecutions', () => {
    it('is a thin Prisma wrapper using the default limit', async () => {
      mockPrisma.execution.findMany.mockResolvedValue([{ id: 'exec-1' }]);

      const result = await service.getWorkflowExecutions('uw-1');

      expect(mockPrisma.execution.findMany).toHaveBeenCalledWith({
        where: { userWorkflowId: 'uw-1' },
        orderBy: { startedAt: 'desc' },
        take: 20,
      });
      expect(result).toEqual([{ id: 'exec-1' }]);
    });

    it('passes through a custom limit', async () => {
      mockPrisma.execution.findMany.mockResolvedValue([]);

      await service.getWorkflowExecutions('uw-1', 3);

      expect(mockPrisma.execution.findMany).toHaveBeenCalledWith({
        where: { userWorkflowId: 'uw-1' },
        orderBy: { startedAt: 'desc' },
        take: 3,
      });
    });
  });
});
