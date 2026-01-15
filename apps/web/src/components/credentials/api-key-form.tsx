'use client';

import { useState } from 'react';
import { ArrowLeft, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import * as credentialsApi from '@/lib/api/credentials.api';
import { useToast } from '@/components/ui/use-toast';

interface ApiKeyFormProps {
  provider: 'openai';
  onSuccess: () => void;
  onCancel: () => void;
}

export function ApiKeyForm({ provider, onSuccess, onCancel }: ApiKeyFormProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (input: credentialsApi.CreateApiKeyInput) =>
      credentialsApi.createApiKeyCredential(input),
    onSuccess: () => {
      toast({
        title: 'Credential added',
        description: 'Your API key has been saved successfully.',
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiKey.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your API key',
        variant: 'destructive',
      });
      return;
    }

    createMutation.mutate({
      appSlug: provider,
      apiKey: apiKey.trim(),
    });
  };

  const getProviderInfo = () => {
    switch (provider) {
      case 'openai':
        return {
          name: 'OpenAI',
          icon: '🤖',
          description: 'Use GPT-4, DALL-E, and other OpenAI models',
          docsUrl: 'https://platform.openai.com/api-keys',
          placeholder: 'sk-...',
          instructions: [
            'Go to OpenAI Platform',
            'Navigate to API Keys section',
            'Create a new secret key',
            'Copy and paste it here',
          ],
        };
      default:
        return {
          name: provider,
          icon: '🔑',
          description: 'Connect using API key',
          docsUrl: '#',
          placeholder: 'Enter your API key',
          instructions: [],
        };
    }
  };

  const info = getProviderInfo();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Provider Info */}
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/5 text-3xl">
          {info.icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">{info.name}</h3>
          <p className="text-sm text-muted-foreground">{info.description}</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="rounded-xl border border-[var(--line-color)] bg-white/[0.02] p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium">How to get your API key:</p>
          <a
            href={info.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Open docs
          </a>
        </div>
        <ol className="space-y-2">
          {info.instructions.map((instruction, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="text-sky-400 font-medium">{index + 1}.</span>
              <span>{instruction}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* API Key Input */}
      <div className="space-y-2">
        <label htmlFor="apiKey" className="text-sm font-medium">
          API Key
        </label>
        <div className="relative">
          <input
            id="apiKey"
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={info.placeholder}
            className="w-full rounded-lg border border-[var(--line-color)] bg-white/5 px-4 py-2.5 pr-12 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50"
            disabled={createMutation.isPending}
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showKey ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Your API key is encrypted and stored securely.
        </p>
      </div>

      {/* Security Note */}
      <div className="rounded-xl bg-sky-500/10 border border-sky-500/20 p-4">
        <p className="text-sm text-sky-200">
          <strong>Secure:</strong> All API keys are encrypted using AES-256-GCM encryption before storage.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={createMutation.isPending}
          className="flex items-center gap-2 rounded-lg border border-[var(--line-color)] bg-white/5 px-4 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <button
          type="submit"
          disabled={createMutation.isPending || !apiKey.trim()}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createMutation.isPending ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving...
            </>
          ) : (
            'Save API Key'
          )}
        </button>
      </div>
    </form>
  );
}
