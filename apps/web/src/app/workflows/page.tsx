'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as workflowApi from '@/lib/api/workflows.api';
import { WorkflowCard } from '@/components/workflows/workflow-card';
import { Plus, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function WorkflowsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth/login');
        }
    }, [user, authLoading, router]);

    // Queries
    const { data: workflows, isLoading } = useQuery({
        queryKey: ['workflows'],
        queryFn: workflowApi.listWorkflows,
        enabled: !!user,
    });

    // Mutations
    const activateMutation = useMutation({
        mutationFn: workflowApi.activateWorkflow,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
            toast({ title: 'Workflow activated' });
        },
        onError: () => {
            toast({ title: 'Failed to activate workflow', variant: 'destructive' });
        }
    });

    const deactivateMutation = useMutation({
        mutationFn: workflowApi.deactivateWorkflow,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
            toast({ title: 'Workflow deactivated' });
        },
        onError: () => {
            toast({ title: 'Failed to deactivate workflow', variant: 'destructive' });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: workflowApi.deleteWorkflow,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
            toast({ title: 'Workflow deleted' });
        },
        onError: () => {
            toast({ title: 'Failed to delete workflow', variant: 'destructive' });
        }
    });

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span>Loading workflows...</span>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="pt-24 pb-16 min-h-[80vh]">
                <div className="mx-auto max-w-7xl px-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight mb-2">My Workflows</h1>
                            <p className="text-muted-foreground">
                                Manage and monitor your automated workflows.
                            </p>
                        </div>
                        <Link href="/templates">
                            <Button className="bg-sky-500 hover:bg-sky-400 text-white rounded-full">
                                <Plus className="mr-2 h-4 w-4" />
                                New Workflow
                            </Button>
                        </Link>
                    </div>

                    {/* Filters (Visual only for now) */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search workflows..."
                                className="pl-10 bg-white/5 border-white/10"
                            />
                        </div>
                        <Button variant="outline" className="border-white/10 bg-white/5">
                            <Filter className="mr-2 h-4 w-4" />
                            Filter
                        </Button>
                    </div>

                    {/* List */}
                    {workflows && workflows.length > 0 ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {workflows.map((workflow) => (
                                <WorkflowCard
                                    key={workflow.id}
                                    workflow={workflow}
                                    onActivate={() => activateMutation.mutate(workflow.id)}
                                    onDeactivate={() => deactivateMutation.mutate(workflow.id)}
                                    onDelete={() => {
                                        if (confirm('Are you sure you want to delete this workflow?')) {
                                            deleteMutation.mutate(workflow.id);
                                        }
                                    }}
                                    isToggling={activateMutation.isPending || deactivateMutation.isPending}
                                    isDeleting={deleteMutation.isPending}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 border border-dashed border-[var(--line-color)] rounded-2xl bg-white/[0.01]">
                            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-xl bg-sky-500/10 mb-4">
                                <Plus className="h-6 w-6 text-sky-400" />
                            </div>
                            <h3 className="text-lg font-medium mb-2">No workflows yet</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                                Get started by choosing a template from our catalog used by thousands of teams.
                            </p>
                            <Link href="/templates">
                                <Button variant="outline">Browse Templates</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
