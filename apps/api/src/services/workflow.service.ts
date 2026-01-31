import { prisma } from '../lib/prisma';
import { n8nClient, N8nWorkflow } from './n8n.client';
import { logger } from '../lib/logger';
import { getCredentialById } from './credentials.service';
import { WorkflowStatus } from '@prisma/client';

// ============================================
// Types
// ============================================

export interface CreateWorkflowInput {
    userId: string;
    templateId: string;
    name: string;
    description?: string;
    configValues?: Record<string, any>;
    credentialMappings: Array<{
        appSlug: string;
        credentialId: string;
    }>;
}

// ============================================
// Workflow Service
// ============================================

/**
 * List workflows for a user
 */
export async function listUserWorkflows(userId: string) {
    return prisma.userWorkflow.findMany({
        where: { userId },
        include: {
            template: {
                select: {
                    name: true,
                    slug: true,
                    // icon: true, // Template does not have icon directly
                },
            },
            statistics: true,
        },
        orderBy: { updatedAt: 'desc' },
    });
}

/**
 * Get workflow by ID
 */
export async function getWorkflowById(workflowId: string, userId: string) {
    const workflow = await prisma.userWorkflow.findFirst({
        where: { id: workflowId, userId },
        include: {
            template: true,
            credentialMappings: {
                include: {
                    credential: {
                        include: {
                            app: true,
                        },
                    },
                },
            },
            statistics: true,
            executions: {
                take: 5,
                orderBy: { startedAt: 'desc' },
            },
        },
    });

    return workflow;
}

/**
 * Create a new workflow from a template
 */
export async function createWorkflow(input: CreateWorkflowInput) {
    const { userId, templateId, name, description, configValues, credentialMappings } = input;

    // 1. Fetch Template
    const template = await prisma.template.findUnique({
        where: { id: templateId },
    });

    if (!template) {
        throw new Error('Template not found');
    }

    // 2. Prepare n8n Workflow JSON
    // We need to inject credentials and distinct execution IDs to make it unique per user
    // For now, we'll start with the base template workflow
    let n8nWorkflowData: N8nWorkflow = template.n8nWorkflow as unknown as N8nWorkflow;

    // Set the name to be unique/identifiable
    n8nWorkflowData.name = `${name} (${userId.substring(0, 8)})`;

    // 3. Map Credentials
    // We need to look through the n8n nodes and replace credential placeholders or set credential IDs
    // NOT IMPLEMENTED FULLY: This requires deep parsing of the n8n JSON.
    // For MVP, we will assume we can set "credentials" property on nodes if they match the app type.

    if (n8nWorkflowData.nodes) {
        for (const node of n8nWorkflowData.nodes) {
            // Find if this node needs a credential
            // This logic depends heavily on how the template was "sanitized".
            // Assuming the template import script left identifiable markers or we match by node type.

            // Simplified Logic: Match node type to app slug from our map
            // We'll iterate through our credential mappings and try to apply them to relevant nodes.

            for (const mapping of credentialMappings) {
                const credential = await getCredentialById(mapping.credentialId, userId);
                if (!credential) continue;

                // Helper: Check if node type matches app (this is heuristic)
                // ideally we should have a map of nodeType -> appSlug in the DB or code.
                // For now, let's assume we can match loosely or we trust n8n credential types.
                if (credential.n8nCredentialId) {
                    // In a real implementation, we need to know WHICH node requires WHICH credential.
                    // For now, we will add the credential to ANY node that matches the app type? NO, risky.
                    // Let's rely on the fact that `n8nWorkflowData.nodes` might already have credential definitions we need to update.

                    if (node.credentials) {
                        // If the node has credentials, update them.
                        // We need to know the 'credentialType' (e.g. googleOAuth2Api).
                        for (const [credType, _] of Object.entries(node.credentials)) {
                            // Check if this credential type corresponds to our app
                            // This step is tricky without the map from n8n-credential.service.ts
                            // Let's assume we can overwrite if we find a matching mapping.
                            // TODO: Hardcoded map for MVP or better logic needed.

                            // ACTUALLY: The best way is to let n8n handle it if we just provide the ID?
                            // n8n expects { "googleOAuth2Api": { "id": "123", "name": "..." } }

                            // Let's just try to inject the ID if we can match the Service.
                        }
                    }
                }
            }
        }
    }

    // REVISED STRATEGY for Credentials:
    // Since we don't have perfect mapping logic yet, we will create the DB record first,
    // then "Create" the workflow in n8n.
    // However, we need to inject the N8n Credential IDs into the nodes BEFORE sending to n8n.

    // Let's do a basic replacement passes based on the `credentialMappings`:
    // The user sends { appSlug: 'google', credentialId: '...' }
    // We look at the template's required apps.
    // We find nodes in the workflow that correspond to those apps and inject the credential ID.

    // 4. Create in n8n
    // We'll trust that the template is "good enough" for now or that the user can fix it in n8n if needed.
    // But for "One Click", we really need to do the injection.

    // NOTE: Skipping complex injection for the very first iteration to get the file scaffolding up.
    // We will assume `n8nWorkflowData` is mostly ready.

    const n8nResponse = await n8nClient.createWorkflow(n8nWorkflowData);
    const n8nWorkflowId = n8nResponse.id;

    // 5. Save to DB
    const userWorkflow = await prisma.userWorkflow.create({
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
                create: credentialMappings.map(m => ({
                    credentialId: m.credentialId,
                    appSlug: m.appSlug
                }))
            }
        },
    });

    // 6. Init statistics
    await prisma.workflowStatistics.create({
        data: {
            userWorkflowId: userWorkflow.id
        }
    });

    return userWorkflow;
}

/**
 * Activate Workflow
 */
export async function activateWorkflow(id: string, userId: string) {
    const workflow = await prisma.userWorkflow.findFirst({
        where: { id, userId },
    });

    if (!workflow || !workflow.n8nWorkflowId) {
        throw new Error('Workflow not found or not synced to n8n');
    }

    await n8nClient.activateWorkflow(workflow.n8nWorkflowId);

    return prisma.userWorkflow.update({
        where: { id },
        data: {
            status: WorkflowStatus.active,
            isActive: true,
            activatedAt: new Date()
        },
    });
}

/**
 * Deactivate Workflow
 */
export async function deactivateWorkflow(id: string, userId: string) {
    const workflow = await prisma.userWorkflow.findFirst({
        where: { id, userId },
    });

    if (!workflow || !workflow.n8nWorkflowId) {
        throw new Error('Workflow not found or not synced to n8n');
    }

    await n8nClient.deactivateWorkflow(workflow.n8nWorkflowId);

    return prisma.userWorkflow.update({
        where: { id },
        data: {
            status: WorkflowStatus.inactive,
            isActive: false,
            deactivatedAt: new Date()
        },
    });
}

/**
 * Delete Workflow
 */
export async function deleteWorkflow(id: string, userId: string) {
    const workflow = await prisma.userWorkflow.findFirst({
        where: { id, userId },
    });

    if (!workflow) {
        throw new Error('Workflow not found');
    }

    // Delete from n8n
    if (workflow.n8nWorkflowId) {
        try {
            await n8nClient.deleteWorkflow(workflow.n8nWorkflowId);
        } catch (e) {
            logger.warn(`Failed to delete workflow from n8n: ${workflow.n8nWorkflowId}`, e);
        }
    }

    return prisma.userWorkflow.delete({
        where: { id },
    });
}
