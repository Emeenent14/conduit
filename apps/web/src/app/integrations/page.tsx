'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ArrowRight } from 'lucide-react';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';

const categories = ['All', 'Communication', 'CRM', 'Database', 'Developer', 'Marketing', 'Productivity', 'AI'];

const integrations = [
    // Communication
    { name: 'Slack', category: 'Communication', description: 'Send messages, create channels, and manage notifications.', color: '#4A154B', popular: true },
    { name: 'Discord', category: 'Communication', description: 'Manage servers, send messages, and handle webhooks.', color: '#5865F2', popular: true },
    { name: 'Microsoft Teams', category: 'Communication', description: 'Post messages and manage team channels.', color: '#6264A7', popular: false },
    { name: 'Twilio', category: 'Communication', description: 'Send SMS, make calls, and verify users.', color: '#F22F46', popular: false },
    // CRM
    { name: 'Salesforce', category: 'CRM', description: 'Sync contacts, deals, and automate sales workflows.', color: '#00A1E0', popular: true },
    { name: 'HubSpot', category: 'CRM', description: 'Manage contacts, companies, and deals.', color: '#FF7A59', popular: true },
    { name: 'Pipedrive', category: 'CRM', description: 'Track deals, contacts, and sales activities.', color: '#1C1C1C', popular: false },
    { name: 'Zoho CRM', category: 'CRM', description: 'Automate your sales and customer management.', color: '#DC2626', popular: false },
    // Database
    { name: 'Airtable', category: 'Database', description: 'Create, read, update records in your bases.', color: '#18BFFF', popular: true },
    { name: 'Notion', category: 'Database', description: 'Sync pages, databases, and content.', color: '#000000', popular: true },
    { name: 'PostgreSQL', category: 'Database', description: 'Execute queries and manage your database.', color: '#336791', popular: false },
    { name: 'MongoDB', category: 'Database', description: 'CRUD operations on your collections.', color: '#47A248', popular: false },
    // Developer
    { name: 'GitHub', category: 'Developer', description: 'Manage repos, issues, PRs, and actions.', color: '#181717', popular: true },
    { name: 'GitLab', category: 'Developer', description: 'Automate CI/CD, issues, and merge requests.', color: '#FC6D26', popular: false },
    { name: 'Jira', category: 'Developer', description: 'Create issues, update sprints, and track progress.', color: '#0052CC', popular: true },
    { name: 'Linear', category: 'Developer', description: 'Manage issues, projects, and cycles.', color: '#5E6AD2', popular: false },
    // Marketing
    { name: 'Mailchimp', category: 'Marketing', description: 'Manage campaigns, subscribers, and analytics.', color: '#FFE01B', popular: true },
    { name: 'SendGrid', category: 'Marketing', description: 'Send transactional and marketing emails.', color: '#1A82E2', popular: false },
    { name: 'Stripe', category: 'Marketing', description: 'Process payments, manage subscriptions.', color: '#635BFF', popular: true },
    { name: 'Shopify', category: 'Marketing', description: 'Sync products, orders, and customers.', color: '#7AB55C', popular: false },
    // Productivity
    { name: 'Gmail', category: 'Productivity', description: 'Send emails, manage labels, and search.', color: '#EA4335', popular: true },
    { name: 'Google Sheets', category: 'Productivity', description: 'Read, write, and update spreadsheets.', color: '#34A853', popular: true },
    { name: 'Google Calendar', category: 'Productivity', description: 'Create events and manage calendars.', color: '#4285F4', popular: false },
    { name: 'Trello', category: 'Productivity', description: 'Manage boards, lists, and cards.', color: '#0079BF', popular: false },
    // AI
    { name: 'OpenAI', category: 'AI', description: 'GPT-4, DALL-E, and Whisper integrations.', color: '#412991', popular: true },
    { name: 'Anthropic', category: 'AI', description: 'Claude models for analysis and generation.', color: '#D4A574', popular: true },
    { name: 'Replicate', category: 'AI', description: 'Run ML models with simple API calls.', color: '#000000', popular: false },
    { name: 'Pinecone', category: 'AI', description: 'Vector database for AI applications.', color: '#000000', popular: false },
];

export default function IntegrationsPage() {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const filtered = integrations.filter((i) => {
        const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) ||
            i.description.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = activeCategory === 'All' || i.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="pt-14">
                {/* Hero */}
                <section className="py-24">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="max-w-2xl">
                            <p className="text-sm font-semibold text-sky-400 mb-3">Integrations</p>
                            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                                Connect to 400+ apps
                            </h1>
                            <p className="mt-6 text-lg text-muted-foreground">
                                Seamlessly integrate with your existing tools. From CRMs to AI models, we've got you covered.
                            </p>
                        </div>

                        {/* Search */}
                        <div className="mt-12 relative max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search integrations..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-full border border-white/10 bg-white/5 pl-12 pr-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50"
                            />
                        </div>
                    </div>
                </section>

                {/* Categories & Grid */}
                <section className="pb-24">
                    <div className="mx-auto max-w-7xl px-6">
                        {/* Category tabs */}
                        <div className="flex flex-wrap gap-2 mb-12">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-4 py-2 text-sm rounded-full transition-colors ${activeCategory === cat
                                            ? 'bg-sky-500 text-white'
                                            : 'bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Grid */}
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {filtered.map((integration) => (
                                <Link
                                    key={integration.name}
                                    href={`/integrations/${integration.name.toLowerCase().replace(/\s+/g, '-')}`}
                                    className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:bg-white/[0.05] hover:border-white/10 transition-all"
                                >
                                    {integration.popular && (
                                        <span className="absolute top-4 right-4 text-[10px] font-medium text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">
                                            Popular
                                        </span>
                                    )}
                                    <div
                                        className="h-12 w-12 rounded-xl flex items-center justify-center mb-4"
                                        style={{ backgroundColor: `${integration.color}20` }}
                                    >
                                        <span className="text-lg font-bold" style={{ color: integration.color }}>
                                            {integration.name[0]}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold mb-2 group-hover:text-sky-400 transition-colors">
                                        {integration.name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {integration.description}
                                    </p>
                                    <ArrowRight className="absolute bottom-6 right-6 h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Link>
                            ))}
                        </div>

                        {filtered.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">No integrations found matching your criteria.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* CTA */}
                <section className="py-24 border-t border-white/5 text-center">
                    <div className="mx-auto max-w-xl px-6">
                        <h2 className="text-2xl font-bold mb-4">Don't see what you need?</h2>
                        <p className="text-muted-foreground mb-8">
                            We're constantly adding new integrations. Let us know what you'd like to see.
                        </p>
                        <Link
                            href="/contact"
                            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90 transition-colors"
                        >
                            Request integration
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
