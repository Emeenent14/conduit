import { Blocks, Zap, Shield, Globe, Workflow, Clock } from 'lucide-react';

const features = [
    {
        icon: Blocks,
        title: 'Visual Workflow Builder',
        description: 'Drag and drop nodes to create complex automations. No coding required.',
    },
    {
        icon: Zap,
        title: 'Instant Templates',
        description: 'Start with 500+ curated templates. Import, customize, deploy in seconds.',
    },
    {
        icon: Globe,
        title: '400+ Integrations',
        description: 'Connect to any app. Slack, Gmail, Notion, Salesforce, and more.',
    },
    {
        icon: Workflow,
        title: 'Conditional Logic',
        description: 'Build smart workflows with if/else branches, loops, and error handling.',
    },
    {
        icon: Clock,
        title: 'Schedule & Triggers',
        description: 'Run on schedules, webhooks, or when specific events happen.',
    },
    {
        icon: Shield,
        title: 'Enterprise Security',
        description: 'SOC 2 compliant. Your data stays encrypted and secure.',
    },
];

export function FeaturesSection() {
    return (
        <section className="relative py-32">
            {/* Top border line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-[var(--line-color)]" />

            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-sky-500/5 blur-[100px] pointer-events-none" />

            <div className="relative mx-auto max-w-7xl px-6">
                {/* Section header */}
                <div className="max-w-2xl">
                    <p className="text-sm font-semibold text-sky-400 mb-3">Why Conduit?</p>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                        Everything you need to automate your workflow
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Powerful features, simple interface. Build automations that scale.
                    </p>
                </div>

                {/* Divider line before grid */}
                <div className="mt-16 h-px bg-[var(--line-color)]" />

                {/* Feature grid with visible dividers */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, index) => (
                        <div
                            key={feature.title}
                            className={`group relative p-8 hover:bg-white/[0.02] transition-colors
                ${index % 3 !== 0 ? 'lg:border-l lg:border-[var(--line-color)]' : ''}
                ${index % 2 !== 0 ? 'md:border-l md:border-[var(--line-color)] lg:border-l-0' : ''}
                ${index >= 3 ? 'border-t border-[var(--line-color)]' : ''}
                ${index === 1 || index === 2 ? 'md:border-l md:border-[var(--line-color)]' : ''}
              `}
                        >
                            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20 transition-colors">
                                <feature.icon className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
