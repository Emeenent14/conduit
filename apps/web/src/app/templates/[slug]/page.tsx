'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Clock, Zap, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';

interface App {
  slug: string;
  name: string;
  icon: string;
  authType?: string;
}

interface Category {
  id: string;
  slug: string;
  name: string;
}

interface Template {
  id: string;
  slug: string;
  name: string;
  description: string;
  longDescription?: string;
  tags: string[];
  popularity: number;
  estimatedSetupMinutes: number;
  category: Category;
  requiredApps: App[];
  n8nWorkflow?: any;
}

interface TemplateResponse {
  success: boolean;
  data: Template;
}

// Demo templates data (same as in templates page)
const demoTemplates: Template[] = [
  {
    id: '1',
    slug: 'slack-gmail-notification',
    name: 'Slack to Gmail Notifications',
    description: 'Forward important Slack messages to your inbox automatically.',
    longDescription: 'This template monitors specific Slack channels for important messages and automatically forwards them to your Gmail inbox. Perfect for staying on top of critical updates even when you\'re not actively checking Slack.',
    tags: ['notifications', 'email', 'productivity'],
    popularity: 95,
    estimatedSetupMinutes: 5,
    category: { id: '1', slug: 'productivity', name: 'Productivity' },
    requiredApps: [
      { slug: 'slack', name: 'Slack', icon: '', authType: 'oauth2' },
      { slug: 'gmail', name: 'Gmail', icon: '', authType: 'oauth2' },
    ],
    steps: ['Connect your Slack workspace', 'Select channels to monitor', 'Configure email settings', 'Set notification rules', 'Activate workflow'],
  },
  {
    id: '2',
    slug: 'github-discord-alerts',
    name: 'GitHub to Discord Alerts',
    description: 'Get instant Discord notifications for GitHub events like PRs and issues.',
    longDescription: 'Keep your development team in sync with real-time Discord notifications for GitHub activity. Get alerts for new pull requests, issues, comments, and more directly in your Discord server.',
    tags: ['developer', 'notifications', 'github'],
    popularity: 88,
    estimatedSetupMinutes: 3,
    category: { id: '2', slug: 'developer', name: 'Developer Tools' },
    requiredApps: [
      { slug: 'github', name: 'GitHub', icon: '', authType: 'oauth2' },
      { slug: 'discord', name: 'Discord', icon: '', authType: 'webhook' },
    ],
    steps: ['Connect GitHub account', 'Select repositories', 'Configure Discord webhook', 'Choose event types', 'Go live'],
  },
  {
    id: '3',
    slug: 'airtable-notion-sync',
    name: 'Airtable to Notion Sync',
    description: 'Keep your Airtable bases and Notion databases in perfect sync.',
    longDescription: 'Automatically sync records between Airtable and Notion databases. When a record is created or updated in Airtable, the corresponding Notion page is updated in real-time.',
    tags: ['database', 'sync', 'productivity'],
    popularity: 82,
    estimatedSetupMinutes: 10,
    category: { id: '1', slug: 'productivity', name: 'Productivity' },
    requiredApps: [
      { slug: 'airtable', name: 'Airtable', icon: '', authType: 'apikey' },
      { slug: 'notion', name: 'Notion', icon: '', authType: 'oauth2' },
    ],
    steps: ['Connect Airtable account', 'Select base and table', 'Connect Notion workspace', 'Map fields', 'Configure sync direction', 'Activate'],
  },
  {
    id: '4',
    slug: 'stripe-slack-payments',
    name: 'Stripe Payment Alerts',
    description: 'Get Slack notifications for every successful Stripe payment.',
    longDescription: 'Celebrate every sale! Get instant Slack notifications when customers make payments through Stripe. Perfect for keeping your team motivated and informed about revenue in real-time.',
    tags: ['payments', 'notifications', 'sales'],
    popularity: 91,
    estimatedSetupMinutes: 5,
    category: { id: '3', slug: 'sales', name: 'Sales & CRM' },
    requiredApps: [
      { slug: 'stripe', name: 'Stripe', icon: '', authType: 'apikey' },
      { slug: 'slack', name: 'Slack', icon: '', authType: 'oauth2' },
    ],
    steps: ['Connect Stripe account', 'Connect Slack workspace', 'Choose notification channel', 'Customize message format', 'Activate'],
  },
  {
    id: '5',
    slug: 'hubspot-email-sequence',
    name: 'HubSpot Email Sequences',
    description: 'Automatically add new contacts to email nurture sequences.',
    longDescription: 'Streamline your sales process by automatically enrolling new HubSpot contacts into email nurture sequences based on their properties and behavior.',
    tags: ['crm', 'marketing', 'automation'],
    popularity: 79,
    estimatedSetupMinutes: 15,
    category: { id: '4', slug: 'marketing', name: 'Marketing' },
    requiredApps: [
      { slug: 'hubspot', name: 'HubSpot', icon: '', authType: 'oauth2' },
      { slug: 'gmail', name: 'Gmail', icon: '', authType: 'oauth2' },
    ],
    steps: ['Connect HubSpot', 'Define contact filters', 'Create email sequence', 'Set timing rules', 'Test and activate'],
  },
  {
    id: '6',
    slug: 'openai-content-generator',
    name: 'AI Content Generator',
    description: 'Generate blog posts, social media content, and more with GPT-4.',
    longDescription: 'Leverage the power of GPT-4 to automatically generate high-quality content. Create blog posts, social media updates, product descriptions, and more with AI assistance.',
    tags: ['ai', 'content', 'marketing'],
    popularity: 96,
    estimatedSetupMinutes: 8,
    category: { id: '5', slug: 'ai', name: 'AI & ML' },
    requiredApps: [
      { slug: 'openai', name: 'OpenAI', icon: '', authType: 'apikey' },
      { slug: 'notion', name: 'Notion', icon: '', authType: 'oauth2' },
    ],
    steps: ['Add OpenAI API key', 'Configure content prompts', 'Connect Notion for storage', 'Set generation schedule', 'Review and publish'],
  },
  {
    id: '7',
    slug: 'calendar-reminder-sms',
    name: 'Calendar SMS Reminders',
    description: 'Send SMS reminders for upcoming calendar events via Twilio.',
    longDescription: 'Never miss an important meeting again. Automatically send SMS reminders to yourself or attendees before calendar events using Twilio.',
    tags: ['calendar', 'notifications', 'sms'],
    popularity: 74,
    estimatedSetupMinutes: 7,
    category: { id: '1', slug: 'productivity', name: 'Productivity' },
    requiredApps: [
      { slug: 'google-calendar', name: 'Google Calendar', icon: '', authType: 'oauth2' },
      { slug: 'twilio', name: 'Twilio', icon: '', authType: 'apikey' },
    ],
    steps: ['Connect Google Calendar', 'Set up Twilio account', 'Configure reminder timing', 'Customize message template', 'Enable'],
  },
  {
    id: '8',
    slug: 'salesforce-lead-enrichment',
    name: 'Lead Enrichment Pipeline',
    description: 'Automatically enrich Salesforce leads with company and contact data.',
    longDescription: 'Enhance your Salesforce leads with rich company and contact data automatically. Get detailed information about companies, decision makers, and more.',
    tags: ['crm', 'enrichment', 'sales'],
    popularity: 85,
    estimatedSetupMinutes: 12,
    category: { id: '3', slug: 'sales', name: 'Sales & CRM' },
    requiredApps: [
      { slug: 'salesforce', name: 'Salesforce', icon: '', authType: 'oauth2' },
    ],
    steps: ['Connect Salesforce', 'Configure enrichment sources', 'Map data fields', 'Set trigger conditions', 'Activate pipeline'],
  },
  {
    id: '9',
    slug: 'shopify-order-fulfillment',
    name: 'Shopify Order Automation',
    description: 'Automate order processing, fulfillment, and customer notifications.',
    longDescription: 'Streamline your e-commerce operations with automated order processing. From order receipt to fulfillment and customer notification, everything runs on autopilot.',
    tags: ['ecommerce', 'orders', 'automation'],
    popularity: 87,
    estimatedSetupMinutes: 20,
    category: { id: '6', slug: 'ecommerce', name: 'E-commerce' },
    requiredApps: [
      { slug: 'shopify', name: 'Shopify', icon: '', authType: 'oauth2' },
      { slug: 'slack', name: 'Slack', icon: '', authType: 'oauth2' },
    ],
    steps: ['Connect Shopify store', 'Configure order triggers', 'Set up fulfillment rules', 'Create notification templates', 'Enable automation'],
  },
];

