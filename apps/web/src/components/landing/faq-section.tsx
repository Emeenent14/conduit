'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
    {
        question: 'What is Conduit?',
        answer: 'Conduit is a no-code automation platform that lets you build powerful workflows in minutes. Built on top of n8n, it provides curated templates and a simplified interface for connecting your apps and automating tasks.',
    },
    {
        question: 'Do I need coding experience?',
        answer: 'No! Conduit is designed for everyone. Our visual workflow builder and pre-built templates make it easy to create automations without writing a single line of code.',
    },
    {
        question: 'What apps can I connect?',
        answer: 'Conduit supports 400+ integrations including Slack, Gmail, Notion, Salesforce, Stripe, Airtable, Discord, GitHub, and many more. New integrations are added regularly.',
    },
    {
        question: 'Is there a free plan?',
        answer: 'Yes! Our free plan includes 500 executions per month, 5 active workflows, and access to all integrations. Perfect for individuals and small teams getting started with automation.',
    },
    {
        question: 'How is this different from n8n?',
        answer: 'Conduit is built on n8n but provides a curated, simplified experience. We offer 500+ pre-built templates, a streamlined interface, managed hosting, and dedicated support – so you can focus on automation, not infrastructure.',
    },
    {
        question: 'Is my data secure?',
        answer: 'Absolutely. We are SOC 2 compliant and use enterprise-grade encryption for all data at rest and in transit. Your credentials are stored securely and never shared with third parties.',
    },
    {
        question: 'Can I self-host Conduit?',
        answer: 'Enterprise customers can deploy Conduit on their own infrastructure. Contact our sales team for more information about self-hosted and on-premise options.',
    },
    {
        question: 'What support do you offer?',
        answer: 'Free users get access to our documentation and community forums. Pro users receive email support with 24-hour response times. Enterprise customers get dedicated support with SLAs.',
    },
];

export function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section className="relative py-32">
            <div className="mx-auto max-w-3xl px-6">
                {/* Header */}
                <div className="text-center mb-16">
                    <p className="text-sm font-semibold text-sky-400 mb-3">FAQ</p>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                        Frequently asked questions
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Everything you need to know about Conduit.
                    </p>
                </div>

                {/* FAQ items */}
                <div className="divide-y divide-white/5">
                    {faqs.map((faq, index) => (
                        <div key={index} className="py-6">
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="flex w-full items-start justify-between text-left"
                            >
                                <span className="text-base font-medium pr-8">{faq.question}</span>
                                <ChevronDown
                                    className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform ${openIndex === index ? 'rotate-180' : ''
                                        }`}
                                />
                            </button>
                            <div
                                className={`grid transition-all duration-200 ease-in-out ${openIndex === index ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'
                                    }`}
                            >
                                <div className="overflow-hidden">
                                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
