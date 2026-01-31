'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Search, Clock, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { listTemplates, TemplatesResponse, Template } from '@/lib/api/templates.api';

const categories = ['All', 'Productivity', 'Operations', 'Sales', 'Marketing', 'Customer Support', 'Lead Management'];

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [allTemplates, setAllTemplates] = useState<Template[]>([]);
  const limit = 100; // Fetch more templates per page

  // Fetch templates from API
  const { data, isLoading, error } = useQuery({
    queryKey: ['templates', page, selectedCategory, searchQuery],
    queryFn: () => listTemplates({
      page,
      limit,
      category: selectedCategory,
      q: searchQuery
    }),
  });

  useEffect(() => {
    if (data?.success && data?.data) {
      if (page === 1) {
        setAllTemplates(data.data);
      } else {
        setAllTemplates((prev) => [...prev, ...data.data]);
      }
    }
  }, [data, page]);

  // Reset to page 1 when search or category changes
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPage(1);
    setAllTemplates([]);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPage(1);
    setAllTemplates([]);
  };

  const templates = allTemplates;
  const totalTemplates = data?.meta?.total || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-14">
        {/* Hero */}
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-sky-400 mb-3">Templates</p>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                {totalTemplates}+ ready-to-use automations
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Browse our curated library of automation templates. One-click setup, zero coding required.
              </p>
            </div>

            {/* Search */}
            <div className="mt-12 relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded-full border border-[var(--line-color)] bg-white/5 pl-12 pr-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50"
              />
            </div>
          </div>
        </section>

        {/* Categories & Grid */}
        <section className="pb-24">
          <div className="mx-auto max-w-7xl px-6">
            {/* Divider */}
            <div className="h-px bg-[var(--line-color)] mb-8" />

            {/* Category tabs */}
            <div className="flex flex-wrap gap-2 mb-12">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-4 py-2 text-sm rounded-full transition-colors ${selectedCategory === cat
                    ? 'bg-sky-500 text-white'
                    : 'bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Templates Grid */}
            {isLoading && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading templates...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <p className="text-red-400">Failed to load templates. Showing demo templates.</p>
              </div>
            )}

            {!isLoading && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template, index) => (
                  <Link
                    key={template.id}
                    href={`/templates/${template.slug}`}
                    className={`group relative rounded-2xl border border-[var(--line-color)] bg-white/[0.02] p-6 hover:bg-white/[0.05] hover:border-white/20 transition-all
                  `}
                  >
                    {template.popularity > 90 && (
                      <span className="absolute top-4 right-4 inline-flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                        <Sparkles className="h-3 w-3" />
                        Popular
                      </span>
                    )}

                    {/* Category badge */}
                    <span className="inline-block text-[10px] font-medium text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full mb-4">
                      {template.category.name}
                    </span>

                    <h3 className="font-semibold mb-2 group-hover:text-sky-400 transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {template.description}
                    </p>

                    {/* Apps used */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {template.requiredApps.slice(0, 3).map((app) => (
                        <span
                          key={app.slug}
                          className="text-[11px] text-muted-foreground bg-white/5 px-2 py-1 rounded"
                        >
                          {app.name}
                        </span>
                      ))}
                      {template.requiredApps.length > 3 && (
                        <span className="text-[11px] text-muted-foreground bg-white/5 px-2 py-1 rounded">
                          +{template.requiredApps.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-[var(--line-color)]">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{template.estimatedSetupMinutes} min setup</span>
                      </div>
                      <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {!isLoading && templates.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No templates found matching your criteria.</p>
              </div>
            )}

            {/* Load more CTA */}
            {!isLoading && data?.meta && data.meta.page < data.meta.totalPages && (
              <div className="mt-12 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Showing {templates.length} of {totalTemplates} templates
                </p>
                <button
                  onClick={() => setPage(page + 1)}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-medium hover:bg-white/15 transition-colors"
                >
                  Load more templates
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
