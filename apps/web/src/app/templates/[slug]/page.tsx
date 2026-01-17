'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Clock, Zap, CheckCircle2, AlertCircle } from 'lucide-react';

interface App {
  slug: string;
  name: string;
  icon: string;
  authType: string;
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
  n8nWorkflow: any;
  configFields: any[];
}

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ['template', slug],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/templates/${slug}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Template not found');
        }
        throw new Error('Failed to fetch template');
      }
      return res.json();
    },
    enabled: !!slug,
  });

  const template: Template | undefined = data?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading template...</p>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Template Not Found</h2>
          <p className="text-gray-600 mb-6">The template you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/templates')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Templates
          </Button>
        </div>
      </div>
    );
  }

  const nodeCount = template.n8nWorkflow?.nodes?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/templates"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Templates
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{template.name}</h1>
              <p className="text-lg text-gray-600 mb-4">{template.description}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {template.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{template.estimatedSetupMinutes} min setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span>{nodeCount} workflow steps</span>
                </div>
                <Badge variant="secondary">{template.category.name}</Badge>
              </div>
            </div>

            <div>
              <Button size="lg" className="whitespace-nowrap">
                Use Template
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Required Apps */}
            <Card>
              <CardHeader>
                <CardTitle>Required Apps & Credentials</CardTitle>
                <CardDescription>
                  You'll need to connect these apps to use this template
                </CardDescription>
              </CardHeader>
              <CardContent>
                {template.requiredApps.length === 0 ? (
                  <p className="text-gray-500 text-sm">No external apps required</p>
                ) : (
                  <div className="space-y-3">
                    {template.requiredApps.map((app) => (
                      <div
                        key={app.slug}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center">
                            <span className="text-sm font-medium">{app.name[0]}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{app.name}</p>
                            <p className="text-xs text-gray-500">
                              {app.authType === 'oauth2' ? 'OAuth Connection' : 'API Key Required'}
                            </p>
                          </div>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-gray-300" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* How It Works */}
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
                <CardDescription>This workflow consists of {nodeCount} automated steps</CardDescription>
              </CardHeader>
              <CardContent>
                {template.n8nWorkflow?.nodes && template.n8nWorkflow.nodes.length > 0 ? (
                  <div className="space-y-4">
                    {template.n8nWorkflow.nodes.slice(0, 10).map((node: any, index: number) => (
                      <div key={node.id} className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1 pt-1">
                          <p className="font-medium text-gray-900">{node.name}</p>
                          <p className="text-sm text-gray-500">
                            {node.type?.replace('n8n-nodes-base.', '')}
                          </p>
                        </div>
                      </div>
                    ))}
                    {template.n8nWorkflow.nodes.length > 10 && (
                      <p className="text-sm text-gray-500 text-center pt-2">
                        + {template.n8nWorkflow.nodes.length - 10} more steps
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Workflow details not available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Template Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Category</p>
                  <Badge variant="secondary">{template.category.name}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Setup Time</p>
                  <p className="font-medium">{template.estimatedSetupMinutes} minutes</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Workflow Steps</p>
                  <p className="font-medium">{nodeCount} nodes</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Required Apps</p>
                  <p className="font-medium">
                    {template.requiredApps.length === 0
                      ? 'None'
                      : template.requiredApps.length}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-gray-900 mb-2">Ready to automate?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Connect your apps and activate this workflow in minutes.
                </p>
                <Button className="w-full" size="lg">
                  Get Started
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
