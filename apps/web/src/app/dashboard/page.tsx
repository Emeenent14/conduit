'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useQuery } from '@tanstack/react-query';
import * as dashboardApi from '@/lib/api/dashboard.api';
import * as workflowsApi from '@/lib/api/workflows.api';
import {
  Zap, Activity, Plus, ArrowRight, Settings,
  MoreHorizontal, Play, CheckCircle2, AlertCircle, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getDashboardStats,
    enabled: !!user,
  });

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: dashboardApi.getRecentActivity,
    enabled: !!user,
    refetchInterval: 5000,
  });

  const { data: workflows, isLoading: workflowsLoading } = useQuery({
    queryKey: ['workflows-list'],
    queryFn: workflowsApi.listWorkflows,
    enabled: !!user,
  });

  if (authLoading || !user) return null;

  // Helper for status badge styles
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20';
      case 'inactive': return 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20';
      case 'error': return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      default: return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back, {user.name?.split(' ')[0]}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/templates">
            <Button variant="outline">
              Browse Templates
            </Button>
          </Link>
          <Link href="/workflows/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Workflow
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Workflows"
          value={stats?.totalWorkflows || 0}
          icon={Zap}
          loading={statsLoading}
        />
        <StatsCard
          title="Active Workflows"
          value={stats?.activeWorkflows || 0}
          icon={Activity}
          loading={statsLoading}
        />
        <StatsCard
          title="Total Executions"
          value={stats?.totalExecutions || 0}
          icon={Play}
          loading={statsLoading}
        />
        <StatsCard
          title="Success Rate"
          value={`${stats?.successRate || 0}%`}
          icon={CheckCircle2}
          loading={statsLoading}
          trend={(stats?.successRate || 0) >= 90 ? 'High' : 'Needs Attention'}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex flex-col space-y-1.5">
              <h3 className="font-semibold leading-none tracking-tight">Active Workflows</h3>
              <p className="text-sm text-muted-foreground">Your running automation pipelines.</p>
            </div>
            <Link href="/workflows" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="p-0">
            {workflowsLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading workflows...</div>
            ) : workflows && workflows.length > 0 ? (
              <div className="divide-y divide-border/50">
                {workflows.slice(0, 5).map((workflow) => (
                  <div key={workflow.id} className="p-5 flex items-center justify-between hover:bg-accent/30 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center bg-primary/5 text-primary",
                      )}>
                        <Zap className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground">{workflow.name}</h4>
                          <Badge variant="secondary" className={cn("text-[10px] h-5 px-1.5", getStatusColor(workflow.status))}>
                            {workflow.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{workflow.template?.name || 'Custom Workflow'}</span>
                          <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {workflow.statistics?.lastExecutionAt
                              ? formatDistanceToNow(new Date(workflow.statistics.lastExecutionAt), { addSuffix: true })
                              : 'No runs yet'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/workflows/${workflow.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium mb-1">No active workflows</h3>
                <p className="text-muted-foreground text-sm max-w-xs mb-6">
                  Get started by exploring our template library or creating a custom workflow.
                </p>
                <Link href="/templates">
                  <Button variant="outline">Browse Templates</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-3 rounded-xl border bg-card text-card-foreground shadow h-full">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex flex-col space-y-1.5">
              <h3 className="font-semibold leading-none tracking-tight">Recent Activity</h3>
              <p className="text-sm text-muted-foreground">Latest execution logs.</p>
            </div>
          </div>
          <div className="p-6 pt-0 h-[400px] overflow-y-auto">
            {activityLoading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Loading activity...</div>
            ) : activity && activity.length > 0 ? (
              <div className="relative pl-6 py-2">
                <div className="absolute left-[0.45rem] top-2 bottom-2 w-px bg-border/60" />
                <div className="space-y-6">
                  {activity.slice(0, 10).map((item) => (
                    <div key={item.id} className="relative">
                      <div className={cn(
                        "absolute -left-[27px] top-1 h-2.5 w-2.5 rounded-full border border-background shadow-sm",
                        item.status === 'success' ? "bg-emerald-500" :
                          item.status === 'error' ? "bg-red-500" :
                            "bg-slate-400"
                      )} />

                      <div className="flex flex-col gap-1">
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-medium text-foreground line-clamp-1 mr-2 cursor-default" title={item.title}>
                            {item.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5">
                            {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true }).replace('about ', '')}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.type === 'execution' ? (
                            item.status === 'success' ? 'Completed successfully' : 'Failed to execute'
                          ) : 'System notification'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm italic">
                No recent activity.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, loading, trend }: { title: string, value: string | number, icon: any, loading: boolean, trend?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? <div className="h-8 w-16 bg-muted animate-pulse rounded" /> : value}
        </div>
        <p className="text-xs text-muted-foreground">
          {trend ? trend : '+20.1% from last month'}
        </p>
      </CardContent>
    </Card>
  );
}
