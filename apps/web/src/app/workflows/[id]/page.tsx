'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as workflowApi from '@/lib/api/workflows.api';
import { ArrowLeft, Play, Pause, Trash2, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ExecutionList } from '@/components/workflows/execution-list';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default function WorkflowDetailsPage({ params }: { params: { id: string } }) {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const workflowId = params.id;

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth/login');
        }
    }, [user, authLoading, router]);

    const { data: workflow, isLoading: isWorkflowLoading } = useQuery({
        queryKey: ['workflow', workflowId],
        queryFn: () => workflowApi.getWorkflow(workflowId),
        enabled: !!user && !!workflowId,
    });

    const { data: executions, isLoading: isExecutionsLoading } = useQuery({
        queryKey: ['workflow-executions', workflowId],
        queryFn: () => workflowApi.getWorkflowExecutions(workflowId),
        enabled: !!user && !!workflowId,
        refetchInterval: 5000, // Poll every 5s for live updates
    });

    const activateMutation = useMutation({
        mutationFn: (id: string) => workflowApi.activateWorkflow(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflow', workflowId] });
            toast({ title: 'Workflow activated' });
        },
        onError: () => {
            toast({ title: 'Failed to activate', variant: 'destructive' });
        }
    });

    const deactivateMutation = useMutation({
        mutationFn: (id: string) => workflowApi.deactivateWorkflow(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflow', workflowId] });
            toast({ title: 'Workflow deactivated' });
        },
        onError: () => {
            toast({ title: 'Failed to deactivate', variant: 'destructive' });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => workflowApi.deleteWorkflow(id),
        onSuccess: () => {
            router.push('/workflows');
            toast({ title: 'Workflow deleted' });
        },
        onError: () => {
            toast({ title: 'Failed to delete', variant: 'destructive' });
        }
    });

    if (authLoading || isWorkflowLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span>Loading details...</span>
                </div>
            </div>
        );
    }

    if (!workflow) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Workflow Not Found</h1>
                <Link href="/workflows" className="text-sky-400 hover:underline">Return to Workflows</Link>
            </div>
        </div>
    );

    const isActive = workflow.status === 'active';

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="pt-24 pb-16 min-h-[80vh]">
                <div className="mx-auto max-w-7xl px-6">
                    {/* Back & Header */}
                    <div className="mb-8">
                        <Link href="/workflows" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Workflows
                        </Link>

                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-3xl font-bold tracking-tight">{workflow.name}</h1>
                                    {isActive ? (
                                        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Active
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-white/5 px-2 py-1 rounded-full">
                                            <Pause className="h-3 w-3" />
                                            Inactive
                                        </span>
                                    )}
                                </div>
                                <p className="text-muted-foreground max-w-2xl">{workflow.description}</p>
                            </div>

                            <div className="flex items-center gap-3">
                                {isActive ? (
                                    <Button
                                        variant="secondary"
                                        onClick={() => deactivateMutation.mutate(workflow.id)}
                                        disabled={deactivateMutation.isPending}
                                    >
                                        <Pause className="mr-2 h-4 w-4" />
                                        Deactivate
                                    </Button>
                                ) : (
                                    <Button
                                        className="bg-emerald-500 hover:bg-emerald-400 text-white"
                                        onClick={() => activateMutation.mutate(workflow.id)}
                                        disabled={activateMutation.isPending}
                                    >
                                        <Play className="mr-2 h-4 w-4" />
                                        Activate
                                    </Button>
                                )}

                                <Link href={`/workflows/${workflow.id}/edit`}>
                                    {/* Edit not fully implemented but link is here */}
                                </Link>

                                <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => {
                                        if (confirm('Delete workflow?')) deleteMutation.mutate(workflow.id);
                                    }}
                                    disabled={deleteMutation.isPending}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-8 lg:grid-cols-3">
                        {/* Main Content: Execution History */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold">Execution History</h2>
                            </div>
                            <ExecutionList executions={executions || []} isLoading={isExecutionsLoading} />
                        </div>

                        {/* Sidebar: Stats & Config */}
                        <div className="space-y-6">
                            {/* Stats Card */}
                            <div className="rounded-xl border border-[var(--line-color)] bg-white/[0.02] p-6">
                                <h3 className="font-semibold mb-4 flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-sky-400" />
                                    Statistics
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                                        <span className="text-sm text-muted-foreground">Total Executions</span>
                                        <span className="font-medium">{workflow.statistics?.totalExecutions || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                                        <span className="text-sm text-muted-foreground">Success Rate</span>
                                        <span className={cn(
                                            "font-medium",
                                            (workflow.statistics?.successfulExecutions || 0) > 0 ? "text-emerald-400" : ""
                                        )}>
                                            {workflow.statistics?.totalExecutions
                                                ? Math.round((workflow.statistics.successfulExecutions / workflow.statistics.totalExecutions) * 100)
                                                : 0}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm text-muted-foreground">Last Run</span>
                                        <span className="text-sm">
                                            {workflow.statistics?.lastExecutionAt
                                                ? formatDistanceToNow(new Date(workflow.statistics.lastExecutionAt), { addSuffix: true })
                                                : 'Never'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Config Card */}
                            <div className="rounded-xl border border-[var(--line-color)] bg-white/[0.02] p-6">
                                <h3 className="font-semibold mb-4">Configuration</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    This workflow is created from the <strong>{workflow.template.name}</strong> template.
                                </p>

                                {/* Placeholder for config list */}
                                <div className="text-sm bg-black/20 rounded-lg p-3 font-mono text-muted-foreground">
                                    {/* We don't have detailed config value display logic yet, but we can dump generic info */}
                                    Configured
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
