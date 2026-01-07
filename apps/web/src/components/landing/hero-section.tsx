import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function HeroSection() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-14">
            {/* Background elements - dots pattern */}
            <div className="absolute inset-0 bg-dots" />

            {/* Glow orbs */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-sky-500/20 blur-[120px] pointer-events-none" />
            <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-500/15 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] rounded-full bg-cyan-500/10 blur-[80px] pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 mx-auto max-w-5xl px-6 py-32 text-center">
                {/* Announcement badge */}
                <Link
                    href="/changelog"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-muted-foreground hover:bg-white/10 transition-colors mb-8"
                >
                    <span className="flex h-2 w-2 rounded-full bg-sky-400" />
                    <span>Introducing Conduit v1.0</span>
                    <ArrowRight className="h-3 w-3" />
                </Link>

                {/* Main headline */}
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-balance leading-[0.95]">
                    <span className="block text-foreground">One-click automation</span>
                    <span className="block mt-2 bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
                        for everyone
                    </span>
                </h1>

                {/* Subtitle */}
                <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed text-balance">
                    Build powerful workflows without writing code. Connect your apps,
                    automate your tasks, and ship faster with curated templates powered by n8n.
                </p>

                {/* CTA buttons */}
                <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/auth/register"
                        className="group flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90 transition-all shadow-lg shadow-white/10"
                    >
                        Get started
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                    <Link
                        href="/docs"
                        className="flex items-center gap-2 rounded-full inset-ring bg-white/5 px-6 py-3 text-sm font-medium text-foreground hover:bg-white/10 transition-all"
                    >
                        Documentation
                    </Link>
                </div>

                {/* Stats/social proof */}
                <div className="mt-20 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-foreground">500+</span>
                        <span>Templates</span>
                    </div>
                    <div className="h-4 w-px bg-white/10 hidden sm:block" />
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-foreground">400+</span>
                        <span>Integrations</span>
                    </div>
                    <div className="h-4 w-px bg-white/10 hidden sm:block" />
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-foreground">10k+</span>
                        <span>Users</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
