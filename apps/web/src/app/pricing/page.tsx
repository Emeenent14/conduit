import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';

const plans = [
    {
        name: 'Free',
        description: 'Perfect for getting started with automation.',
        price: '$0',
        period: 'forever',
        highlight: false,
        features: [
            { name: '500 executions/month', included: true },
            { name: '5 active workflows', included: true },
            { name: 'All 400+ integrations', included: true },
            { name: 'Community templates', included: true },
            { name: 'Email support', included: false },
            { name: 'Custom branding', included: false },
            { name: 'Team collaboration', included: false },
            { name: 'Priority execution', included: false },
        ],
        cta: 'Get started free',
        href: '/auth/register',
    },
    {
        name: 'Pro',
        description: 'For growing teams and power users.',
        price: '$29',
        period: 'per month',
        highlight: true,
        features: [
            { name: '10,000 executions/month', included: true },
            { name: 'Unlimited workflows', included: true },
            { name: 'All 400+ integrations', included: true },
            { name: 'All templates', included: true },
            { name: 'Email support (24h)', included: true },
            { name: 'Custom branding', included: true },
            { name: 'Team collaboration (5 seats)', included: true },
            { name: 'Priority execution', included: false },
        ],
        cta: 'Start free trial',
        href: '/auth/register?plan=pro',
    },
    {
        name: 'Enterprise',
        description: 'For organizations with advanced needs.',
        price: 'Custom',
        period: 'per month',
        highlight: false,
        features: [
            { name: 'Unlimited executions', included: true },
            { name: 'Unlimited workflows', included: true },
            { name: 'All 400+ integrations', included: true },
            { name: 'All templates + custom', included: true },
            { name: 'Dedicated support + SLA', included: true },
            { name: 'Custom branding', included: true },
            { name: 'Unlimited team seats', included: true },
            { name: 'Priority execution', included: true },
        ],
        cta: 'Contact sales',
        href: '/contact',
    },
];

const faqs = [
    {
        q: 'Can I change plans anytime?',
        a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.',
    },
    {
        q: 'What counts as an execution?',
        a: 'Each time a workflow runs, it counts as one execution. Multi-step workflows still count as a single execution.',
    },
    {
        q: 'Is there a free trial for Pro?',
        a: 'Yes, Pro comes with a 14-day free trial. No credit card required to start.',
    },
    {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit cards, PayPal, and wire transfers for Enterprise plans.',
    },
];

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="pt-14">
                {/* Hero */}
                <section className="py-24 text-center">
                    <div className="mx-auto max-w-3xl px-6">
                        <p className="text-sm font-semibold text-sky-400 mb-3">Pricing</p>
                        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                            Simple, transparent pricing
                        </h1>
                        <p className="mt-6 text-lg text-muted-foreground">
                            Start for free, upgrade when you need more. No hidden fees, no surprises.
                        </p>
                    </div>
                </section>

                {/* Pricing cards */}
                <section className="pb-24">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="grid md:grid-cols-3 gap-8">
                            {plans.map((plan) => (
                                <div
                                    key={plan.name}
                                    className={`relative rounded-2xl border p-8 ${plan.highlight
                                            ? 'border-sky-500/50 bg-sky-500/5'
                                            : 'border-white/10 bg-white/[0.02]'
                                        }`}
                                >
                                    {plan.highlight && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sky-500 px-3 py-1 text-xs font-semibold text-white">
                                            Most popular
                                        </div>
                                    )}

                                    <div className="mb-6">
                                        <h3 className="text-xl font-semibold">{plan.name}</h3>
                                        <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                                    </div>

                                    <div className="mb-6">
                                        <span className="text-4xl font-bold">{plan.price}</span>
                                        <span className="text-muted-foreground ml-2">/{plan.period}</span>
                                    </div>

                                    <Link
                                        href={plan.href}
                                        className={`block w-full rounded-full py-3 text-center text-sm font-semibold transition-colors ${plan.highlight
                                                ? 'bg-sky-500 text-white hover:bg-sky-600'
                                                : 'bg-white/10 text-foreground hover:bg-white/15'
                                            }`}
                                    >
                                        {plan.cta}
                                    </Link>

                                    <ul className="mt-8 space-y-4">
                                        {plan.features.map((feature) => (
                                            <li key={feature.name} className="flex items-center gap-3 text-sm">
                                                {feature.included ? (
                                                    <Check className="h-4 w-4 text-sky-400" />
                                                ) : (
                                                    <X className="h-4 w-4 text-muted-foreground/50" />
                                                )}
                                                <span className={feature.included ? '' : 'text-muted-foreground/50'}>
                                                    {feature.name}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="py-24 border-t border-white/5">
                    <div className="mx-auto max-w-3xl px-6">
                        <h2 className="text-2xl font-bold text-center mb-12">Pricing FAQ</h2>
                        <div className="grid gap-8 md:grid-cols-2">
                            {faqs.map((faq) => (
                                <div key={faq.q}>
                                    <h3 className="font-semibold mb-2">{faq.q}</h3>
                                    <p className="text-sm text-muted-foreground">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
