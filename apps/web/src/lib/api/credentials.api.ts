import { api } from '../api-client';

export interface Credential {
  id: string;
  userId: string;
  app: {
    id: string;
    slug: string;
    name: string;
    iconUrl: string | null;
    authType: 'oauth2' | 'api_key';
  };
  isValid: boolean;
  lastValidatedAt: string | null;
  validationError: string | null;
  createdAt: string;
  updatedAt: string;
  oauthExpiresAt?: string | null;
  oauthScopes?: string[];
}

export interface CreateApiKeyInput {
  appSlug: string;
  apiKey: string;
  name?: string;
}

export interface TestCredentialResult {
  isValid: boolean;
  message?: string;
  details?: any;
}

/**
 * List all credentials for the current user
 */
export async function listCredentials(): Promise<Credential[]> {
  const { data } = await api.get('/credentials');
  return data.data;
}

/**
 * Get a single credential by ID
 */
export async function getCredential(id: string): Promise<Credential> {
  const { data } = await api.get(`/credentials/${id}`);
  return data.data;
}

/**
 * Create an API key credential
 */
export async function createApiKeyCredential(input: CreateApiKeyInput): Promise<Credential> {
  const { data } = await api.post('/credentials', input);
  return data.data;
}

/**
 * Delete a credential
 */
export async function deleteCredential(id: string): Promise<void> {
  await api.delete(`/credentials/${id}`);
}

/**
 * Test a credential
 */
export async function testCredential(id: string): Promise<TestCredentialResult> {
  const { data } = await api.post(`/credentials/${id}/test`);
  return data.data;
}

/**
 * Get OAuth authorization URL
 */
export function getOAuthUrl(provider: 'google' | 'slack', returnUrl?: string): string {
  const params = new URLSearchParams();
  if (returnUrl) {
    params.append('returnUrl', returnUrl);
  }
  // This helper might still need to specific about base URL if it returns a string for the browser to navigate to
  // But usually api client baseURL includes /api/v1 now.
  // We can get baseURL from api.defaults.baseURL
  return `${api.defaults.baseURL}/oauth/${provider}/authorize?${params.toString()}`;
}
