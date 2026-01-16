import axios, { AxiosInstance, AxiosError } from 'axios';
import { config } from '../config';
import { logger } from '../lib/logger';

// ============================================
// Types
// ============================================

export interface N8nWorkflow {
  id?: string;
  name: string;
  nodes: N8nNode[];
  connections: Record<string, N8nConnection>;
  settings?: Record<string, any>;
  staticData?: any;
  tags?: string[];
  active?: boolean;
}

export interface N8nNode {
  id?: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, any>;
  credentials?: Record<string, string>;
  webhookId?: string;
}

export interface N8nConnection {
  main: Array<Array<{ node: string; type: string; index: number }>>;
}

export interface N8nCredential {
  id?: string;
  name: string;
  type: string;
  data: Record<string, any>;
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
      runData?: Record<string, any>;
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

// ============================================
// N8n API Client
// ============================================

export class N8nClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.n8n.apiUrl,
      headers: {
        'X-N8N-API-KEY': config.n8n.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`n8n API response: ${response.status}`, {
          url: response.config.url,
          method: response.config.method,
        });
        return response;
      },
      (error: AxiosError) => {
        logger.error('n8n API error', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          message: error.message,
          data: error.response?.data,
        });
        throw this.handleError(error);
      }
    );
  }

  private handleError(error: AxiosError): Error {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;
      const message = data?.message || error.message;

      if (status === 401) {
        return new Error('n8n authentication failed. Check API key.');
      }
      if (status === 404) {
        return new Error('n8n resource not found.');
      }
      if (status >= 500) {
        return new Error('n8n server error. Please try again.');
      }
      return new Error(`n8n error: ${message}`);
    }
    if (error.code === 'ECONNREFUSED') {
      return new Error('Cannot connect to n8n. Is it running?');
    }
    return new Error(`n8n request failed: ${error.message}`);
  }

  // ============================================
  // Workflow Methods
  // ============================================

  /**
   * Create a new workflow in n8n
   */
  async createWorkflow(workflow: N8nWorkflow): Promise<{ id: string }> {
    const response = await this.client.post('/workflows', workflow);
    return { id: response.data.id };
  }

  /**
   * Get a workflow by ID
   */
  async getWorkflow(id: string): Promise<N8nWorkflow> {
    const response = await this.client.get(`/workflows/${id}`);
    return response.data;
  }

  /**
   * Update an existing workflow
   */
  async updateWorkflow(id: string, workflow: Partial<N8nWorkflow>): Promise<void> {
    await this.client.put(`/workflows/${id}`, workflow);
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(id: string): Promise<void> {
    await this.client.delete(`/workflows/${id}`);
  }

  /**
   * Activate a workflow
   */
  async activateWorkflow(id: string): Promise<void> {
    await this.client.post(`/workflows/${id}/activate`);
  }

  /**
   * Deactivate a workflow
   */
  async deactivateWorkflow(id: string): Promise<void> {
    await this.client.post(`/workflows/${id}/deactivate`);
  }

  /**
   * Execute a workflow manually
   */
  async executeWorkflow(id: string, data?: Record<string, any>): Promise<N8nExecution> {
    const response = await this.client.post(`/workflows/${id}/execute`, {
      data: data || {},
    });
    return response.data;
  }

  /**
   * List all workflows
   */
  async listWorkflows(): Promise<N8nWorkflow[]> {
    const response = await this.client.get('/workflows');
    return response.data.data || [];
  }

  // ============================================
  // Credential Methods
  // ============================================

  /**
   * Create a new credential in n8n
   */
  async createCredential(credential: N8nCredential): Promise<{ id: string }> {
    const response = await this.client.post('/credentials', credential);
    return { id: response.data.id };
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
  async listCredentials(): Promise<N8nCredential[]> {
    const response = await this.client.get('/credentials');
    return response.data.data || [];
  }

  // ============================================
  // Execution Methods
  // ============================================

  /**
   * Get executions for a workflow
   */
  async getExecutions(workflowId?: string, limit = 20): Promise<N8nExecution[]> {
    const params: Record<string, any> = { limit };
    if (workflowId) {
      params.workflowId = workflowId;
    }
    const response = await this.client.get('/executions', { params });
    return response.data.data || [];
  }

  /**
   * Get a specific execution
   */
  async getExecution(id: string): Promise<N8nExecutionDetail> {
    const response = await this.client.get(`/executions/${id}`);
    return response.data;
  }

  /**
   * Delete an execution
   */
  async deleteExecution(id: string): Promise<void> {
    await this.client.delete(`/executions/${id}`);
  }

  // ============================================
  // Health Check
  // ============================================

  /**
   * Check if n8n is reachable and authenticated
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/workflows', { params: { limit: 1 } });
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const n8nClient = new N8nClient();
