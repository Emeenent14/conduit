'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    Workflow,
    FileBox,
    Key,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
    isCollapsed: boolean;
    toggleCollapse: () => void;
}

export function Sidebar({ isCollapsed, toggleCollapse }: SidebarProps) {
    const pathname = usePathname();
    const { logout } = useAuth();

    const routes = [
        {
            label: 'Dashboard',
            icon: LayoutDashboard,
            href: '/dashboard',
        },
        {
            label: 'Workflows',
            icon: Workflow,
            href: '/workflows',
        },
        {
            label: 'Templates',
            icon: FileBox,
            href: '/templates',
        },
        {
            label: 'Credentials',
            icon: Key,
            href: '/credentials',
        },
        {
            label: 'Settings',
            icon: Settings,
            href: '/settings',
        },
    ];

    return (
        <div
            className={cn(
                "relative flex flex-col h-full bg-background border-r border-border transition-all duration-300 ease-in-out",
                isCollapsed ? "w-[72px]" : "w-72"
            )}
        >

            {/* Collapse Toggle */}
            <button
                onClick={toggleCollapse}
                className="absolute -right-3 top-8 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm hover:bg-accent transition-colors"
            >
                {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
            </button>

            <div className="flex-1 px-3 py-6">
                {/* Spacer removed (handled by pt-14 in layout) */}

                <div className="space-y-1">
                    {routes.map((route) => {
                        const isActive = pathname === route.href;

                        return (
                            <Link
                                key={route.href}
                                href={route.href}
                                title={isCollapsed ? route.label : undefined}
                                className={cn(
                                    "group relative flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                                    isCollapsed ? "justify-center" : ""
                                )}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-primary" />
                                )}

                                <route.icon
                                    className={cn(
                                        "h-5 w-5 transition-colors",
                                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                                        !isCollapsed && "mr-3"
                                    )}
                                />

                                {!isCollapsed && (
                                    <span className="truncate">{route.label}</span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>

            <div className="p-3 border-t border-border">
                <Button
                    onClick={() => logout()}
                    variant="ghost"
                    size={isCollapsed ? "icon" : "sm"}
                    className={cn(
                        "w-full justify-start text-muted-foreground hover:text-red-500 hover:bg-red-500/10",
                        isCollapsed ? "justify-center" : ""
                    )}
                >
                    <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                    {!isCollapsed && "Logout"}
                </Button>
            </div>
        </div>
    );
}
