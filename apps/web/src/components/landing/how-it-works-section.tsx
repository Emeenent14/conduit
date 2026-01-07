import { MousePointer, Zap, Rocket } from 'lucide-react';

const steps = [
    {
        number: '01',
        icon: MousePointer,
        title: 'Choose a template',
        description: 'Browse our library of 500+ pre-built automation templates. Filter by category, app, or use case.',
    },
    {
        number: '02',
        icon: Zap,
        title: 'Connect your apps',
        description: 'Link your favorite tools in seconds. We support 400+ integrations including Slack, Gmail, Notion, and more.',
    },
    {
        number: '03',
        icon: Rocket,
        title: 'Go live instantly',
        description: 'Activate your automation with one click. Monitor performance and iterate in real-time.',
    },
];

export function HowItWorksSection() {
    return (
        <section className="relative py-32 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent" />

            <div className="relative mx-auto max-w-7xl px-6">
                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-20">
                    <p className="text-sm font-semibold text-purple-400 mb-3">How it works</p>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                        From zero to automated in 3 steps
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        No coding. No complex setup. Just results.
                    </p>
                </div>

                {/* Steps */}
                <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
                    {steps.map((step, index) => (
                        <div key={step.number} className="relative">
                            {/* Connector line */}
                            {index < steps.length - 1 && (
                                <div className="hidden md:block absolute top-12 left-[60%] w-[calc(100%-60%+3rem)] h-px bg-gradient-to-r from-white/10 to-transparent" />
                            )}

                            <div className="relative">
                                {/* Number */}
                                <div className="text-6xl font-bold text-white/5 mb-4">{step.number}</div>

                                {/* Icon */}
                                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                                    <step.icon className="h-6 w-6" />
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
