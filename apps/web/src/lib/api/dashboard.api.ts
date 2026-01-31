import { api } from '../api-client';

export interface DashboardStats {
    totalWorkflows: number;
    activeWorkflows: number;
    totalExecutions: number;
    successRate: number;
}

export interface ActivityItem {
    id: string;
    type: 'execution' | 'workflow_created';
    title: string;
    status?: 'success' | 'error' | 'running' | 'waiting';
    timestamp: string;
    meta: any;
}

export async function getDashboardStats(): Promise<DashboardStats> {
    const { data } = await api.get('/dashboard/stats');
    return data.data;
}

export async function getRecentActivity(): Promise<ActivityItem[]> {
    const { data } = await api.get('/dashboard/activity');
    return data.data;
}
