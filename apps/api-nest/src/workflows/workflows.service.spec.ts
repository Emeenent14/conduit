import { WorkflowsService } from './workflows.service';

describe(WorkflowsService, () => {
  let service: WorkflowsService;
  let mockPrisma: {
    userWorkflow: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    template: {
      findUnique: jest.Mock;
    };
    workflowStatistics: {
      create: jest.Mock;
    };
  };
  let mockN8n: {
    createWorkflow: jest.Mock;
    activateWorkflow: jest.Mock;
    deactivateWorkflow: jest.Mock;
    deleteWorkflow: jest.Mock;
  };
  let mockCredentials: {
    getCredentialById: jest.Mock;
  };

  beforeEach(() => {
    mockPrisma = {
      userWorkflow: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      template: {
        findUnique: jest.fn(),
      },
      workflowStatistics: {
        create: jest.fn(),
      },
    };
    mockN8n = {
      createWorkflow: jest.fn(),
      activateWorkflow: jest.fn(),
      deactivateWorkflow: jest.fn(),
      deleteWorkflow: jest.fn(),
    };
    mockCredentials = {
      getCredentialById: jest.fn(),
    };

    service = new WorkflowsService(
      mockPrisma as any,
      mockN8n as any,
      mockCredentials as any,
    );
  });

  describe('listUserWorkflows', () => {
    it('passes through the correct where/include/orderBy shape', async () => {
      mockPrisma.userWorkflow.findMany.mockResolvedValue([{ id: 'wf-1' }]);

      const result = await service.listUserWorkflows('user-1');

      expect(mockPrisma.userWorkflow.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: {
          template: { select: { name: true, slug: true } },
          statistics: true,
        },
        orderBy: { updatedAt: 'desc' },
      });
      expect(result).toEqual([{ id: 'wf-1' }]);
    });
  });

  describe('getWorkflowById', () => {
    it('passes through the correct where/include shape', async () => {
      mockPrisma.userWorkflow.findFirst.mockResolvedValue({ id: 'wf-1' });

      const result = await service.getWorkflowById('wf-1', 'user-1');

      expect(mockPrisma.userWorkflow.findFirst).toHaveBeenCalledWith({
        where: { id: 'wf-1', userId: 'user-1' },
        include: {
          template: true,
          credentialMappings: {
            include: { credential: { include: { app: true } } },
          },
          statistics: true,
          executions: { take: 5, orderBy: { startedAt: 'desc' } },
        },
      });
      expect(result).toEqual({ id: 'wf-1' });
    });
  });

  describe('createWorkflow', () => {
    const baseInput = {
      userId: 'user-12345678-abcd',
      templateId: 'tpl-1',
      name: 'My Workflow',
      description: 'A description',
      configValues: { foo: 'bar' },
      credentialMappings: [] as Array<{
        appSlug: string;
        credentialId: string;
      }>,
    };

    it('throws when the template is not found', async () => {
      mockPrisma.template.findUnique.mockResolvedValue(null);

      await expect(service.createWorkflow(baseInput)).rejects.toThrow(
        'Template not found',
      );
      expect(mockN8n.createWorkflow).not.toHaveBeenCalled();
    });

    it('creates the workflow on the happy path with empty credentialMappings', async () => {
      const n8nWorkflow = {
        name: 'template-name',
        nodes: [
          {
            name: 'Node 1',
            type: 'some.type',
            typeVersion: 1,
            position: [0, 0],
            parameters: {},
            credentials: { someCred: 'placeholder' },
          },
        ],
        connections: {},
      };
      mockPrisma.template.findUnique.mockResolvedValue({
        id: 'tpl-1',
        n8nWorkflow,
      });
      mockN8n.createWorkflow.mockResolvedValue({ id: 'n8n-wf-1' });
      mockPrisma.userWorkflow.create.mockResolvedValue({
        id: 'uw-1',
        userId: baseInput.userId,
      });
      mockPrisma.workflowStatistics.create.mockResolvedValue({});

      const result = await service.createWorkflow(baseInput);

      // Name mutated to include the truncated userId
      expect(mockN8n.createWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({
          name: `My Workflow (${baseInput.userId.substring(0, 8)})`,
        }),
      );
      expect(mockCredentials.getCredentialById).not.toHaveBeenCalled();

      expect(mockPrisma.userWorkflow.create).toHaveBeenCalledWith({
        data: {
          userId: baseInput.userId,
          templateId: baseInput.templateId,
          name: baseInput.name,
          description: baseInput.description,
          configValues: baseInput.configValues,
          n8nWorkflowId: 'n8n-wf-1',
          n8nWorkflowData: expect.objectContaining({
            name: `My Workflow (${baseInput.userId.substring(0, 8)})`,
          }),
          status: 'inactive',
          credentialMappings: { create: [] },
        },
      });
      expect(mockPrisma.workflowStatistics.create).toHaveBeenCalledWith({
        data: { userWorkflowId: 'uw-1' },
      });
      expect(result).toEqual({ id: 'uw-1', userId: baseInput.userId });
    });

    it('does not break when credentialMappings is non-empty (no-op injection loop)', async () => {
      const n8nWorkflow = {
        name: 'template-name',
        nodes: [
          {
            name: 'Node 1',
            type: 'some.type',
            typeVersion: 1,
            position: [0, 0],
            parameters: {},
            credentials: { someCred: 'placeholder' },
          },
        ],
        connections: {},
      };
      mockPrisma.template.findUnique.mockResolvedValue({
        id: 'tpl-1',
        n8nWorkflow,
      });
      mockCredentials.getCredentialById.mockResolvedValue({
        id: 'cred-1',
        n8nCredentialId: 'n8n-cred-1',
      });
      mockN8n.createWorkflow.mockResolvedValue({ id: 'n8n-wf-1' });
      mockPrisma.userWorkflow.create.mockResolvedValue({ id: 'uw-1' });
      mockPrisma.workflowStatistics.create.mockResolvedValue({});

      const input = {
        ...baseInput,
        credentialMappings: [{ appSlug: 'slack', credentialId: 'cred-1' }],
      };

      const result = await service.createWorkflow(input);

      expect(mockCredentials.getCredentialById).toHaveBeenCalledWith(
        'cred-1',
        baseInput.userId,
      );
      expect(mockPrisma.userWorkflow.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          credentialMappings: {
            create: [{ credentialId: 'cred-1', appSlug: 'slack' }],
          },
        }),
      });
      expect(result).toEqual({ id: 'uw-1' });
    });

    it('skips the credential-injection loop entirely when there are no nodes', async () => {
      const n8nWorkflow = {
        name: 'template-name',
        nodes: undefined,
        connections: {},
      };
      mockPrisma.template.findUnique.mockResolvedValue({
        id: 'tpl-1',
        n8nWorkflow,
      });
      mockN8n.createWorkflow.mockResolvedValue({ id: 'n8n-wf-1' });
      mockPrisma.userWorkflow.create.mockResolvedValue({ id: 'uw-1' });
      mockPrisma.workflowStatistics.create.mockResolvedValue({});

      await service.createWorkflow(baseInput);

      expect(mockCredentials.getCredentialById).not.toHaveBeenCalled();
      expect(mockN8n.createWorkflow).toHaveBeenCalled();
    });
  });

  describe('activateWorkflow', () => {
    it('throws when the workflow is not found', async () => {
      mockPrisma.userWorkflow.findFirst.mockResolvedValue(null);

      await expect(service.activateWorkflow('wf-1', 'user-1')).rejects.toThrow(
        'Workflow not found or not synced to n8n',
      );
      expect(mockN8n.activateWorkflow).not.toHaveBeenCalled();
    });

    it('throws when the workflow is found but not synced to n8n', async () => {
      mockPrisma.userWorkflow.findFirst.mockResolvedValue({
        id: 'wf-1',
        n8nWorkflowId: null,
      });

      await expect(service.activateWorkflow('wf-1', 'user-1')).rejects.toThrow(
        'Workflow not found or not synced to n8n',
      );
      expect(mockN8n.activateWorkflow).not.toHaveBeenCalled();
    });

    it('activates in n8n then updates Prisma on the happy path', async () => {
      mockPrisma.userWorkflow.findFirst.mockResolvedValue({
        id: 'wf-1',
        n8nWorkflowId: 'n8n-wf-1',
      });
      mockN8n.activateWorkflow.mockResolvedValue(undefined);
      mockPrisma.userWorkflow.update.mockResolvedValue({
        id: 'wf-1',
        status: 'active',
      });

      const result = await service.activateWorkflow('wf-1', 'user-1');

      expect(mockN8n.activateWorkflow).toHaveBeenCalledWith('n8n-wf-1');
      expect(mockPrisma.userWorkflow.update).toHaveBeenCalledWith({
        where: { id: 'wf-1' },
        data: {
          status: 'active',
          isActive: true,
          activatedAt: expect.any(Date),
        },
      });
      expect(result).toEqual({ id: 'wf-1', status: 'active' });
    });
  });

  describe('deactivateWorkflow', () => {
    it('throws when the workflow is not found', async () => {
      mockPrisma.userWorkflow.findFirst.mockResolvedValue(null);

      await expect(
        service.deactivateWorkflow('wf-1', 'user-1'),
      ).rejects.toThrow('Workflow not found or not synced to n8n');
      expect(mockN8n.deactivateWorkflow).not.toHaveBeenCalled();
    });

    it('throws when the workflow is found but not synced to n8n', async () => {
      mockPrisma.userWorkflow.findFirst.mockResolvedValue({
        id: 'wf-1',
        n8nWorkflowId: null,
      });

      await expect(
        service.deactivateWorkflow('wf-1', 'user-1'),
      ).rejects.toThrow('Workflow not found or not synced to n8n');
      expect(mockN8n.deactivateWorkflow).not.toHaveBeenCalled();
    });

    it('deactivates in n8n then updates Prisma on the happy path', async () => {
      mockPrisma.userWorkflow.findFirst.mockResolvedValue({
        id: 'wf-1',
        n8nWorkflowId: 'n8n-wf-1',
      });
      mockN8n.deactivateWorkflow.mockResolvedValue(undefined);
      mockPrisma.userWorkflow.update.mockResolvedValue({
        id: 'wf-1',
        status: 'inactive',
      });

      const result = await service.deactivateWorkflow('wf-1', 'user-1');

      expect(mockN8n.deactivateWorkflow).toHaveBeenCalledWith('n8n-wf-1');
      expect(mockPrisma.userWorkflow.update).toHaveBeenCalledWith({
        where: { id: 'wf-1' },
        data: {
          status: 'inactive',
          isActive: false,
          deactivatedAt: expect.any(Date),
        },
      });
      expect(result).toEqual({ id: 'wf-1', status: 'inactive' });
    });
  });

  describe('deleteWorkflow', () => {
    it('throws when the workflow is not found', async () => {
      mockPrisma.userWorkflow.findFirst.mockResolvedValue(null);

      await expect(service.deleteWorkflow('wf-1', 'user-1')).rejects.toThrow(
        'Workflow not found',
      );
      expect(mockPrisma.userWorkflow.delete).not.toHaveBeenCalled();
    });

    it('calls n8nClient.deleteWorkflow and deletes the Prisma row when n8nWorkflowId is set', async () => {
      mockPrisma.userWorkflow.findFirst.mockResolvedValue({
        id: 'wf-1',
        n8nWorkflowId: 'n8n-wf-1',
      });
      mockN8n.deleteWorkflow.mockResolvedValue(undefined);
      mockPrisma.userWorkflow.delete.mockResolvedValue({ id: 'wf-1' });

      const result = await service.deleteWorkflow('wf-1', 'user-1');

      expect(mockN8n.deleteWorkflow).toHaveBeenCalledWith('n8n-wf-1');
      expect(mockPrisma.userWorkflow.delete).toHaveBeenCalledWith({
        where: { id: 'wf-1' },
      });
      expect(result).toEqual({ id: 'wf-1' });
    });

    it('skips the n8n call when there is no n8nWorkflowId', async () => {
      mockPrisma.userWorkflow.findFirst.mockResolvedValue({
        id: 'wf-1',
        n8nWorkflowId: null,
      });
      mockPrisma.userWorkflow.delete.mockResolvedValue({ id: 'wf-1' });

      await service.deleteWorkflow('wf-1', 'user-1');

      expect(mockN8n.deleteWorkflow).not.toHaveBeenCalled();
      expect(mockPrisma.userWorkflow.delete).toHaveBeenCalledWith({
        where: { id: 'wf-1' },
      });
    });

    it('swallows n8n delete failures and still deletes the Prisma row', async () => {
      mockPrisma.userWorkflow.findFirst.mockResolvedValue({
        id: 'wf-1',
        n8nWorkflowId: 'n8n-wf-1',
      });
      mockN8n.deleteWorkflow.mockRejectedValue(new Error('n8n is down'));
      mockPrisma.userWorkflow.delete.mockResolvedValue({ id: 'wf-1' });

      await expect(service.deleteWorkflow('wf-1', 'user-1')).resolves.toEqual({
        id: 'wf-1',
      });

      expect(mockN8n.deleteWorkflow).toHaveBeenCalledWith('n8n-wf-1');
      expect(mockPrisma.userWorkflow.delete).toHaveBeenCalledWith({
        where: { id: 'wf-1' },
      });
    });
  });
});
