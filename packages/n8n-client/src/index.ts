/**
 * Conduit - n8n API Client
 * 
 * This service handles all communication with the n8n workflow engine.
 * It provides a clean interface for creating, managing, and executing workflows.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// ============================================
// Types
// ============================================

export interface N8nConfig {
  apiUrl: string;
  apiKey: string;
  timeout?: number;
}

export interface N8nWorkflow {
  id?: string;
  name: string;
  active?: boolean;
  nodes: N8nNode[];
  connections: Record<string, N8nConnection>;
  settings?: N8nWorkflowSettings;
  staticData?: Record<string, unknown>;
  tags?: string[];
}

export interface N8nNode {
  id?: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, unknown>;
  credentials?: Record<string, string>;
  webhookId?: string;
}

export interface N8nConnection {
  main: Array<Array<{
    node: string;
    type: string;
    index: number;
  }>>;
}

export interface N8nWorkflowSettings {
  executionOrder?: string;
  saveManualExecutions?: boolean;
  callerPolicy?: string;
  timezone?: string;
}

export interface N8nCredential {
  id?: string;
  name: string;
  type: string;
  data: Record<string, unknown>;
}

export interface N8nExecution {
  id: string;
  finished: boolean;
  mode: string;
  startedAt: string;
  stoppedAt?: string;
  workflowId: string;
  status: 'running' | 'success' | 'error' | 'waiting';
  data?: {
    resultData?: {
      runData?: Record<string, unknown>;
      error?: {
        message: string;
        node?: string;
      };
    };
  };
}

export interface N8nExecutionDetail extends N8nExecution {
  workflowData: N8nWorkflow;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
}

export interface N8nError {
  code: string;
  message: string;
  hint?: string;
}

// ============================================
// Client Class
// ============================================

export class N8nClient {
  private client: AxiosInstance;
  private config: N8nConfig;

  constructor(config: N8nConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: config.timeout || 30000,
      headers: {
        'X-N8N-API-KEY': config.apiKey,
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<N8nError>) => {
        const n8nError = this.parseError(error);
        throw n8nError;
      }
    );
  }

  // ============================================
  // Workflow Operations
  // ============================================

  /**
   * Create a new workflow in n8n
   */
  async createWorkflow(workflow: N8nWorkflow): Promise<{ id: string; workflow: N8nWorkflow }> {
    const response = await this.client.post<N8nWorkflow>('/workflows', workflow);
    return {
      id: response.data.id!,
      workflow: response.data,
    };
  }

  /**
   * Get a workflow by ID
   */
  async getWorkflow(id: string): Promise<N8nWorkflow> {
    const response = await this.client.get<N8nWorkflow>(`/workflows/${id}`);
    return response.data;
  }

  /**
   * Update an existing workflow
   */
  async updateWorkflow(id: string, workflow: Partial<N8nWorkflow>): Promise<N8nWorkflow> {
    const response = await this.client.put<N8nWorkflow>(`/workflows/${id}`, workflow);
    return response.data;
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(id: string): Promise<void> {
    await this.client.delete(`/workflows/${id}`);
  }

  /**
   * Activate a workflow (enable triggers)
   */
  async activateWorkflow(id: string): Promise<N8nWorkflow> {
    const response = await this.client.post<N8nWorkflow>(`/workflows/${id}/activate`);
    return response.data;
  }

  /**
   * Deactivate a workflow (disable triggers)
   */
  async deactivateWorkflow(id: string): Promise<N8nWorkflow> {
    const response = await this.client.post<N8nWorkflow>(`/workflows/${id}/deactivate`);
    return response.data;
  }

  /**
   * List all workflows
   */
  async listWorkflows(cursor?: string, limit = 100): Promise<PaginatedResponse<N8nWorkflow>> {
    const params: Record<string, unknown> = { limit };
    if (cursor) params.cursor = cursor;
    
    const response = await this.client.get<PaginatedResponse<N8nWorkflow>>('/workflows', { params });
    return response.data;
  }

  /**
   * Execute a workflow manually (for testing)
   */
  async executeWorkflow(
    id: string, 
    data?: Record<string, unknown>
  ): Promise<N8nExecution> {
    const response = await this.client.post<N8nExecution>(
      `/workflows/${id}/execute`,
      data ? { data } : undefined
    );
    return response.data;
  }

  // ============================================
  // Credential Operations
  // ============================================

  /**
   * Create a new credential in n8n
   */
  async createCredential(credential: N8nCredential): Promise<{ id: string }> {
    const response = await this.client.post<{ id: string }>('/credentials', credential);
    return { id: response.data.id };
  }

  /**
   * Get a credential by ID (data is encrypted/hidden)
   */
  async getCredential(id: string): Promise<N8nCredential> {
    const response = await this.client.get<N8nCredential>(`/credentials/${id}`);
    return response.data;
  }

  /**
   * Delete a credential
   */
  async deleteCredential(id: string): Promise<void> {
    await this.client.delete(`/credentials/${id}`);
  }

  /**
   * List all credentials
   */
  async listCredentials(cursor?: string, limit = 100): Promise<PaginatedResponse<N8nCredential>> {
    const params: Record<string, unknown> = { limit };
    if (cursor) params.cursor = cursor;

    const response = await this.client.get<PaginatedResponse<N8nCredential>>('/credentials', { params });
    return response.data;
  }

  // ============================================
  // Execution Operations
  // ============================================

  /**
   * Get execution details
   */
  async getExecution(id: string): Promise<N8nExecutionDetail> {
    const response = await this.client.get<N8nExecutionDetail>(`/executions/${id}`);
    return response.data;
  }

  /**
   * List executions for a workflow
   */
  async listExecutions(
    workflowId?: string,
    cursor?: string,
    limit = 100
  ): Promise<PaginatedResponse<N8nExecution>> {
    const params: Record<string, unknown> = { limit };
    if (workflowId) params.workflowId = workflowId;
    if (cursor) params.cursor = cursor;

    const response = await this.client.get<PaginatedResponse<N8nExecution>>('/executions', { params });
    return response.data;
  }

  /**
   * Delete an execution
   */
  async deleteExecution(id: string): Promise<void> {
    await this.client.delete(`/executions/${id}`);
  }

  // ============================================
  // Health & Utility
  // ============================================

  /**
   * Check if n8n is reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/workflows', { params: { limit: 1 } });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Parse n8n API errors into a consistent format
   */
  private parseError(error: AxiosError<N8nError>): Error {
    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || error.message;
      
      const err = new Error(`n8n API Error (${status}): ${message}`);
      (err as any).code = data?.code || `HTTP_${status}`;
      (err as any).status = status;
      (err as any).hint = data?.hint;
      
      return err;
    }
    
    if (error.code === 'ECONNREFUSED') {
      return new Error('n8n is not reachable. Please ensure n8n is running.');
    }
    
    return error;
  }
}

// ============================================
// Factory Function
// ============================================

let clientInstance: N8nClient | null = null;

export function createN8nClient(config: N8nConfig): N8nClient {
  clientInstance = new N8nClient(config);
  return clientInstance;
}

export function getN8nClient(): N8nClient {
  if (!clientInstance) {
    throw new Error('n8n client not initialized. Call createN8nClient first.');
  }
  return clientInstance;
}

// ============================================
// Exports
// ============================================

export default N8nClient;
