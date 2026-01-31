'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Clock, Zap, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { getTemplate } from '@/lib/api/templates.api';

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

// Demo templates data (removed)

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
    queryFn: () => getTemplate(slug).then(data => ({ success: true, data })), // getTemplate returns just data in my previous impl? check templates.api.ts
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
            <p className="text-muted-foreground mb-8">The template you&apos;re looking for doesn&apos;t exist.</p>
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
