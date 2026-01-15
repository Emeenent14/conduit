// ============================================
// Credentials API Client
// ============================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
 * Get authorization token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

/**
 * Create API headers with authorization
 */
function createHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * List all credentials for the current user
 */
export async function listCredentials(): Promise<Credential[]> {
  const response = await fetch(`${API_URL}/api/v1/credentials`, {
    method: 'GET',
    headers: createHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch credentials');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Get a single credential by ID
 */
export async function getCredential(id: string): Promise<Credential> {
  const response = await fetch(`${API_URL}/api/v1/credentials/${id}`, {
    method: 'GET',
    headers: createHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch credential');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Create an API key credential
 */
export async function createApiKeyCredential(input: CreateApiKeyInput): Promise<Credential> {
  const response = await fetch(`${API_URL}/api/v1/credentials`, {
    method: 'POST',
    headers: createHeaders(),
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create credential');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Delete a credential
 */
export async function deleteCredential(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/v1/credentials/${id}`, {
    method: 'DELETE',
    headers: createHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to delete credential');
  }
}

/**
 * Test a credential
 */
export async function testCredential(id: string): Promise<TestCredentialResult> {
  const response = await fetch(`${API_URL}/api/v1/credentials/${id}/test`, {
    method: 'POST',
    headers: createHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to test credential');
  }

  const data = await response.json();
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

  return `${API_URL}/api/v1/oauth/${provider}/authorize?${params.toString()}`;
}
