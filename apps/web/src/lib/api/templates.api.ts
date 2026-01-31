import { api } from '../api-client';

export interface App {
    slug: string;
    name: string;
    icon: string;
}

export interface Category {
    id: string;
    slug: string;
    name: string;
}

export interface Template {
    id: string;
    slug: string;
    name: string;
    description: string;
    tags: string[];
    popularity: number;
    estimatedSetupMinutes: number;
    category: Category;
    requiredApps: App[];
}

export interface TemplatesResponse {
    success: boolean;
    data: Template[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface ListTemplatesParams {
    page?: number;
    limit?: number;
    category?: string;
    q?: string;
}

export async function listTemplates(params: ListTemplatesParams = {}): Promise<TemplatesResponse> {
    const { page = 1, limit = 100, category, q } = params;

    const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });

    if (category && category !== 'All') {
        const categoryMap: Record<string, string> = {
            'Productivity': 'productivity',
            'Operations': 'operations',
            'Sales': 'sales',
            'Marketing': 'marketing',
            'Customer Support': 'support',
            'Lead Management': 'lead-management',
        };
        const categorySlug = categoryMap[category] || category.toLowerCase();
        if (categorySlug) {
            queryParams.append('category', categorySlug);
        }
    }

    if (q) {
        queryParams.append('q', q);
    }

    const { data } = await api.get(`/templates?${queryParams.toString()}`);
    return data; // API returns the full response object matching TemplatesResponse interface structure?
    // Actually api-client axios returns { data: ... }
    // Backend usually returns { success: true, data: [...], meta: ... }
    // So data.data is the array? No, looking at TemplatesResponse, it wraps data & meta.
    // Let's verify standard response format.
    // In previous files (credentials): return data.data; 
    // That implies axios data = { success: true, data: [credential], ... }
    // Here TemplatesResponse corresponds to the AXIOS BODY directly (excluding axios wrapper).
    // So we should return `data`.
}

export async function getTemplate(slug: string): Promise<Template> {
    const { data } = await api.get(`/templates/${slug}`);
    return data.data;
}
