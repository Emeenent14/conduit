'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Clock, Zap } from 'lucide-react';

interface App {
  slug: string;
  name: string;
  icon: string;
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
  tags: string[];
  popularity: number;
  estimatedSetupMinutes: number;
  category: Category;
  requiredApps: App[];
}

interface TemplatesResponse {
  success: boolean;
  data: Template[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/templates/categories`);
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
  });

  // Fetch templates with filters
  const { data: templatesData, isLoading } = useQuery<TemplatesResponse>({
    queryKey: ['templates', page, selectedCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(selectedCategory && { category: selectedCategory }),
        ...(searchQuery && { search: searchQuery }),
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/templates?${params}`);
      if (!res.ok) throw new Error('Failed to fetch templates');
      return res.json();
    },
  });

  const templates = templatesData?.data || [];
  const meta = templatesData?.meta;
  const categories = categoriesData?.data || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Template Catalog</h1>
          <p className="mt-2 text-gray-600">
            Browse {meta?.total || 0} pre-built automation templates. One-click setup, zero coding required.
          </p>

          {/* Search Bar */}
          <div className="mt-6 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar - Categories */}
          <aside className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border p-4 sticky top-4">
              <h2 className="font-semibold text-gray-900 mb-4">Categories</h2>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setPage(1);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedCategory === null
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  All Templates
                </button>
                {categories.map((category: any) => (
                  <button
                    key={category.slug}
                    onClick={() => {
                      setSelectedCategory(category.slug);
                      setPage(1);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedCategory === category.slug
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content - Template Grid */}
          <main className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-20 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No templates found</p>
                <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map((template) => (
                    <Link key={template.id} href={`/templates/${template.slug}`}>
                      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-lg line-clamp-2">{template.name}</CardTitle>
                          </div>
                          <CardDescription className="line-clamp-2">{template.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {/* Required Apps */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {template.requiredApps.slice(0, 3).map((app) => (
                              <Badge key={app.slug} variant="secondary" className="text-xs">
                                {app.name}
                              </Badge>
                            ))}
                            {template.requiredApps.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{template.requiredApps.length - 3}
                              </Badge>
                            )}
                          </div>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-2">
                            {template.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                        <CardFooter className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{template.estimatedSetupMinutes} min</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {template.category.name}
                          </Badge>
                        </CardFooter>
                      </Card>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {meta && meta.totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {page} of {meta.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      disabled={page === meta.totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