// Generate steps from n8n workflow
function generateStepsFromWorkflow(workflow: any): string[] {
  if (!workflow || !workflow.nodes) {
    return ['Connect your apps', 'Configure workflow settings', 'Test the automation', 'Activate workflow'];
  }

  const steps: string[] = [];
  const nodes = workflow.nodes || [];

  // Extract trigger nodes
  const triggerNodes = nodes.filter((n: any) => n.type?.includes('Trigger') || n.name?.toLowerCase().includes('trigger'));
  if (triggerNodes.length > 0) {
    steps.push(`Set up trigger: ${triggerNodes[0].name || 'Configure when workflow starts'}`);
  }

  // Extract action nodes (non-trigger, non-start)
  const actionNodes = nodes.filter((n: any) =>
    !n.type?.includes('Trigger') &&
    n.type !== 'n8n-nodes-base.start' &&
    !n.disabled
  );

  actionNodes.slice(0, 4).forEach((node: any) => {
    steps.push(`${node.name || node.type}: Configure settings`);
  });

  if (steps.length === 0) {
    return ['Connect your apps', 'Configure workflow settings', 'Test the automation', 'Activate workflow'];
  }

  steps.push('Test and activate workflow');
  return steps;
}

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  // Fetch template from API
  const { data, isLoading, error } = useQuery<TemplateResponse>({
    queryKey: ['template', slug],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/templates/${slug}`);
      if (!response.ok) throw new Error('Failed to fetch template');
      return response.json();
    },
  });

  const template = data?.data;
  const steps = template?.n8nWorkflow ? generateStepsFromWorkflow(template.n8nWorkflow) : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-14 flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <p className="text-muted-foreground">Loading template...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-14 flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-400 mb-6">
              <Zap className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Template Not Found</h2>
            <p className="text-muted-foreground mb-8">The template you're looking for doesn't exist.</p>
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Templates
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-14">
        {/* Hero */}
        <section className="py-16 border-b border-[var(--line-color)]">
          <div className="mx-auto max-w-5xl px-6">
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Templates
            </Link>

            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
              <div className="flex-1">
                {/* Category & popularity */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-medium text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full">
                    {template.category.name}
                  </span>
                  {template.popularity > 90 && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full">
                      <Sparkles className="h-3 w-3" />
                      Popular
                    </span>
                  )}
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                  {template.name}
                </h1>
                <p className="text-lg text-muted-foreground mb-6">
                  {template.longDescription || template.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs text-muted-foreground bg-white/5 px-3 py-1 rounded-full border border-[var(--line-color)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{template.estimatedSetupMinutes} min setup</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <span>{steps.length} steps</span>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="lg:w-64 flex-shrink-0">
                <button className="w-full flex items-center justify-center gap-2 rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-600 transition-colors">
                  Use Template
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-16">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-12">
                {/* Required Apps */}
                <div>
                  <h2 className="text-xl font-semibold mb-6">Required Connections</h2>
                  <div className="space-y-3">
                    {template.requiredApps.map((app) => (
                      <div
                        key={app.slug}
                        className="flex items-center justify-between p-4 rounded-xl border border-[var(--line-color)] bg-white/[0.02]"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center text-sm font-semibold">
                            {app.name[0]}
                          </div>
                          <div>
                            <p className="font-medium">{app.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {app.authType === 'oauth2' ? 'OAuth Connection' : 'API Key Required'}
                            </p>
                          </div>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* How It Works */}
                <div>
                  <h2 className="text-xl font-semibold mb-6">How It Works</h2>
                  <div className="space-y-4">
                    {steps.map((step, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1 pt-1">
                          <p className="text-muted-foreground">{step}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Template Info */}
                <div className="rounded-xl border border-[var(--line-color)] bg-white/[0.02] p-6">
                  <h3 className="font-semibold mb-4">Template Info</h3>
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Category</p>
                      <p className="font-medium">{template.category.name}</p>
                    </div>
                    <div className="h-px bg-[var(--line-color)]" />
                    <div>
                      <p className="text-muted-foreground mb-1">Setup Time</p>
                      <p className="font-medium">{template.estimatedSetupMinutes} minutes</p>
                    </div>
                    <div className="h-px bg-[var(--line-color)]" />
                    <div>
                      <p className="text-muted-foreground mb-1">Steps</p>
                      <p className="font-medium">{steps.length} steps</p>
                    </div>
                    <div className="h-px bg-[var(--line-color)]" />
                    <div>
                      <p className="text-muted-foreground mb-1">Required Apps</p>
                      <p className="font-medium">{template.requiredApps.length} apps</p>
                    </div>
                  </div>
                </div>

                {/* CTA Card */}
                <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-6">
                  <h3 className="font-semibold mb-2">Ready to automate?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect your apps and activate this workflow in minutes.
                  </p>
                  <button className="w-full flex items-center justify-center gap-2 rounded-full bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition-colors">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
