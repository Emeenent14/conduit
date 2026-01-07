import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
    return (
        <section className="relative py-32 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-t from-sky-500/10 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] rounded-full bg-sky-500/10 blur-[120px] pointer-events-none" />
            </div>

            <div className="relative mx-auto max-w-3xl px-6 text-center">
                <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
                    Ready to automate?
                </h2>
                <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
                    Join thousands of teams building smarter workflows. Start for free, no credit card required.
                </p>

                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/auth/register"
                        className="group flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-black hover:bg-white/90 transition-all shadow-lg shadow-white/10"
                    >
                        Get started for free
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                    <Link
                        href="/contact"
                        className="flex items-center gap-2 rounded-full inset-ring bg-white/5 px-8 py-4 text-base font-medium text-foreground hover:bg-white/10 transition-all"
                    >
                        Contact sales
                    </Link>
                </div>
            </div>
        </section>
    );
}
