import { Injectable } from '@nestjs/common';
import axios, { AxiosError, AxiosInstance } from 'axios';
import { AppConfigService } from '../config/app-config.service';

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

/**
 * Verbatim port of services/n8n.client.ts as an injectable service.
 * Behavior (error handling, endpoints) is unchanged from the Express client.
 */
@Injectable()
export class N8nClientService {
  private readonly client: AxiosInstance;

  constructor(private readonly config: AppConfigService) {
    this.client = axios.create({
      baseURL: this.config.n8n.apiUrl,
      headers: {
        'X-N8N-API-KEY': this.config.n8n.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        throw this.handleError(error);
      },
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

  async createWorkflow(workflow: N8nWorkflow): Promise<{ id: string }> {
    const response = await this.client.post('/workflows', workflow);
    return { id: response.data.id };
  }

  async getWorkflow(id: string): Promise<N8nWorkflow> {
    const response = await this.client.get(`/workflows/${id}`);
    return response.data;
  }

  async updateWorkflow(
    id: string,
    workflow: Partial<N8nWorkflow>,
  ): Promise<void> {
    await this.client.put(`/workflows/${id}`, workflow);
  }

  async deleteWorkflow(id: string): Promise<void> {
    await this.client.delete(`/workflows/${id}`);
  }

  async activateWorkflow(id: string): Promise<void> {
    await this.client.post(`/workflows/${id}/activate`);
  }

  async deactivateWorkflow(id: string): Promise<void> {
    await this.client.post(`/workflows/${id}/deactivate`);
  }

  async executeWorkflow(
    id: string,
    data?: Record<string, any>,
  ): Promise<N8nExecution> {
    const response = await this.client.post(`/workflows/${id}/execute`, {
      data: data || {},
    });
    return response.data;
  }

  async listWorkflows(): Promise<N8nWorkflow[]> {
    const response = await this.client.get('/workflows');
    return response.data.data || [];
  }

  // ============================================
  // Credential Methods
  // ============================================

  async createCredential(credential: N8nCredential): Promise<{ id: string }> {
    const response = await this.client.post('/credentials', credential);
    return { id: response.data.id };
  }

  async deleteCredential(id: string): Promise<void> {
    await this.client.delete(`/credentials/${id}`);
  }

  async listCredentials(): Promise<N8nCredential[]> {
    const response = await this.client.get('/credentials');
    return response.data.data || [];
  }

  // ============================================
  // Execution Methods
  // ============================================

  async getExecutions(
    workflowId?: string,
    limit = 20,
  ): Promise<N8nExecution[]> {
    const params: Record<string, any> = { limit };
    if (workflowId) {
      params.workflowId = workflowId;
    }
    const response = await this.client.get('/executions', { params });
    return response.data.data || [];
  }

  async getExecution(id: string): Promise<N8nExecutionDetail> {
    const response = await this.client.get(`/executions/${id}`);
    return response.data;
  }

  async deleteExecution(id: string): Promise<void> {
    await this.client.delete(`/executions/${id}`);
  }

  // ============================================
  // Health Check
  // ============================================

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/workflows', { params: { limit: 1 } });
      return true;
    } catch {
      return false;
    }
  }
}
