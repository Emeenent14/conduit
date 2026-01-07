'use client';

import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Zap } from 'lucide-react';

export function Header() {
    return (
        <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-background/70 backdrop-blur-xl">
            <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-500">
                        <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-[15px] font-semibold tracking-tight text-foreground">
                        Conduit
                    </span>
                    <span className="ml-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-400">
                        v1.0
                    </span>
                </Link>

                {/* Center nav */}
                <div className="hidden md:flex items-center gap-1">
                    {['Docs', 'Templates', 'Credentials', 'Integrations', 'Pricing'].map((item) => (
                        <Link
                            key={item}
                            href={`/${item.toLowerCase()}`}
                            className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-white/5"
                        >
                            {item}
                        </Link>
                    ))}
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3">
                    <ThemeToggle />

                    {/* Search button */}
                    <button className="hidden md:flex items-center gap-2 rounded-full inset-ring bg-white/5 px-3.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span>Search</span>
                        <kbd className="ml-2 rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/70">
                            ⌘K
                        </kbd>
                    </button>

                    {/* Get Started */}
                    <Link
                        href="/auth/register"
                        className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-black hover:bg-white/90 transition-colors dark:bg-white dark:text-black"
                    >
                        Get started
                    </Link>

                    {/* GitHub */}
                    <Link
                        href="https://github.com"
                        target="_blank"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                    </Link>
                </div>
            </nav>
        </header>
    );
}
