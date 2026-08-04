import { Injectable, Logger } from '@nestjs/common';
import { WorkflowStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { N8nClientService, N8nWorkflow } from '../n8n/n8n-client.service';
import { CredentialsService } from '../credentials/credentials.service';

export interface CreateWorkflowInput {
  userId: string;
  templateId: string;
  name: string;
  description?: string;
  configValues?: Record<string, any>;
  credentialMappings: Array<{ appSlug: string; credentialId: string }>;
}

/**
 * Port of services/workflow.service.ts, including its as-is credential
 * injection logic (marked TODO/NOT IMPLEMENTED FULLY in the original --
 * carried over unchanged rather than "fixed" during the framework port).
 */
@Injectable()
export class WorkflowsService {
  private readonly logger = new Logger(WorkflowsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly n8nClient: N8nClientService,
    private readonly credentialsService: CredentialsService,
  ) {}

  async listUserWorkflows(userId: string) {
    return this.prisma.userWorkflow.findMany({
      where: { userId },
      include: {
        template: { select: { name: true, slug: true } },
        statistics: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getWorkflowById(workflowId: string, userId: string) {
    return this.prisma.userWorkflow.findFirst({
      where: { id: workflowId, userId },
      include: {
        template: true,
        credentialMappings: {
          include: { credential: { include: { app: true } } },
        },
        statistics: true,
        executions: { take: 5, orderBy: { startedAt: 'desc' } },
      },
    });
  }

  async createWorkflow(input: CreateWorkflowInput) {
    const {
      userId,
      templateId,
      name,
      description,
      configValues,
      credentialMappings,
    } = input;

    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
    });
    if (!template) {
      throw new Error('Template not found');
    }

    const n8nWorkflowData: N8nWorkflow =
      template.n8nWorkflow as unknown as N8nWorkflow;
    n8nWorkflowData.name = `${name} (${userId.substring(0, 8)})`;

    // Credential injection: heuristic/incomplete in the source Express
    // service too -- see services/workflow.service.ts for the same caveat.
    if (n8nWorkflowData.nodes) {
      for (const node of n8nWorkflowData.nodes) {
        for (const mapping of credentialMappings) {
          const credential = await this.credentialsService.getCredentialById(
            mapping.credentialId,
            userId,
          );
          if (!credential) continue;

          if (credential.n8nCredentialId && node.credentials) {
            for (const [_credType] of Object.entries(node.credentials)) {
              // Matching a node's credential type to our app mapping needs a
              // richer map than exists today; left as-is pending that work.
            }
          }
        }
      }
    }

    const n8nResponse = await this.n8nClient.createWorkflow(n8nWorkflowData);
    const n8nWorkflowId = n8nResponse.id;

    const userWorkflow = await this.prisma.userWorkflow.create({
      data: {
        userId,
        templateId,
        name,
        description,
        configValues: configValues || {},
        n8nWorkflowId,
        n8nWorkflowData: n8nWorkflowData as any,
        status: WorkflowStatus.inactive,
        credentialMappings: {
          create: credentialMappings.map((m) => ({
            credentialId: m.credentialId,
            appSlug: m.appSlug,
          })),
        },
      },
    });

    await this.prisma.workflowStatistics.create({
      data: { userWorkflowId: userWorkflow.id },
    });

    return userWorkflow;
  }

  async activateWorkflow(id: string, userId: string) {
    const workflow = await this.prisma.userWorkflow.findFirst({
      where: { id, userId },
    });

    if (!workflow || !workflow.n8nWorkflowId) {
      throw new Error('Workflow not found or not synced to n8n');
    }

    await this.n8nClient.activateWorkflow(workflow.n8nWorkflowId);

    return this.prisma.userWorkflow.update({
      where: { id },
      data: {
        status: WorkflowStatus.active,
        isActive: true,
        activatedAt: new Date(),
      },
    });
  }

  async deactivateWorkflow(id: string, userId: string) {
    const workflow = await this.prisma.userWorkflow.findFirst({
      where: { id, userId },
    });

    if (!workflow || !workflow.n8nWorkflowId) {
      throw new Error('Workflow not found or not synced to n8n');
    }

    await this.n8nClient.deactivateWorkflow(workflow.n8nWorkflowId);

    return this.prisma.userWorkflow.update({
      where: { id },
      data: {
        status: WorkflowStatus.inactive,
        isActive: false,
        deactivatedAt: new Date(),
      },
    });
  }

  async deleteWorkflow(id: string, userId: string) {
    const workflow = await this.prisma.userWorkflow.findFirst({
      where: { id, userId },
    });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    if (workflow.n8nWorkflowId) {
      try {
        await this.n8nClient.deleteWorkflow(workflow.n8nWorkflowId);
      } catch (e) {
        this.logger.warn(
          `Failed to delete workflow from n8n: ${workflow.n8nWorkflowId} - ${e}`,
        );
      }
    }

    return this.prisma.userWorkflow.delete({ where: { id } });
  }
}
