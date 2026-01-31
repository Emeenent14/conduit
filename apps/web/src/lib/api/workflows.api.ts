import { api } from '../api-client';

export interface Workflow {
    id: string;
    userId: string;
    templateId: string;
    name: string;
    description?: string;
    status: 'active' | 'inactive' | 'error' | 'pending';
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    template: {
        name: string;
        slug: string;
    };
    statistics?: {
        totalExecutions: number;
        successfulExecutions: number;
        failedExecutions: number;
        lastExecutionAt?: string;
    };
}

export interface CreateWorkflowInput {
    templateId: string;
    name: string;
    description?: string;
    configValues?: Record<string, any>;
    credentialMappings: Array<{
        appSlug: string;
        credentialId: string;
    }>;
}

export async function listWorkflows(): Promise<Workflow[]> {
    const { data } = await api.get('/workflows');
    return data.data;
}

export async function getWorkflow(id: string): Promise<Workflow> {
    const { data } = await api.get(`/workflows/${id}`);
    return data.data;
}

export async function createWorkflow(input: CreateWorkflowInput): Promise<Workflow> {
    const { data } = await api.post('/workflows', input);
    return data.data;
}

export async function deleteWorkflow(id: string): Promise<void> {
    await api.delete(`/workflows/${id}`);
}

export async function activateWorkflow(id: string): Promise<Workflow> {
    const { data } = await api.post(`/workflows/${id}/activate`);
    return data.data;
}

export async function deactivateWorkflow(id: string): Promise<Workflow> {
    const { data } = await api.post(`/workflows/${id}/deactivate`);
    return data.data;
}

export interface Execution {
    id: string;
    n8nExecutionId?: string;
    status: 'running' | 'success' | 'error' | 'waiting';
    startedAt: string;
    finishedAt?: string;
    durationMs: number;
    isTestRun: boolean;
    errorMessage?: string;
}

export async function getWorkflowExecutions(id: string): Promise<Execution[]> {
    const { data } = await api.get(`/workflows/${id}/executions`);
    return data.data;
}
