'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import {
  Zap,
  PlayCircle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Plus,
  Layers,
  Link2,
  ArrowRight,
  Sparkles,
  Activity,
  Timer
} from 'lucide-react';

// Demo recent activity data
const recentActivity = [
  { id: 1, type: 'success', workflow: 'Slack to Gmail Notifications', time: '2 minutes ago', message: 'Executed successfully' },
  { id: 2, type: 'success', workflow: 'GitHub to Discord Alerts', time: '15 minutes ago', message: 'Triggered by new PR' },
  { id: 3, type: 'pending', workflow: 'Daily Report Generator', time: '1 hour ago', message: 'Scheduled for 6:00 PM' },
  { id: 4, type: 'success', workflow: 'Stripe Payment Alerts', time: '3 hours ago', message: 'Payment received: $299' },
];

// Demo recommended templates
const recommendedTemplates = [
  {
    id: '1',
    slug: 'openai-content-generator',
    name: 'AI Content Generator',
    description: 'Generate blog posts, social media content, and more with GPT-4.',
    category: 'AI & ML',
    setupTime: 8,
    popular: true,
  },
  {
    id: '2',
    slug: 'slack-gmail-notification',
    name: 'Slack to Gmail Notifications',
    description: 'Forward important Slack messages to your inbox automatically.',
    category: 'Productivity',
    setupTime: 5,
    popular: true,
  },
  {
    id: '3',
    slug: 'github-discord-alerts',
    name: 'GitHub to Discord Alerts',
    description: 'Get instant Discord notifications for GitHub events like PRs and issues.',
    category: 'Developer Tools',
    setupTime: 3,
    popular: false,
  },
];

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-14">
        {/* Hero Section */}
        <section className="relative py-12 overflow-hidden">
          {/* Background texture */}
          <div className="absolute inset-0 bg-hero-texture opacity-50" />
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-sky-400 mb-2">Dashboard</p>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  Welcome back, {user.name?.split(' ')[0] || 'there'}!
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Here's an overview of your automation workflows.
                </p>
              </div>
              <button
                onClick={logout}
                className="hidden sm:flex items-center gap-2 rounded-full border border-[var(--line-color)] bg-white/5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
              >
                Sign out
              </button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="pb-8">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Active Workflows */}
              <div className="group relative rounded-2xl border border-[var(--line-color)] bg-white/[0.02] p-6 hover:bg-white/[0.05] transition-all">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10">
                    <Zap className="h-6 w-6 text-sky-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Workflows</p>
                    <p className="text-2xl font-bold">3</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs text-emerald-400">
                  <TrendingUp className="h-3 w-3" />
                  <span>+2 this week</span>
                </div>
              </div>

              {/* Executions Today */}
              <div className="group relative rounded-2xl border border-[var(--line-color)] bg-white/[0.02] p-6 hover:bg-white/[0.05] transition-all">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10">
                    <PlayCircle className="h-6 w-6 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Executions Today</p>
                    <p className="text-2xl font-bold">47</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs text-emerald-400">
                  <TrendingUp className="h-3 w-3" />
                  <span>+12% vs yesterday</span>
                </div>
              </div>

              {/* Success Rate */}
              <div className="group relative rounded-2xl border border-[var(--line-color)] bg-white/[0.02] p-6 hover:bg-white/[0.05] transition-all">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold">98.5%</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                  <span>Last 7 days</span>
                </div>
              </div>

              {/* Time Saved */}
              <div className="group relative rounded-2xl border border-[var(--line-color)] bg-white/[0.02] p-6 hover:bg-white/[0.05] transition-all">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                    <Timer className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time Saved</p>
                    <p className="text-2xl font-bold">12.5h</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                  <span>This month</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-6">
          <div className="h-px bg-[var(--line-color)]" />
        </div>

        {/* Quick Actions */}
        <section className="py-8">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="text-lg font-semibold mb-6">Quick Actions</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Link
                href="/templates"
                className="group flex items-center gap-4 rounded-2xl border border-[var(--line-color)] bg-white/[0.02] p-6 hover:bg-white/[0.05] hover:border-sky-500/50 transition-all"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 group-hover:bg-sky-500/20 transition-colors">
                  <Plus className="h-6 w-6 text-sky-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium group-hover:text-sky-400 transition-colors">Create Workflow</h3>
                  <p className="text-sm text-muted-foreground">Start from a template</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>

              <Link
                href="/templates"
                className="group flex items-center gap-4 rounded-2xl border border-[var(--line-color)] bg-white/[0.02] p-6 hover:bg-white/[0.05] hover:border-violet-500/50 transition-all"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 group-hover:bg-violet-500/20 transition-colors">
                  <Layers className="h-6 w-6 text-violet-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium group-hover:text-violet-400 transition-colors">Browse Templates</h3>
                  <p className="text-sm text-muted-foreground">500+ ready to use</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>

              <Link
                href="/integrations"
                className="group flex items-center gap-4 rounded-2xl border border-[var(--line-color)] bg-white/[0.02] p-6 hover:bg-white/[0.05] hover:border-emerald-500/50 transition-all"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                  <Link2 className="h-6 w-6 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium group-hover:text-emerald-400 transition-colors">View Integrations</h3>
                  <p className="text-sm text-muted-foreground">Connect your apps</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </div>
        </section>

        {/* Two Column Layout */}
        <section className="pb-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Recent Activity */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Recent Activity</h2>
                  <button className="text-sm text-sky-400 hover:text-sky-300 transition-colors">
                    View all
                  </button>
                </div>
                <div className="rounded-2xl border border-[var(--line-color)] bg-white/[0.02] divide-y divide-[var(--line-color)]">
                  {recentActivity.map((item) => (
                    <div key={item.id} className="flex items-start gap-4 p-4 hover:bg-white/[0.02] transition-colors">
                      <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${item.type === 'success' ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                        }`}>
                        {item.type === 'success' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Clock className="h-4 w-4 text-amber-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.workflow}</p>
                        <p className="text-sm text-muted-foreground">{item.message}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Templates */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Recommended for You</h2>
                  <Link href="/templates" className="text-sm text-sky-400 hover:text-sky-300 transition-colors">
                    See all
                  </Link>
                </div>
                <div className="space-y-4">
                  {recommendedTemplates.map((template) => (
                    <Link
                      key={template.id}
                      href={`/templates/${template.slug}`}
                      className="group block rounded-2xl border border-[var(--line-color)] bg-white/[0.02] p-4 hover:bg-white/[0.05] hover:border-white/20 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-medium text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">
                              {template.category}
                            </span>
                            {template.popular && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                <Sparkles className="h-3 w-3" />
                                Popular
                              </span>
                            )}
                          </div>
                          <h3 className="font-medium group-hover:text-sky-400 transition-colors truncate">
                            {template.name}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                            {template.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{template.setupTime}m</span>
                        </div>
                      </div>
                    </Link>
                  ))}
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
