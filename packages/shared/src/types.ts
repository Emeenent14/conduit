// ============================================
// User Types
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface UserStats {
  activeWorkflows: number;
  totalWorkflows: number;
  totalCredentials: number;
  totalExecutions: number;
  successRate: number;
}

export interface UserWithStats extends User {
  stats: UserStats;
}

// ============================================
// Auth Types
// ============================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ============================================
// Template Types
// ============================================

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  templateCount: number;
}

export interface App {
  id: string;
  slug: string;
  name: string;
  description?: string;
  iconUrl?: string;
  authType: 'oauth2' | 'api_key';
}

export interface TemplateApp {
  slug: string;
  name: string;
  icon?: string;
  role: 'trigger' | 'action';
  description?: string;
}

export interface ConfigField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'boolean' | 'number';
  label: string;
  placeholder?: string;
  default?: any;
  required?: boolean;
  helpText?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    pattern?: string;
    message?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
  };
}

export interface Template {
  id: string;
  slug: string;
  name: string;
  description: string;
  longDescription?: string;
  category: Category;
  requiredApps: TemplateApp[];
  configFields: ConfigField[];
  tags: string[];
  popularity: number;
  estimatedSetupMinutes: number;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateListItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: {
    id: string;
    slug: string;
    name: string;
  };
  requiredApps: Array<{
    slug: string;
    name: string;
    icon?: string;
  }>;
  tags: string[];
  popularity: number;
  estimatedSetupMinutes: number;
}

// ============================================
// Credential Types
// ============================================

export interface Credential {
  id: string;
  provider: string;
  providerName: string;
  providerIcon?: string;
  authType: 'oauth2' | 'api_key';
  isValid: boolean;
  expiresAt?: string;
  scopes?: string[];
  createdAt: string;
}

export interface CreateApiKeyCredential {
  provider: string;
  credentials: {
    apiKey: string;
    [key: string]: string;
  };
}

// ============================================
// Workflow Types
// ============================================

export type WorkflowStatus = 'active' | 'inactive' | 'error' | 'pending';

export interface UserWorkflow {
  id: string;
  name: string;
  description?: string;
  templateId: string;
  templateName: string;
  status: WorkflowStatus;
  isActive: boolean;
  errorMessage?: string;
  lastExecutionAt?: string;
  lastExecutionStatus?: ExecutionStatus;
  executionCount: number;
  successCount: number;
  errorCount: number;
  createdAt: string;
  activatedAt?: string;
}

export interface CreateWorkflowRequest {
  templateSlug: string;
  name: string;
  description?: string;
  credentials: Record<string, string>; // appSlug -> credentialId
  config: Record<string, any>; // fieldId -> value
}

// ============================================
// Execution Types
// ============================================

export type ExecutionStatus = 'running' | 'success' | 'error' | 'waiting' | 'cancelled';

export interface Execution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: ExecutionStatus;
  startedAt: string;
  finishedAt?: string;
  duration?: number; // milliseconds
  isTestRun: boolean;
}

export interface ExecutionDetail extends Execution {
  inputData?: Record<string, any>;
  outputData?: Record<string, any>;
  errorMessage?: string;
  errorNode?: string;
  steps: ExecutionStep[];
}

export interface ExecutionStep {
  name: string;
  status: 'success' | 'error' | 'skipped';
  duration?: number;
  output?: any;
  error?: string;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// ============================================
// Filter & Pagination Types
// ============================================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface TemplateFilters extends PaginationParams {
  category?: string;
  apps?: string; // comma-separated
  q?: string; // search query
  sort?: 'popularity' | 'newest' | 'name';
}

export interface ExecutionFilters extends PaginationParams {
  workflowId?: string;
  status?: ExecutionStatus;
  from?: string; // ISO date
  to?: string; // ISO date
}
