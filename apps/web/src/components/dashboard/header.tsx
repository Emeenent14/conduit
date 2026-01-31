'use client';

import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function DashboardHeader() {
    const { user } = useAuth();

    return (
        <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <nav className="flex h-14 items-center justify-between px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-500">
                        <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-[15px] font-semibold tracking-tight text-foreground">
                        Conduit
                    </span>
                </Link>

                {/* Right side */}
                <div className="flex items-center gap-4">
                    <ThemeToggle />

                    {/* User Profile / Placeholder for now */}
                    {user && (
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-sky-500/10 flex items-center justify-center text-xs font-medium text-sky-500 border border-sky-500/20">
                                {user.name?.charAt(0) || 'U'}
                            </div>
                        </div>
                    )}
                </div>
            </nav>
        </header>
    );
}
