import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpFromLine,
  CloudDownload,
  Link2,
  RefreshCw,
  Unlink2,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  Clock,
  Loader2,
  History,
  Activity,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../auth/context/auth-context';
import { publicApiClient } from '../../../shared/api/apiClient';
import {
  createDefaultDraft,
  disconnectIntegration,
  loadSyncState,
  PROVIDERS,
  saveIntegration,
  verifyProviderAccessToken,
  cancelSyncJob,
  updateConnectionPolicy,
} from '../api/trackingSync';
import { MissingSupabaseFeatureError } from '../../../shared/api/supabaseSchema';
import type {
  ConflictMode,
  IntegrationRow,
  ProviderId,
  SyncDirection,
  SyncDraft,
  SyncJobRow,
} from '../api/trackingSync';
import { Surface } from '../../../shared/ui/Surface';
import { Button } from '../../../shared/ui/Button';

const syncModeOptions = [
  { value: 'manual', label: 'Manual' },
  { value: 'import-only', label: 'Import Only' },
  { value: 'bidirectional', label: 'Full Sync' },
] as const;

const conflictModeOptions: Array<{ value: ConflictMode; label: string; helper: string }> = [
  { value: 'newest_wins', label: 'Newest wins', helper: 'Keep the most recent update.' },
  { value: 'local_wins', label: 'Local wins', helper: 'BeachRead always overrides.' },
  { value: 'provider_wins', label: 'Provider wins', helper: 'External service overrides.' },
];

const syncActions: Array<{ direction: SyncDirection | 'refresh'; label: string; helper: string; icon: any }> = [
  { direction: 'import', label: 'Initial Import', helper: 'Download all manga from provider.', icon: CloudDownload },
  { direction: 'pull', label: 'Pull Changes', helper: 'Get updates since last sync.', icon: RefreshCw },
  { direction: 'refresh', label: 'Full Refresh', helper: 'Force overwrite all local data.', icon: RefreshCw },
  { direction: 'push', label: 'Push Changes', helper: 'Upload your local progress.', icon: ArrowUpFromLine },
];

function syncActionToJobType(action: SyncDirection | 'refresh') {
  switch (action) {
    case 'import':
      return 'INITIAL_IMPORT';
    case 'push':
    case 'export':
      return 'INCREMENTAL_PUSH';
    case 'refresh':
      return 'FULL_RECONCILIATION';
    case 'pull':
    default:
      return 'INCREMENTAL_PULL';
  }
}

