import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const integrations = [
    { name: 'Slack', color: '#4A154B', icon: 'M6 15a2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 012-2h2v2zm1 0a2 2 0 012-2 2 2 0 012 2v5a2 2 0 01-2 2 2 2 0 01-2-2v-5zm2-8a2 2 0 01-2-2 2 2 0 012-2 2 2 0 012 2v2H9zm0 1a2 2 0 012 2 2 2 0 01-2 2H4a2 2 0 01-2-2 2 2 0 012-2h5zm8 2a2 2 0 012-2 2 2 0 012 2 2 2 0 01-2 2h-2v-2zm-1 0a2 2 0 01-2 2 2 2 0 01-2-2V5a2 2 0 012-2 2 2 0 012 2v5zm-2 8a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2v-2h2zm0-1a2 2 0 01-2-2 2 2 0 012-2h5a2 2 0 012 2 2 2 0 01-2 2h-5z' },
    { name: 'Gmail', color: '#EA4335', icon: 'M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z' },
    { name: 'Notion', color: '#000000', icon: 'M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466l1.823 1.447zm1.775 2.89l-.14 14.655c0 .373.186.513.606.466l14.49-1.68c.42-.046.467-.326.467-.7V5.378c0-.373-.14-.56-.42-.513L6.654 6.658c-.326.047-.42.233-.42.44z' },
    { name: 'GitHub', color: '#181717', icon: 'M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' },
    { name: 'Salesforce', color: '#00A1E0', icon: 'M10.006 5.415a4.195 4.195 0 013.045-1.306c1.56 0 2.954.9 3.69 2.205.63-.3 1.35-.45 2.1-.45 2.85 0 5.159 2.37 5.159 5.295s-2.31 5.295-5.16 5.295c-.39 0-.78-.045-1.155-.12-.6 1.83-2.34 3.165-4.395 3.165-1.65 0-3.09-.87-3.9-2.175a4.125 4.125 0 01-.96.12c-2.37 0-4.29-1.965-4.29-4.395 0-1.245.51-2.37 1.335-3.165a5.247 5.247 0 01-.285-1.71c0-2.79 2.205-5.055 4.92-5.055 1.41 0 2.685.6 3.6 1.56l.296-.264z' },
    { name: 'Stripe', color: '#635BFF', icon: 'M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z' },
    { name: 'Airtable', color: '#18BFFF', icon: 'M11.992 3L1 8.813v6.374L11.992 21 23 15.187V8.813L11.992 3zm8.25 5.563L12 12.938l-8.242-4.375L12 4.188l8.242 4.375zM3 9.938l8 4.25v5.625l-8-4.25V9.937zm10 9.875v-5.625l8-4.25v5.625l-8 4.25z' },
    { name: 'Discord', color: '#5865F2', icon: 'M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z' },
];

export function IntegrationsPreview() {
    return (
        <section className="relative py-32 overflow-hidden">
            {/* Top border line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-[var(--line-color)]" />

            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-sky-500/5 blur-[100px] pointer-events-none" />

            <div className="relative mx-auto max-w-7xl px-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
                    <div>
                        <p className="text-sm font-semibold text-sky-400 mb-3">Integrations</p>
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                            Connect to 400+ apps
                        </h2>
                        <p className="mt-4 text-lg text-muted-foreground max-w-xl">
                            Seamlessly integrate with your existing tools. From CRMs to databases, we've got you covered.
                        </p>
                    </div>
                    <Link
                        href="/integrations"
                        className="mt-6 md:mt-0 inline-flex items-center gap-2 text-sm font-medium text-sky-400 hover:text-sky-300 transition-colors"
                    >
                        View all integrations
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                {/* Divider line before cards */}
                <div className="h-px bg-[var(--line-color)] mb-8" />

                {/* Integration cards with dividers */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
                    {integrations.map((integration, index) => (
                        <div
                            key={integration.name}
                            className={`group relative aspect-square flex flex-col items-center justify-center gap-3 hover:bg-white/[0.03] transition-all cursor-pointer
                ${index !== 0 ? 'border-l border-[var(--line-color)]' : ''}
              `}
                        >
                            <div
                                className="h-10 w-10 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: `${integration.color}15` }}
                            >
                                <svg
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill={integration.color}
                                >
                                    <path d={integration.icon} />
                                </svg>
                            </div>
                            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                {integration.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
