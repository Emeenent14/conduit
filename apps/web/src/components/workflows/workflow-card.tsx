import { Play, Pause, Trash2, Clock, CheckCircle2, XCircle, MoreVertical, ExternalLink } from 'lucide-react';
import { Workflow } from '@/lib/api/workflows.api';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface WorkflowCardProps {
    workflow: Workflow;
    onActivate: () => void;
    onDeactivate: () => void;
    onDelete: () => void;
    isToggling: boolean;
    isDeleting: boolean;
}

export function WorkflowCard({
    workflow,
    onActivate,
    onDeactivate,
    onDelete,
    isToggling,
    isDeleting,
}: WorkflowCardProps) {
    const isActive = workflow.status === 'active';

    const getStatusBadge = () => {
        if (isActive) {
            return (
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                </div>
            );
        }
        return (
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-white/5 px-2 py-1 rounded-full">
                <Pause className="h-3 w-3" />
                Inactive
            </div>
        );
    };

    const successRate = workflow.statistics?.totalExecutions
        ? Math.round((workflow.statistics.successfulExecutions / workflow.statistics.totalExecutions) * 100)
        : 0;

    return (
        <div className="group relative rounded-2xl border border-[var(--line-color)] bg-white/[0.02] p-6 hover:bg-white/[0.05] transition-all">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "h-10 w-10 flex items-center justify-center rounded-lg transition-colors",
                        isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-muted-foreground"
                    )}>
                        <Play className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg hover:text-sky-400 transition-colors">
                            <Link href={`/workflows/${workflow.id}`}>{workflow.name}</Link>
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            From template: <span className="text-foreground">{workflow.template.name}</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {getStatusBadge()}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={`/workflows/${workflow.id}`}>
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    View Details
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={isActive ? onDeactivate : onActivate}
                                disabled={isToggling}
                            >
                                {isActive ? (
                                    <>
                                        <Pause className="mr-2 h-4 w-4" />
                                        Deactivate
                                    </>
                                ) : (
                                    <>
                                        <Play className="mr-2 h-4 w-4" />
                                        Activate
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-400 focus:text-red-400" onClick={onDelete} disabled={isDeleting}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <p className="text-sm text-muted-foreground mb-6 line-clamp-2 min-h-[40px]">
                {workflow.description || "No description provided."}
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--line-color)]">
                <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Runs</p>
                    <p className="text-lg font-semibold">{workflow.statistics?.totalExecutions || 0}</p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
                    <div className="flex items-center gap-2">
                        <p className="text-lg font-semibold">{successRate}%</p>
                        {/* Simple mini bar */}
                        <div className="h-1.5 w-12 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${successRate}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Updated {formatDistanceToNow(new Date(workflow.updatedAt), { addSuffix: true })}</span>
            </div>
        </div>
    );
}
