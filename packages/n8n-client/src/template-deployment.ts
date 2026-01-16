/**
 * Conduit - Template Deployment Service
 * 
 * This service handles the core logic of deploying templates to n8n:
 * 1. Loading template JSON
 * 2. Validating credentials and config
 * 3. Replacing placeholders with actual values
 * 4. Creating/activating workflow in n8n
 */

import { N8nClient, N8nWorkflow, N8nNode } from '@conduit/n8n-client';

// ============================================
// Types
// ============================================

export interface Template {
  id: string;
  slug: string;
  name: string;
  n8nWorkflow: N8nWorkflowTemplate;
  requiredAppIds: string[];
  configFields: ConfigField[];
}

export interface N8nWorkflowTemplate {
  name: string;
  nodes: N8nNodeTemplate[];
  connections: Record<string, unknown>;
  settings?: Record<string, unknown>;
}

export interface N8nNodeTemplate extends Omit<N8nNode, 'credentials'> {
  credentials?: Record<string, string>; // Placeholder values like "{{CREDENTIAL:slack}}"
}

export interface ConfigField {
  id: string;
  type: 'text' | 'select' | 'boolean' | 'number' | 'textarea';
  label: string;
  required: boolean;
  default?: unknown;
}

export interface CredentialMapping {
  appSlug: string;
  n8nCredentialId: string;
}

export interface DeploymentInput {
  template: Template;
  workflowName: string;
  workflowId: string;
  userId: string;
  credentials: CredentialMapping[];
  configValues: Record<string, unknown>;
}

export interface DeploymentResult {
  success: boolean;
  n8nWorkflowId?: string;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

// ============================================
// Placeholder Constants
// ============================================

const PLACEHOLDER_PATTERNS = {
  CREDENTIAL: /\{\{CREDENTIAL:([a-z0-9-]+)\}\}/g,
  CONFIG: /\{\{CONFIG:([a-z0-9_]+)\}\}/g,
  WORKFLOW_NAME: /\{\{WORKFLOW_NAME\}\}/g,
  WORKFLOW_ID: /\{\{WORKFLOW_ID\}\}/g,
  USER_ID: /\{\{USER_ID\}\}/g,
};

// ============================================
// Template Deployment Service
// ============================================

export class TemplateDeploymentService {
  private n8nClient: N8nClient;

  constructor(n8nClient: N8nClient) {
    this.n8nClient = n8nClient;
  }

  /**
   * Validate that all required credentials and config values are provided
   */
  validateDeployment(input: DeploymentInput): ValidationResult {
    const errors: ValidationError[] = [];

    // Check required credentials
    for (const appId of input.template.requiredAppIds) {
      const hasCredential = input.credentials.some(c => c.appSlug === appId);
      if (!hasCredential) {
        errors.push({
          field: `credential.${appId}`,
          message: `Missing credential for ${appId}`,
        });
      }
    }

    // Check required config fields
    for (const field of input.template.configFields) {
      if (field.required) {
        const value = input.configValues[field.id];
        if (value === undefined || value === null || value === '') {
          errors.push({
            field: `config.${field.id}`,
            message: `${field.label} is required`,
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Deploy a template to n8n
   */
  async deploy(input: DeploymentInput): Promise<DeploymentResult> {
    // Validate first
    const validation = this.validateDeployment(input);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.map(e => e.message).join(', '),
      };
    }

    try {
      // Transform template into n8n workflow
      const workflow = this.transformTemplate(input);

      // Create workflow in n8n
      const { id } = await this.n8nClient.createWorkflow(workflow);

      return {
        success: true,
        n8nWorkflowId: id,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `Failed to deploy workflow: ${message}`,
      };
    }
  }

  /**
   * Activate a deployed workflow
   */
  async activate(n8nWorkflowId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.n8nClient.activateWorkflow(n8nWorkflowId);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  /**
   * Deactivate a workflow
   */
  async deactivate(n8nWorkflowId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.n8nClient.deactivateWorkflow(n8nWorkflowId);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  /**
   * Delete a workflow from n8n
   */
  async undeploy(n8nWorkflowId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.n8nClient.deleteWorkflow(n8nWorkflowId);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  /**
   * Run a test execution
   */
  async testRun(
    n8nWorkflowId: string, 
    testData?: Record<string, unknown>
  ): Promise<{ success: boolean; executionId?: string; error?: string }> {
    try {
      const execution = await this.n8nClient.executeWorkflow(n8nWorkflowId, testData);
      return {
        success: execution.status !== 'error',
        executionId: execution.id,
        error: execution.status === 'error' 
          ? execution.data?.resultData?.error?.message 
          : undefined,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  /**
   * Transform template JSON into deployable n8n workflow
   */
  private transformTemplate(input: DeploymentInput): N8nWorkflow {
    const { template, workflowName, workflowId, userId, credentials, configValues } = input;
    
    // Deep clone the template workflow
    const workflow = JSON.parse(JSON.stringify(template.n8nWorkflow)) as N8nWorkflow;

    // Replace system placeholders
    let workflowJson = JSON.stringify(workflow);
    workflowJson = workflowJson.replace(PLACEHOLDER_PATTERNS.WORKFLOW_NAME, workflowName);
    workflowJson = workflowJson.replace(PLACEHOLDER_PATTERNS.WORKFLOW_ID, workflowId);
    workflowJson = workflowJson.replace(PLACEHOLDER_PATTERNS.USER_ID, userId);

    // Replace config placeholders
    for (const [key, value] of Object.entries(configValues)) {
      const pattern = new RegExp(`\\{\\{CONFIG:${key}\\}\\}`, 'g');
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      workflowJson = workflowJson.replace(pattern, stringValue);
    }

    // Parse back to object
    const transformedWorkflow = JSON.parse(workflowJson) as N8nWorkflow;

    // Replace credential placeholders in nodes
    transformedWorkflow.nodes = transformedWorkflow.nodes.map(node => {
      if (node.credentials) {
        const newCredentials: Record<string, string> = {};
        
        for (const [credType, credValue] of Object.entries(node.credentials)) {
          // Check if it's a placeholder
          const match = credValue.match(/\{\{CREDENTIAL:([a-z0-9-]+)\}\}/);
          if (match) {
            const appSlug = match[1];
            const credMapping = credentials.find(c => c.appSlug === appSlug);
            if (credMapping) {
              newCredentials[credType] = credMapping.n8nCredentialId;
            } else {
              // Keep original if no mapping found (shouldn't happen if validated)
              newCredentials[credType] = credValue;
            }
          } else {
            newCredentials[credType] = credValue;
          }
        }
        
        node.credentials = newCredentials;
      }
      return node;
    });

    return transformedWorkflow;
  }
}

// ============================================
// Factory
// ============================================

export function createTemplateDeploymentService(n8nClient: N8nClient): TemplateDeploymentService {
  return new TemplateDeploymentService(n8nClient);
}

export default TemplateDeploymentService;
