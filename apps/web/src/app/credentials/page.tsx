'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { Plus, Search } from 'lucide-react';
import * as credentialsApi from '@/lib/api/credentials.api';
import { CredentialCard } from '@/components/credentials/credential-card';
import { AddCredentialModal } from '@/components/credentials/add-credential-modal';
import { useToast } from '@/components/ui/use-toast';

export default function CredentialsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch credentials
  const { data: credentials, isLoading, error } = useQuery({
    queryKey: ['credentials'],
    queryFn: credentialsApi.listCredentials,
  });

  // Delete credential mutation
  const deleteMutation = useMutation({
    mutationFn: credentialsApi.deleteCredential,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      toast({
        title: 'Credential deleted',
        description: 'Your credential has been removed successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Test credential mutation
  const testMutation = useMutation({
    mutationFn: credentialsApi.testCredential,
    onSuccess: (data, credentialId) => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      toast({
        title: data.isValid ? 'Credential valid' : 'Credential invalid',
        description: data.message || (data.isValid ? 'Your credential is working correctly.' : 'Please reconnect your account.'),
        variant: data.isValid ? 'default' : 'destructive',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Test failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Filter credentials by search
  const filteredCredentials = credentials?.filter((cred) =>
    cred.app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group credentials by provider
  const groupedCredentials = filteredCredentials?.reduce((acc, cred) => {
    const provider = cred.app.name;
    if (!acc[provider]) {
      acc[provider] = [];
    }
    acc[provider].push(cred);
    return acc;
  }, {} as Record<string, typeof credentials>);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-14">
        {/* Hero Section */}
        <section className="relative py-12 overflow-hidden">
          <div className="absolute inset-0 bg-hero-texture opacity-50" />
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-sky-400 mb-2">Credentials</p>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  Connected Accounts
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Manage your app connections and API keys securely.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 rounded-full bg-sky-500 px-6 py-3 text-sm font-medium text-white hover:bg-sky-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Credential
              </button>
            </div>
          </div>
        </section>

        {/* Search & Content */}
        <section className="pb-16">
          <div className="mx-auto max-w-7xl px-6">
            {/* Divider */}
            <div className="h-px bg-[var(--line-color)] mb-8" />

            {/* Search */}
            <div className="mb-8 relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search credentials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-[var(--line-color)] bg-white/5 pl-12 pr-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50"
              />
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12">
                <div className="flex items-center justify-center gap-3 text-muted-foreground">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span>Loading credentials...</span>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <p className="text-red-400">Failed to load credentials. Please try again.</p>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && credentials?.length === 0 && (
              <div className="text-center py-16">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-sky-500/10 mb-4">
                  <Plus className="h-8 w-8 text-sky-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No credentials yet</h3>
                <p className="text-muted-foreground mb-6">
                  Connect your first app to start automating workflows.
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-6 py-3 text-sm font-medium text-white hover:bg-sky-600 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Credential
                </button>
              </div>
            )}

            {/* Credentials Grid */}
            {!isLoading && !error && filteredCredentials && filteredCredentials.length > 0 && (
              <div className="space-y-8">
                {Object.entries(groupedCredentials || {}).map(([provider, creds]) => (
                  <div key={provider}>
                    <h2 className="text-lg font-semibold mb-4">{provider}</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {creds.map((credential) => (
                        <CredentialCard
                          key={credential.id}
                          credential={credential}
                          onTest={() => testMutation.mutate(credential.id)}
                          onDelete={() => deleteMutation.mutate(credential.id)}
                          isTestingLoading={testMutation.isPending}
                          isDeletingLoading={deleteMutation.isPending}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Results */}
            {!isLoading && !error && filteredCredentials?.length === 0 && credentials && credentials.length > 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No credentials match your search.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />

      {/* Add Credential Modal */}
      <AddCredentialModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['credentials'] });
          setIsAddModalOpen(false);
        }}
      />
    </div>
  );
}