function draftFromIntegration(integration?: IntegrationRow): SyncDraft {
  return {
    username: integration?.username || '',
    accessToken: integration?.access_token || '',
    refreshToken: integration?.refresh_token || null,
    tokenExpiresAt: integration?.token_expires_at || null,
    syncMode: integration?.sync_mode || 'manual',
    conflictMode: integration?.conflict_mode || 'newest_wins',
  };
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Never';
  const date = new Date(value);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function formatElapsed(from?: string | null, to?: string | null): string {
  if (!from) return '';
  const start = new Date(from).getTime();
  const end = to ? new Date(to).getTime() : Date.now();
  const secs = Math.floor((end - start) / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ${secs % 60}s`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function isActiveStatus(status: string) {
  return ['RUNNING', 'running', 'PENDING', 'pending'].includes(status);
}

function isConflict(status: string) {
  return status === 'AWAITING_CONFLICT_RESOLUTION';
}

function tokenHealth(integration?: IntegrationRow) {
  if (!integration?.access_token) return { status: 'none', label: 'Disconnected' };

  if (!integration.token_expires_at) return { status: 'ready', label: 'Connected' };

  const remainingMs = new Date(integration.token_expires_at).getTime() - Date.now();
  if (remainingMs <= 0) {
    return {
      status: integration.refresh_token ? 'ready' : 'expired',
      label: integration.refresh_token ? 'Connected' : 'Session Expired'
    };
  }
  return { status: 'ready', label: 'Connected' };
}

type OAuthConfig = Record<ProviderId, boolean>;
type OAuthMessage = {
  source?: string;
  ok?: boolean;
  provider?: ProviderId;
  accessToken?: string;
  refreshToken?: string | null;
  tokenExpiresAt?: string | null;
  error?: string;
};

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  if (error && typeof error === 'object') {
    const maybe = error as Record<string, unknown>;
    const direct =
      (typeof maybe.message === 'string' && maybe.message)
      || (typeof maybe.error === 'string' && maybe.error)
      || (typeof maybe.error_description === 'string' && maybe.error_description);

    if (direct) return direct;

    try {
      const serialized = JSON.stringify(maybe);
      if (serialized && serialized !== '{}') return serialized;
    } catch {
      // fall through to fallback
    }
  }

  return fallback;
}

export function TrackingSyncPanel() {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<IntegrationRow[]>([]);
  const [jobs, setJobs] = useState<SyncJobRow[]>([]);
  const [drafts, setDrafts] = useState<Record<ProviderId, SyncDraft>>(createDefaultDraft());
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [oauthConfig] = useState<OAuthConfig>({ anilist: true, mal: true });
  const [expandedProvider, setExpandedProvider] = useState<ProviderId | null>('anilist');
  const [showAdvanced, setShowAdvanced] = useState<Record<ProviderId, boolean>>({ anilist: false, mal: false });
  const [customClientId, setCustomClientId] = useState<string>('');
  const [customClientSecret, setCustomClientSecret] = useState<string>('');
  const [cancellingJobId, setCancellingJobId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hydrate = useCallback(async () => {
    if (!user) return;
    try {
      const { integrations: remoteInts, jobs: latestJobs } = await loadSyncState(user.id);
      setIntegrations(remoteInts);
      setJobs(latestJobs);

      const nextDrafts = { ...drafts };
      remoteInts.forEach((int) => {
        nextDrafts[int.provider] = draftFromIntegration(int);
      });
      setDrafts(nextDrafts);
    } catch (err) {
      if (err instanceof MissingSupabaseFeatureError) {
        setError(err.message);
      }
    }
  }, [user, drafts]);

  const pollJobs = useCallback(async () => {
    if (!user) return;
    try {
      const { jobs: latestJobs } = await loadSyncState(user.id);
      setJobs(latestJobs);
    } catch {
      // fail silently for background polling
    }
  }, [user]);

  useEffect(() => {
    void hydrate();
    void pollJobs();
  }, [hydrate, pollJobs]);

  useEffect(() => {
    if (!user) return;
    pollRef.current = setInterval(() => { void pollJobs(); }, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [user, pollJobs]);

  const integrationsByProvider = useMemo(() => {
    const map: Record<string, IntegrationRow> = {};
    integrations.forEach((int) => {
      map[int.provider] = int;
    });
    return map;
  }, [integrations]);

  const handleOAuthConnect = (providerId: ProviderId) => {
    const apiOrigin = new URL(import.meta.env.VITE_API_URL?.trim() || 'http://localhost:3005/api').origin;
    // OAuth routes are defined at the top level of the API, starting with /api/oauth
    const url = `${apiOrigin}/api/oauth/${providerId}/start?origin=${encodeURIComponent(window.location.origin)}`;
    window.open(url, 'beachread-oauth', 'width=600,height=700');
  };

  const handleCustomClientAuthorize = (providerId: ProviderId) => {
    if (!customClientId || !customClientSecret) {
      setError('Custom Client ID and Secret are required.');
      return;
    }
    const apiOrigin = new URL(import.meta.env.VITE_API_URL?.trim() || 'http://localhost:3005/api').origin;
    // Custom authorize routes also follow the top level /api/oauth structure where applicable
    const url = `${apiOrigin}/api/oauth/${providerId}/start?origin=${encodeURIComponent(window.location.origin)}&clientId=${customClientId}&clientSecret=${customClientSecret}`;
    window.open(url, 'beachread-oauth', 'width=600,height=700');
  };

  useEffect(() => {
    const apiOrigin = new URL(import.meta.env.VITE_API_URL?.trim() || 'http://localhost:3005/api').origin;

    const onMessage = (event: MessageEvent<OAuthMessage & { code?: string }>) => {
      if (event.origin !== window.location.origin && event.origin !== apiOrigin) return;

      const payload = event.data;
      if (!payload || payload.source !== 'beachread-oauth' || !payload.provider) return;

      if (!payload.ok) {
        setError(payload.error || 'Provider OAuth failed.');
        return;
      }

      void hydrate();
      setMessage(`Successfully linked ${payload.provider.toUpperCase()}!`);
      if (expandedProvider === payload.provider) {
        setExpandedProvider(null);
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [hydrate, expandedProvider]);

  const connectProvider = async (providerId: ProviderId, draft: SyncDraft) => {
    if (!user) return;
    setBusy(`save-${providerId}`);
    setError(null);
    setMessage(null);

    try {
      const identity = await verifyProviderAccessToken(providerId, draft.accessToken);
      await saveIntegration(user.id, providerId, { ...draft, id: identity.id });
      await hydrate();
      setMessage(`${providerId.toUpperCase()} settings saved and connected.`);
    } catch (err) {
      setError(toErrorMessage(err, 'Failed to save connection.'));
    } finally {
      setBusy(null);
    }
  };

  const runSyncAction = async (providerId: ProviderId, action: SyncDirection | 'refresh') => {
    if (!user) return;
    setBusy(`${action}-${providerId}`);
    setError(null);
    setMessage(null);

    try {
      await publicApiClient.post(`/sync/${providerId}/trigger`, {
        jobType: syncActionToJobType(action),
        requestedBy: 'USER',
      });
      setMessage(`Sync task initiated for ${providerId.toUpperCase()}.`);
      void pollJobs();
    } catch (err) {
      setError(toErrorMessage(err, 'Failed to start sync.'));
    } finally {
      setBusy(null);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    setCancellingJobId(jobId);
    try {
      await cancelSyncJob(jobId);
      void pollJobs();
    } catch (err) {
      setError('Failed to cancel task.');
    } finally {
      setCancellingJobId(null);
    }
  };

  const handleDisconnect = async (providerId: ProviderId) => {
    if (!user) return;
    if (!confirm(`Are you sure you want to disconnect ${providerId.toUpperCase()}?`)) return;

    setBusy(`disconnect-${providerId}`);
    try {
      await disconnectIntegration(user.id, providerId);
      await hydrate();
      setMessage(`${providerId.toUpperCase()} disconnected.`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Surface variant="none" className="space-y-6" withPadding={false}>
      <AnimatePresence>
        {(message || error) && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-[11px] font-bold ${error ? 'border-red-500/20 bg-red-500/5 text-red-500' : 'border-primary/20 bg-primary/5 text-primary'}`}
          >
            <AlertTriangle size={14} />
            {error || message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Provider Cards */}
      <div className="space-y-4">
        {PROVIDERS.map((provider) => {
          const integration = integrationsByProvider[provider.id];
          const connected = integration?.status === 'connected';
          const health = tokenHealth(integration);
          const isExpanded = expandedProvider === provider.id;

          return (
            <Surface
              key={provider.id}
              variant="none"
              className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
                isExpanded
                  ? 'border-primary/40 bg-muted/20 shadow-xl ring-1 ring-primary/10'
                  : 'border-border/40 bg-background/50 hover:border-border/80 hover:bg-muted/5'
              }`}
            >
              {/* Card Header (Clickable) */}
              <button
                onClick={() => setExpandedProvider(isExpanded ? null : provider.id)}
                className="flex w-full items-center justify-between p-5 text-left"
                aria-expanded={isExpanded}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`h-12 w-12 rounded-2xl flex items-center justify-center border transition-all duration-500 ${
                      connected
                        ? 'bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30 text-primary shadow-sm shadow-primary/10'
                        : 'bg-muted border-border/40 text-muted-foreground'
                    }`}
                  >
                    {provider.id === 'anilist' ? (
                      <Activity size={22} className={connected ? 'animate-pulse' : ''} />
                    ) : (
                      <Link2 size={22} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[12px] font-black uppercase tracking-[0.25em] text-foreground">
                        {provider.label}
                      </h3>
                      {connected && (
                        <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-widest ${
                          connected ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      >
                        {health.label}
                      </span>
                      {connected && integration?.username && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-border" />
                          <span className="text-[10px] font-medium text-foreground/80">
                            @{integration.username}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {connected && !isExpanded && integration?.last_sync_at && (
                    <span className="hidden sm:inline text-[9px] text-muted-foreground font-medium uppercase tracking-wider">
                      Synced {formatDateTime(integration.last_sync_at)}
                    </span>
                  )}
                  <div className="h-8 w-8 rounded-full bg-muted/40 flex items-center justify-center border border-border/20">
                    {isExpanded ? (
                      <ChevronUp size={14} className="text-muted-foreground" />
                    ) : (
                      <ChevronDown size={14} className="text-muted-foreground" />
                    )}
                  </div>
                </div>
              </button>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border/20 overflow-hidden"
                  >
                    <div className="p-6 space-y-8">
                      {connected ? (
                        <>
                          {/* Quick Stats & Controls */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Surface variant="muted" withPadding={false} className="p-4 flex flex-col gap-1 border-none bg-primary/5">
                              <span className="text-[9px] font-black uppercase tracking-widest text-primary/70">Library Mode</span>
                              <p className="text-xs font-bold text-foreground">
                                {syncModeOptions.find((o) => o.value === integration?.sync_mode)?.label || 'Manual'}
                              </p>
                            </Surface>
                            <Surface variant="muted" withPadding={false} className="p-4 flex flex-col gap-1 border-none bg-background/40">
                              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Last Check</span>
                              <p className="text-xs font-bold text-foreground">{formatDateTime(integration?.last_sync_at)}</p>
                            </Surface>
                            <Surface variant="muted" withPadding={false} className="p-4 flex flex-col gap-1 border-none bg-background/40">
                              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Conflict Rule</span>
                              <p className="text-xs font-bold text-foreground">
                                {conflictModeOptions.find((o) => o.value === integration?.conflict_mode)?.label || 'Newest'}
                              </p>
                            </Surface>
                            <Surface variant="muted" withPadding={false} className="p-4 flex flex-col gap-1 border-none bg-background/40">
                              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Token Health</span>
                              <p className={`text-xs font-bold ${integration?.last_error ? 'text-red-500' : 'text-primary'}`}>
                                {integration?.last_error ? 'Error Found' : 'Healthy'}
                              </p>
                            </Surface>
                          </div>

                          {/* Primary Action */}
                          <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-4">
                                <div className="h-px flex-1 bg-border/20" />
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Library Synchronization</h4>
                                <div className="h-px flex-1 bg-border/20" />
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                                <div className="lg:col-span-5 space-y-3">
                                    <h5 className="text-sm font-serif italic text-foreground">Braid your narratives</h5>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        Keep your local collection in lockstep with {provider.label}. 
                                        Most users should use <strong>Pull Changes</strong> to fetch recent updates.
                                    </p>
                                    <Button
                                        onClick={() => void runSyncAction(provider.id, 'pull')}
                                        disabled={busy !== null}
                                        variant="primary"
                                        size="lg"
                                        className="w-full shadow-lg shadow-primary/20 h-14"
                                    >
                                        <RefreshCw size={18} className={`mr-3 ${busy?.includes('pull') ? 'animate-spin' : ''}`} />
                                        Sync Now
                                    </Button>
                                </div>

                                <div className="hidden lg:block lg:col-span-1 border-l border-border/20 h-32 mx-auto" />

                                <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {syncActions.filter(a => a.direction !== 'pull').map((action) => (
                                        <button
                                            key={action.direction}
                                            onClick={() => void runSyncAction(provider.id, action.direction)}
                                            disabled={busy !== null}
                                            className="group flex items-center gap-4 rounded-xl border border-border/30 bg-background/50 p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50"
                                        >
                                            <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                                <action.icon size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                            </div>
                                            <div>
                                                <span className="block text-[11px] font-bold text-foreground">{action.label}</span>
                                                <span className="block text-[9px] text-muted-foreground mt-0.5">{action.helper}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <Surface variant="muted" className="flex flex-col items-center justify-center py-12 px-6 border-dashed border-2 text-center bg-transparent">
                          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-6">
                            <Link2 size={32} className="text-muted-foreground/40" />
                          </div>
                          <h4 className="text-lg font-serif italic mb-2">Connect your {provider.label} Archive</h4>
                          <p className="text-xs text-muted-foreground mb-8 max-w-[320px] leading-relaxed">
                            Bring your existing library and tracking data into BeachRead for a unified experience.
                          </p>

                          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                            {oauthConfig[provider.id] ? (
                              <Button
                                onClick={() => handleOAuthConnect(provider.id)}
                                variant="primary"
                                className="flex-1 bg-[#02A9FF] border-[#02A9FF] shadow-lg shadow-[#02A9FF]/20 flex items-center justify-center gap-2 h-12"
                              >
                                <Link2 size={16} />
                                Login with {provider.label}
                              </Button>
                            ) : (
                              <div className="flex-1 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center">
                                OAuth Unavailable
                              </div>
                            )}

                            <Button
                              onClick={() => setShowAdvanced((prev) => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                              variant={showAdvanced[provider.id] ? 'secondary' : 'outline'}
                              className="flex-1 h-12"
                            >
                              {showAdvanced[provider.id] ? 'Hide Manual' : 'Manual Entry'}
                            </Button>
                          </div>

                          {/* Manual Auth Sections */}
                          <AnimatePresence>
                            {(showAdvanced[provider.id] || !oauthConfig[provider.id]) && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-8 pt-8 border-t border-border/20 w-full max-w-sm overflow-hidden"
                              >
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground mb-4 text-left">
                                  {oauthConfig[provider.id] ? 'Alternative Connection' : 'Manual Configuration'}
                                </h4>
                                <div className="space-y-4">
                                  <div className="flex flex-col gap-3">
                                    <input
                                      type="text"
                                      placeholder="Client ID"
                                      value={customClientId}
                                      onChange={(e) => setCustomClientId(e.target.value)}
                                      className="w-full h-11 bg-background border border-border/60 rounded-xl px-4 text-xs focus:outline-none focus:border-primary/50 transition-all shadow-inner"
                                    />
                                    <input
                                      type="password"
                                      placeholder="Client Secret"
                                      value={customClientSecret}
                                      onChange={(e) => setCustomClientSecret(e.target.value)}
                                      className="w-full h-11 bg-background border border-border/60 rounded-xl px-4 text-xs focus:outline-none focus:border-primary/50 transition-all shadow-inner"
                                    />
                                    <Button
                                      onClick={() => handleCustomClientAuthorize(provider.id as any)}
                                      disabled={busy !== null}
                                      variant="primary"
                                      size="md"
                                      className="w-full h-11"
                                    >
                                      {busy?.startsWith('exchange') ? (
                                        <RefreshCw size={14} className="animate-spin" />
                                      ) : (
                                        'Authorize App'
                                      )}
                                    </Button>

                                    <div className="p-4 bg-background/40 border border-border/30 rounded-xl text-left">
                                      <div className="text-[9px] text-primary uppercase font-black mb-2 flex items-center gap-1.5">
                                        <Info size={10} />
                                        Setup Requirement
                                      </div>
                                      <p className="text-[10px] leading-relaxed mb-3 text-muted-foreground">
                                        Add this Redirect URL to your{' '}
                                        <a
                                          href="https://anilist.co/settings/developer"
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-primary hover:underline font-bold"
                                        >
                                          AniList Developer Settings
                                        </a>:
                                      </p>
                                      <div className="flex items-center gap-2">
                                        <code className="flex-1 p-2 bg-muted/50 border border-border rounded-lg text-[10px] font-mono truncate">
                                          {window.location.origin}/oauth/callback
                                        </code>
                                        <button
                                          onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/oauth/callback`);
                                          }}
                                          className="p-2 hover:bg-muted rounded-lg text-primary transition-colors"
                                          title="Copy URL"
                                        >
                                          <History size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Surface>
                      )}

                      {/* Settings/Advanced Section */}
                      {(connected || showAdvanced[provider.id]) && (
                        <div className="pt-6 border-t border-border/20">
                          <div className="flex items-center gap-4 mb-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Synchronization Rules</h4>
                            <div className="h-px flex-1 bg-border/20" />
                          </div>

                          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-3">
                              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                <Activity size={12} className="text-primary" />
                                Conflict Resolution
                              </label>
                              <div className="grid grid-cols-1 gap-2">
                                {conflictModeOptions.map((o) => (
                                    <button
                                        key={o.value}
                                        onClick={async () => {
                                          const nextConflictMode = o.value;
                                          setDrafts(prev => ({ ...prev, [provider.id]: { ...prev[provider.id], conflictMode: nextConflictMode } }));
                                          if (connected && user) {
                                            try {
                                              await updateConnectionPolicy(user.id, provider.id, { conflictMode: nextConflictMode });
                                              void hydrate();
                                            } catch (err) {
                                              setError('Failed to update conflict policy.');
                                            }
                                          }
                                        }}
                                        className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
                                            drafts[provider.id].conflictMode === o.value 
                                            ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20' 
                                            : 'bg-background border-border/40 hover:border-border/80'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-foreground">{o.label}</span>
                                            {drafts[provider.id].conflictMode === o.value && <CheckCircle2 size={12} className="text-primary" />}
                                        </div>
                                        <span className="text-[9px] text-muted-foreground mt-1">{o.helper}</span>
                                    </button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                <RefreshCw size={12} className="text-primary" />
                                Automation Mode
                              </label>
                              <div className="space-y-2">
                                <div className="flex rounded-xl bg-muted/40 p-1 border border-border/20">
                                  {syncModeOptions.map((option) => (
                                    <button
                                      key={option.value}
                                      onClick={async () => {
                                        const nextSyncMode = option.value;
                                        setDrafts((prev) => ({
                                          ...prev,
                                          [provider.id]: { ...prev[provider.id], syncMode: nextSyncMode },
                                        }));
                                        if (connected && user) {
                                          try {
                                            await updateConnectionPolicy(user.id, provider.id, { syncMode: nextSyncMode });
                                            void hydrate();
                                          } catch (err) {
                                            setError('Failed to update automation mode.');
                                          }
                                        }
                                      }}
                                      className={`flex-1 rounded-lg py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                                        drafts[provider.id].syncMode === option.value
                                          ? 'bg-background text-primary shadow-sm border border-border/20'
                                          : 'text-muted-foreground hover:text-foreground'
                                      }`}
                                    >
                                      {option.label}
                                    </button>
                                  ))}
                                </div>
                                <p className="text-[10px] text-muted-foreground px-1 leading-relaxed italic">
                                    {drafts[provider.id].syncMode === 'manual' && 'Sync must be triggered manually from the panel above.'}
                                    {drafts[provider.id].syncMode === 'import-only' && 'Automatically import new entries from the provider.'}
                                    {drafts[provider.id].syncMode === 'bidirectional' && 'Automatically synchronize changes both ways.'}
                                </p>
                              </div>

                              <div className="pt-4 space-y-4">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                    <Info size={12} className="text-primary" />
                                    Account Identity
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <span className="text-[8px] font-bold text-muted-foreground uppercase ml-1">Provider Username</span>
                                        <input
                                            type="text"
                                            value={drafts[provider.id].username}
                                            onChange={(e) => setDrafts((prev) => ({ ...prev, [provider.id]: { ...prev[provider.id], username: e.target.value } }))}
                                            className="h-10 w-full rounded-lg border border-border/60 bg-background/50 px-3 text-[11px] focus:border-primary/50 focus:outline-none transition-all shadow-inner"
                                            placeholder="Username"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <span className="text-[8px] font-bold text-muted-foreground uppercase ml-1">Access Token</span>
                                        <input
                                            type="password"
                                            value={drafts[provider.id].accessToken}
                                            onChange={(e) => setDrafts((prev) => ({ ...prev, [provider.id]: { ...prev[provider.id], accessToken: e.target.value } }))}
                                            className="h-10 w-full rounded-lg border border-border/60 bg-background/50 px-3 text-[11px] focus:border-primary/50 focus:outline-none transition-all font-mono shadow-inner"
                                            placeholder="Secret Token"
                                        />
                                    </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/20">
                            {connected ? (
                              <button
                                onClick={() => void handleDisconnect(provider.id)}
                                className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-500/70 hover:text-red-500 transition-all active:scale-95"
                                aria-label="Disconnect account"
                              >
                                <Unlink2 size={14} className="group-hover:rotate-12 transition-transform" />
                                Sever Connection
                              </button>
                            ) : (
                              <div className="text-[9px] font-bold text-muted-foreground uppercase italic flex items-center gap-2">
                                <Info size={12} />
                                Verify details to establish link
                              </div>
                            )}
                            <Button
                              onClick={async () => {
                                if (!drafts[provider.id].accessToken.trim()) {
                                  setError('Token is required for manual connection.');
                                  return;
                                }
                                await connectProvider(provider.id, drafts[provider.id]);
                              }}
                              disabled={busy !== null}
                              variant="primary"
                              className="px-8 shadow-md"
                              aria-label="Save connection"
                            >
                              {busy?.startsWith('save') ? (
                                <RefreshCw size={14} className="animate-spin mr-2" />
                              ) : (
                                <CheckCircle2 size={14} className="mr-2" />
                              )}
                              Commit Changes
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Surface>
          );
        })}
      </div>

      {/* SYNC PROGRESS DASHBOARD */}
      <AnimatePresence>
        {jobs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pt-6">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-border/20" />
              <div className="flex items-center gap-3 px-4">
                <Activity size={14} className="text-primary" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground">Active Transmissions</h3>
              </div>
              <div className="h-px flex-1 bg-border/20" />
            </div>

            {/* ACTIVE JOBS */}
            <div className="space-y-4">
              {jobs
                .filter((j) => isActiveStatus(j.status) || isConflict(j.status))
                .map((job) => {
                  const processed = job.items_processed ?? 0;
                  const total = job.items_total ?? 0;
                  const pct = total > 0 ? Math.round((processed / total) * 100) : null;
                  const phase = isConflict(job.status)
                    ? 'Awaiting Resolution'
                    : job.status.toUpperCase() === 'RUNNING'
                    ? 'In Progress'
                    : 'Awaiting Thread';
                  const phaseColor = isConflict(job.status) ? 'text-amber-500' : 'text-primary';

                  return (
                    <Surface
                      key={job.id}
                      variant="paper"
                      withPadding={false}
                      className="overflow-hidden border-primary/20 bg-gradient-to-br from-background via-background to-primary/5"
                    >
                      <div className="p-6 space-y-6">
                        <div className="flex items-start justify-between">
                          <div className="flex gap-4 text-left">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
                              <Loader2
                                size={20}
                                className={`text-primary ${isActiveStatus(job.status) ? 'animate-spin' : ''}`}
                              />
                            </div>
                            <div>
                              <p className="text-[12px] font-black uppercase tracking-[0.15em] text-foreground">
                                {job.provider.toUpperCase()} <span className="text-muted-foreground opacity-40 mx-2">/</span> {job.job_type?.replace(/_/g, ' ') ?? job.direction ?? 'Sync'}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${phaseColor}`}>
                                    {phase}
                                </span>
                                <span className="h-1 w-1 rounded-full bg-border" />
                                <span className="text-[10px] text-muted-foreground font-mono">
                                    {formatElapsed(job.started_at || job.created_at)} elapsed
                                </span>
                              </div>
                            </div>
                          </div>
                          {isActiveStatus(job.status) && (
                            <button
                              onClick={() => void handleCancelJob(job.id)}
                              disabled={cancellingJobId === job.id}
                              className="text-[10px] font-black uppercase tracking-widest text-red-500/70 hover:text-red-500 transition-colors bg-red-500/5 px-4 py-2 rounded-full border border-red-500/10 active:scale-95 disabled:opacity-50"
                            >
                              {cancellingJobId === job.id ? 'Terminating...' : 'Cancel Task'}
                            </button>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-end">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Progression</span>
                                <p className="text-xs font-mono font-bold text-foreground">
                                    {processed.toLocaleString()}
                                    {total > 0 && <span className="text-muted-foreground opacity-50"> / {total.toLocaleString()}</span>}
                                    <span className="text-muted-foreground text-[10px] ml-2 font-sans font-medium uppercase tracking-tighter">Entries Processed</span>
                                </p>
                            </div>
                            {pct !== null && (
                              <span className="text-lg font-serif italic text-primary">{pct}%</span>
                            )}
                          </div>
                          <div className="w-full h-3 bg-muted/60 rounded-full overflow-hidden p-0.5 border border-border/20 shadow-inner">
                            {pct !== null ? (
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                className="h-full bg-gradient-to-r from-primary via-primary to-primary rounded-full shadow-lg shadow-primary/20"
                              />
                            ) : (
                              <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary/50 to-transparent rounded-full animate-[shimmer_2s_infinite]" />
                            )}
                          </div>
                        </div>
                      </div>
                    </Surface>
                  );
                })}
            </div>

            {/* HISTORY LIST */}
            {jobs.filter((j) => !isActiveStatus(j.status)).length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-border/10" />
                  <div className="flex items-center gap-3 px-4">
                    <History size={13} className="text-muted-foreground opacity-50" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Historical Trace</span>
                  </div>
                  <div className="h-px flex-1 bg-border/10" />
                </div>

                <div className="space-y-2">
                  {jobs
                    .filter((j) => !isActiveStatus(j.status))
                    .slice(0, 8)
                    .map((job) => {
                      const isOk = ['COMPLETED', 'completed'].includes(job.status);
                      const isErr = ['FAILED', 'failed', 'RETRYABLE_FAILURE'].includes(job.status);

                      return (
                        <div
                          key={job.id}
                          className="group grid grid-cols-[auto_1fr_auto] gap-6 px-6 py-4 items-center bg-background/40 hover:bg-muted/30 border border-border/20 rounded-2xl transition-all hover:translate-x-1"
                        >
                          <div className={`w-2 h-10 rounded-full ${isOk ? 'bg-primary/30' : isErr ? 'bg-red-500/30' : 'bg-amber-500/30'}`} />
                          
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <span className="text-[11px] font-black uppercase tracking-[0.1em] text-foreground">
                                    {job.provider} <span className="text-muted-foreground opacity-30 px-1">•</span> {job.job_type?.replace(/_/g, ' ') ?? job.direction ?? 'Sync'}
                                </span>
                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                                    isOk ? 'bg-primary/5 text-primary border-primary/20' : 
                                    isErr ? 'bg-red-500/5 text-red-500 border-red-500/20' : 
                                    'bg-amber-500/5 text-amber-500 border-amber-500/20'
                                }`}>
                                    {isOk ? 'Success' : isErr ? 'Failure' : 'Conflict'}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-medium">
                                <span className="flex items-center gap-1">
                                    <CloudDownload size={10} />
                                    {job.items_processed ?? 0} items
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock size={10} />
                                    {formatDateTime(job.finished_at || job.created_at)}
                                </span>
                            </div>
                          </div>

                          <div className="text-right">
                             <ChevronDown size={14} className="text-muted-foreground opacity-20 group-hover:opacity-100 transition-opacity -rotate-90" />
                          </div>
                        </div>
                      );
                    })}
                </div>
                
                <button 
                    onClick={() => void pollJobs()}
                    className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2 group"
                >
                    <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-700" />
                    Refresh Activity Log
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Surface>
  );
}
