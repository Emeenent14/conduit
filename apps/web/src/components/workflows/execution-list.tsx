import { Execution } from '@/lib/api/workflows.api';
import { CheckCircle2, XCircle, Clock, RotateCw, PlayCircle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ExecutionListProps {
    executions: Execution[];
    isLoading: boolean;
}

export function ExecutionList({ executions, isLoading }: ExecutionListProps) {
    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent text-muted-foreground" />
            </div>
        );
    }

    if (!executions || executions.length === 0) {
        return (
            <div className="text-center py-12 border border-dashed border-[var(--line-color)] rounded-xl bg-white/[0.01]">
                <div className="mx-auto h-10 w-10 flex items-center justify-center rounded-lg bg-white/5 mb-3 text-muted-foreground">
                    <PlayCircle className="h-5 w-5" />
                </div>
                <p className="text-muted-foreground text-sm">No executions yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Run your workflow to see history here.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-[var(--line-color)] bg-white/[0.02] overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="border-b border-[var(--line-color)] bg-white/[0.02]">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Started</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Duration</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Trigger</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line-color)]">
                        {executions.map((exec) => (
                            <tr key={exec.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        {exec.status === 'success' && (
                                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                        )}
                                        {exec.status === 'error' && (
                                            <XCircle className="h-4 w-4 text-red-400" />
                                        )}
                                        {exec.status === 'running' && (
                                            <RotateCw className="h-4 w-4 text-sky-400 animate-spin" />
                                        )}
                                        {exec.status === 'waiting' && (
                                            <Clock className="h-4 w-4 text-amber-400" />
                                        )}

                                        <span className={cn(
                                            "capitalize",
                                            exec.status === 'success' && "text-emerald-400",
                                            exec.status === 'error' && "text-red-400",
                                            exec.status === 'running' && "text-sky-400",
                                            exec.status === 'waiting' && "text-amber-400",
                                        )}>
                                            {exec.status}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                    {formatDistanceToNow(new Date(exec.startedAt), { addSuffix: true })}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {exec.durationMs ? `${(exec.durationMs / 1000).toFixed(2)}s` : '-'}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {exec.isTestRun ? 'Manual (Test)' : 'Automated'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
