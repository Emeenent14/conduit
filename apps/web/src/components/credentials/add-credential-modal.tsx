'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { OAuthButton } from './oauth-button';
import { ApiKeyForm } from './api-key-form';

interface AddCredentialModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type CredentialType = 'oauth' | 'apikey';
type Provider = 'google' | 'slack' | 'openai' | null;

const PROVIDERS = [
  {
    id: 'google',
    name: 'Google',
    description: 'Gmail, Sheets, Calendar, Drive',
    type: 'oauth' as CredentialType,
    icon: '🔍',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Messages, Channels, Users',
    type: 'oauth' as CredentialType,
    icon: '💬',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, DALL-E, Embeddings',
    type: 'apikey' as CredentialType,
    icon: '🤖',
  },
];

export function AddCredentialModal({ open, onClose, onSuccess }: AddCredentialModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<Provider>(null);

  if (!open) return null;

  const handleClose = () => {
    setSelectedProvider(null);
    onClose();
  };

  const handleSuccess = () => {
    setSelectedProvider(null);
    onSuccess();
  };

  const selectedProviderData = PROVIDERS.find((p) => p.id === selectedProvider);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-[var(--line-color)] bg-[#0A0A0A] p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold">
            {selectedProvider ? `Connect ${selectedProviderData?.name}` : 'Add Credential'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedProvider
              ? selectedProviderData?.description
              : 'Choose a service to connect'}
          </p>
        </div>

        {/* Content */}
        {!selectedProvider ? (
          // Provider Selection
          <div className="grid gap-3 sm:grid-cols-2">
            {PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                onClick={() => setSelectedProvider(provider.id as Provider)}
                className="group flex items-start gap-4 rounded-xl border border-[var(--line-color)] bg-white/[0.02] p-4 text-left hover:bg-white/[0.05] hover:border-sky-500/50 transition-all"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 text-2xl">
                  {provider.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold group-hover:text-sky-400 transition-colors">
                    {provider.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {provider.description}
                  </p>
                  <span className="text-xs text-muted-foreground mt-2 inline-block">
                    {provider.type === 'oauth' ? 'OAuth 2.0' : 'API Key'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          // Provider-Specific Form
          <div>
            {selectedProviderData?.type === 'oauth' ? (
              <OAuthButton
                provider={selectedProvider as 'google' | 'slack'}
                onSuccess={handleSuccess}
                onCancel={() => setSelectedProvider(null)}
              />
            ) : (
              <ApiKeyForm
                provider={selectedProvider as 'openai'}
                onSuccess={handleSuccess}
                onCancel={() => setSelectedProvider(null)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
