import { CheckCircle2, XCircle, AlertTriangle, Trash2, TestTube2 } from 'lucide-react';
import { Credential } from '@/lib/api/credentials.api';
import { formatDistanceToNow } from 'date-fns';

interface CredentialCardProps {
  credential: Credential;
  onTest: () => void;
  onDelete: () => void;
  isTestingLoading?: boolean;
  isDeletingLoading?: boolean;
}

export function CredentialCard({
  credential,
  onTest,
  onDelete,
  isTestingLoading,
  isDeletingLoading,
}: CredentialCardProps) {
  const getStatusBadge = () => {
    if (!credential.isValid) {
      return (
        <div className="flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-500/10 px-2 py-1 rounded-full">
          <XCircle className="h-3 w-3" />
          Invalid
        </div>
      );
    }

    // Check if OAuth token is expiring soon (within 24 hours)
    if (credential.oauthExpiresAt) {
      const expiresAt = new Date(credential.oauthExpiresAt);
      const hoursUntilExpiry = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60);

      if (hoursUntilExpiry < 0) {
        return (
          <div className="flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-500/10 px-2 py-1 rounded-full">
            <XCircle className="h-3 w-3" />
            Expired
          </div>
        );
      }

      if (hoursUntilExpiry < 24) {
        return (
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">
            <AlertTriangle className="h-3 w-3" />
            Expiring Soon
          </div>
        );
      }
    }

    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
        <CheckCircle2 className="h-3 w-3" />
        Valid
      </div>
    );
  };

  const getAuthTypeLabel = () => {
    return credential.app.authType === 'oauth2' ? 'OAuth 2.0' : 'API Key';
  };

  const getLastValidatedText = () => {
    if (!credential.lastValidatedAt) {
      return 'Never tested';
    }
    return `Tested ${formatDistanceToNow(new Date(credential.lastValidatedAt), { addSuffix: true })}`;
  };

  return (
    <div className="group relative rounded-2xl border border-[var(--line-color)] bg-white/[0.02] p-6 hover:bg-white/[0.05] transition-all">
      {/* Status Badge */}
      <div className="absolute top-4 right-4">
        {getStatusBadge()}
      </div>

      {/* App Info */}
      <div className="mb-4">
        {credential.app.iconUrl ? (
          <img
            src={credential.app.iconUrl}
            alt={credential.app.name}
            className="h-12 w-12 rounded-lg mb-3"
          />
        ) : (
          <div className="h-12 w-12 rounded-lg bg-sky-500/10 flex items-center justify-center mb-3">
            <span className="text-2xl font-bold text-sky-400">
              {credential.app.name.charAt(0)}
            </span>
          </div>
        )}

        <h3 className="font-semibold text-lg mb-1">{credential.app.name}</h3>
        <p className="text-xs text-muted-foreground">{getAuthTypeLabel()}</p>
      </div>

      {/* Validation Error */}
      {credential.validationError && (
        <div className="mb-4 text-xs text-red-400 bg-red-500/10 rounded-lg p-2">
          {credential.validationError}
        </div>
      )}

      {/* Last Validated */}
      <div className="mb-4 text-xs text-muted-foreground">
        {getLastValidatedText()}
      </div>

      {/* OAuth Scopes */}
      {credential.oauthScopes && credential.oauthScopes.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2">Permissions:</p>
          <div className="flex flex-wrap gap-1">
            {credential.oauthScopes.slice(0, 3).map((scope, index) => (
              <span
                key={index}
                className="text-[10px] text-muted-foreground bg-white/5 px-2 py-1 rounded"
              >
                {scope.split('/').pop() || scope}
              </span>
            ))}
            {credential.oauthScopes.length > 3 && (
              <span className="text-[10px] text-muted-foreground bg-white/5 px-2 py-1 rounded">
                +{credential.oauthScopes.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-[var(--line-color)]">
        <button
          onClick={onTest}
          disabled={isTestingLoading}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTestingLoading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Testing...
            </>
          ) : (
            <>
              <TestTube2 className="h-4 w-4" />
              Test
            </>
          )}
        </button>

        <button
          onClick={onDelete}
          disabled={isDeletingLoading}
          className="flex items-center justify-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeletingLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
