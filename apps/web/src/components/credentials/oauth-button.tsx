'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, ArrowLeft } from 'lucide-react';
import * as credentialsApi from '@/lib/api/credentials.api';

interface OAuthButtonProps {
  provider: 'google' | 'slack';
  onSuccess: () => void;
  onCancel: () => void;
}

export function OAuthButton({ provider, onSuccess, onCancel }: OAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Listen for OAuth callback
  useEffect(() => {
    const handleOAuthCallback = (event: MessageEvent) => {
      if (event.data?.type === 'oauth-success' && event.data?.provider === provider) {
        setIsLoading(false);
        onSuccess();
      }
    };

    window.addEventListener('message', handleOAuthCallback);
    return () => window.removeEventListener('message', handleOAuthCallback);
  }, [provider, onSuccess]);

  const handleOAuthClick = () => {
    setIsLoading(true);

    // Get the OAuth URL
    const returnUrl = `${window.location.origin}/credentials`;
    const oauthUrl = credentialsApi.getOAuthUrl(provider, returnUrl);

    // Open OAuth popup
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      oauthUrl,
      `${provider}-oauth`,
      `width=${width},height=${height},left=${left},top=${top},popup=1,toolbar=0,menubar=0`
    );

    if (!popup) {
      alert('Please allow popups to connect your account');
      setIsLoading(false);
      return;
    }

    // Poll for popup closure
    const pollTimer = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollTimer);
        setIsLoading(false);
      }
    }, 500);
  };

  const getProviderInfo = () => {
    switch (provider) {
      case 'google':
        return {
          name: 'Google',
          icon: '🔍',
          description: 'Access Gmail, Google Sheets, Calendar, and more',
          scopes: ['Email', 'Profile', 'Gmail', 'Sheets'],
        };
      case 'slack':
        return {
          name: 'Slack',
          icon: '💬',
          description: 'Send messages, read channels, and interact with your workspace',
          scopes: ['Messages', 'Channels', 'Users'],
        };
      default:
        return {
          name: provider,
          icon: '🔗',
          description: 'Connect your account',
          scopes: [],
        };
    }
  };

  const info = getProviderInfo();

  return (
    <div className="space-y-6">
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

      {/* Permissions */}
      <div className="rounded-xl border border-[var(--line-color)] bg-white/[0.02] p-4">
        <p className="text-sm font-medium mb-3">This will allow Conduit to:</p>
        <ul className="space-y-2">
          {info.scopes.map((scope, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="text-sky-400 mt-0.5">•</span>
              <span>Access your {scope}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Info Note */}
      <div className="rounded-xl bg-sky-500/10 border border-sky-500/20 p-4">
        <p className="text-sm text-sky-200">
          <strong>Secure:</strong> Your credentials are encrypted and stored securely. You can revoke access at any time.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 rounded-lg border border-[var(--line-color)] bg-white/5 px-4 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <button
          onClick={handleOAuthClick}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Connecting...
            </>
          ) : (
            <>
              <ExternalLink className="h-4 w-4" />
              Connect {info.name}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
