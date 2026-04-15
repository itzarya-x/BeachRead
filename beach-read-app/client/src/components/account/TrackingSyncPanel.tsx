import { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../../context/auth-context';
import { useData } from '../../context/DataContext';
import { publicApiClient } from '../../lib/apiClient';
import {
  createDefaultDraft,
  createSyncJob,
  disconnectIntegration,
  finalizeSyncJob,
  loadSyncState,
  PROVIDERS,
  saveIntegration,
  syncLocalToProvider,
  syncProviderToLocal,
  touchIntegration,
  verifyProviderAccessToken,
} from '../../lib/trackingSync';
import { MissingSupabaseFeatureError } from '../../lib/supabaseSchema';
import type {
  ConflictMode,
  IntegrationRow,
  ProviderId,
  SyncDirection,
  SyncDraft,
  SyncJobRow,
} from '../../lib/trackingSync';

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

type MalRefreshResponse = {
  accessToken: string;
  refreshToken?: string | null;
  tokenExpiresAt?: string | null;
};

function shouldAttemptMalRefresh(integration: IntegrationRow) {
  if (integration.provider !== 'mal') return false;
  if (!integration.refresh_token) return false;
  if (!integration.token_expires_at) return false;

  const expiryTime = new Date(integration.token_expires_at).getTime();
  if (!Number.isFinite(expiryTime)) return false;
  return expiryTime <= Date.now() + 60_000;
}

function looksLikeAuthError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes('rejected this token')
    || message.includes('session expired')
    || message.includes('status 401')
    || message.includes('denied this request');
}

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
  const { user, updateUser } = useAuth();
  const { refreshLibrary } = useData();
  const [integrations, setIntegrations] = useState<IntegrationRow[]>([]);
  const [jobs, setJobs] = useState<SyncJobRow[]>([]);
  const [drafts, setDrafts] = useState<Record<ProviderId, SyncDraft>>(createDefaultDraft());
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [oauthConfig, setOauthConfig] = useState<OAuthConfig>({ anilist: false, mal: false });
  const [expandedProvider, setExpandedProvider] = useState<ProviderId | null>('anilist');
  const [showAdvanced, setShowAdvanced] = useState<Record<ProviderId, boolean>>({ anilist: false, mal: false });

  const integrationsByProvider = useMemo(() => {
    return Object.fromEntries(integrations.map((item) => [item.provider, item])) as Record<ProviderId, IntegrationRow>;
  }, [integrations]);

  const hydrate = async () => {
    if (!user) return;
    try {
      const [state, oauth] = await Promise.all([
        loadSyncState(user.id),
        publicApiClient.get<OAuthConfig>('/sync/config').catch((err) => {
          console.error('[SyncPanel] Failed to fetch OAuth config:', err);
          return { anilist: false, mal: false };
        })
      ]);
      setIntegrations(state.integrations);
      setJobs(state.jobs);
      setOauthConfig(oauth);
      setDrafts({
        anilist: draftFromIntegration(state.integrations.find((item) => item.provider === 'anilist')),
        mal: draftFromIntegration(state.integrations.find((item) => item.provider === 'mal')),
      });
    } catch (err) {
      if (err instanceof MissingSupabaseFeatureError) {
        setError(err.message);
      }
    }
  };

  useEffect(() => { void hydrate(); }, [user?.id]);

  useEffect(() => {
    const apiOrigin = new URL(import.meta.env.VITE_API_URL?.trim() || 'http://localhost:3001/api').origin;

    const onMessage = (event: MessageEvent<OAuthMessage>) => {
      if (event.origin !== window.location.origin && event.origin !== apiOrigin) return;

      const payload = event.data;
      if (!payload || payload.source !== 'beachread-oauth' || !payload.provider) return;

      if (!payload.ok || !payload.accessToken) {
        setError(payload.error || 'Provider OAuth failed.');
        return;
      }

      const provider = payload.provider;
      const nextDraft = {
        ...drafts[provider],
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken || null,
        tokenExpiresAt: payload.tokenExpiresAt || null,
      };

      void connectProvider(provider, nextDraft);
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [drafts, user]);

  const connectProvider = async (provider: ProviderId, draft: SyncDraft) => {
    if (!user) return;
    setBusy(`save:${provider}`);
    setMessage(null);
    setError(null);

    try {
      const identity = await verifyProviderAccessToken(provider, draft.accessToken.trim());
      await saveIntegration(user.id, provider, {
        ...draft,
        id: identity.id,
        username: identity.username,
        accessToken: draft.accessToken.trim(),
      });

      if (provider === 'anilist' && Array.isArray(identity.favoriteCharacters)) {
        await updateUser({
          favoriteCharacters: identity.favoriteCharacters,
        });
      }

      await hydrate();
      setMessage(`${provider.toUpperCase()} connected as ${identity.username}.`);
    } catch (err) {
      setError(toErrorMessage(err, 'Failed to connect'));
    } finally {
      setBusy(null);
    }
  };

  const runSyncAction = async (provider: ProviderId, direction: SyncDirection | 'refresh') => {
    if (!user) return;
    const integration = integrationsByProvider[provider];
    if (!integration?.access_token) return;

    setBusy(`sync:${provider}:${direction}`);
    setMessage(null);
    setError(null);

    const actualDirection: SyncDirection = direction === 'refresh' ? 'pull' : direction;
    const jobTypeMap: Record<string, string> = {
        'import': 'INITIAL_IMPORT',
        'pull': 'INCREMENTAL_PULL',
        'push': 'INCREMENTAL_PUSH'
    };

    try {
      await publicApiClient.post(`/sync/${provider}/trigger`, {
        jobType: jobTypeMap[actualDirection] || 'INCREMENTAL_PULL',
        forceRefresh: direction === 'refresh'
      });

      setMessage(`${provider.toUpperCase()} sync job queued. This will run in the background.`);
      
      // Auto-refresh state after a short delay to show the queued job
      setTimeout(() => { void hydrate(); }, 1500);
    } catch (err) {
      const message = toErrorMessage(err, 'Failed to trigger sync');
      setError(message);
    } finally {
      setBusy(null);
    }
  };

  const handleOAuthConnect = (provider: ProviderId) => {
    const apiBase = import.meta.env.VITE_API_URL?.trim() || 'http://localhost:3001/api';
    const url = new URL(`${apiBase}/oauth/${provider}/start`);
    url.searchParams.set('origin', window.location.origin);
    window.open(url.toString(), `${provider}-oauth`, 'width=640,height=800');
  };

  const handleDisconnect = async (provider: ProviderId) => {
    if (!user) return;
    setBusy(`disconnect:${provider}`);
    try {
      await disconnectIntegration(user.id, provider);
      await hydrate();
      setMessage(`${provider.toUpperCase()} disconnected.`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="space-y-6">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <RefreshCw size={20} className={busy ? 'animate-spin' : ''} />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Sync Settings</h2>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cloud provider integration</p>
          </div>
        </div>
        <button
          onClick={() => void hydrate()}
          disabled={busy !== null}
          className="flex h-9 items-center gap-2 rounded-lg border border-border/60 bg-background px-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw size={12} className={busy === 'refresh:state' ? 'animate-spin' : ''} />
          Sync State
        </button>
      </div>

      {(message || error) && (
        <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-[11px] font-bold ${error ? 'border-destructive/20 bg-destructive/5 text-destructive' : 'border-primary/20 bg-primary/5 text-primary'}`}>
          {error ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
          {error || message}
        </div>
      )}

      {/* Provider Cards */}
      <div className="space-y-4">
        {PROVIDERS.map((provider) => {
          const integration = integrationsByProvider[provider.id];
          const connected = integration?.status === 'connected';
          const health = tokenHealth(integration);
          const isExpanded = expandedProvider === provider.id;

          return (
            <div key={provider.id} className={`overflow-hidden rounded-2xl border transition-all duration-300 ${isExpanded ? 'border-primary/30 bg-muted/10 shadow-lg' : 'border-border/40 bg-background/50 hover:border-border/80'}`}>
              {/* Card Header (Clickable) */}
              <button 
                onClick={() => setExpandedProvider(isExpanded ? null : provider.id)}
                className="flex w-full items-center justify-between p-5 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-colors ${connected ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-muted border-border/40 text-muted-foreground'}`}>
                    <Link2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">{provider.label}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[9px] font-bold uppercase tracking-widest ${connected ? 'text-primary' : 'text-muted-foreground'}`}>
                        {health.label}
                      </span>
                      {integration?.last_sync_at && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-border" />
                          <span className="text-[9px] text-muted-foreground">Synced {formatDateTime(integration.last_sync_at)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-border/20 p-5 space-y-6 animate-in slide-in-from-top-2 duration-300">
                  {/* Summary row */}
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Username</span>
                      <p className="text-xs font-bold text-foreground">{integration?.username || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Sync Mode</span>
                      <p className="text-xs font-bold text-foreground">{syncModeOptions.find(o => o.value === integration?.sync_mode)?.label || 'Manual'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Conflict Rule</span>
                      <p className="text-xs font-bold text-foreground">{conflictModeOptions.find(o => o.value === integration?.conflict_mode)?.label || 'Newest wins'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Health</span>
                      <p className={`text-xs font-bold ${integration?.last_error ? 'text-destructive' : 'text-primary'}`}>{integration?.last_error ? 'Action Required' : 'Operational'}</p>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-primary">Execute Sync</h4>
                      <div className="h-px flex-1 bg-primary/10" />
                    </div>
                    
                    {!connected ? (
                      <div className="flex flex-col items-center justify-center py-8 px-4 rounded-xl bg-muted/20 border border-dashed border-border/60 text-center">
                        <Info size={24} className="text-muted-foreground mb-3 opacity-50" />
                        <p className="text-xs text-muted-foreground mb-6 max-w-[280px]">Link your external account to enable automated library synchronization.</p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                          {oauthConfig[provider.id] ? (
                            <button
                              onClick={() => handleOAuthConnect(provider.id)}
                              className="flex-1 px-6 py-3 bg-[#02A9FF] text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:opacity-90 transition-all shadow-lg shadow-[#02A9FF]/20 flex items-center justify-center gap-2"
                            >
                              <Link2 size={14} />
                              Login with {provider.label}
                            </button>
                          ) : (
                            <div className="flex-1 px-4 py-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center">
                              OAuth Unavailable
                            </div>
                          )}
                          
                          <button
                            onClick={() => setShowAdvanced(prev => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                            className={`flex-1 px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all border ${
                              showAdvanced[provider.id] 
                                ? 'bg-primary/10 border-primary text-primary' 
                                : 'bg-muted/50 border-border/60 text-foreground hover:bg-muted'
                            }`}
                          >
                            {showAdvanced[provider.id] ? 'Hide Manual' : 'Manual Token'}
                          </button>
                        </div>
                        
                        {!oauthConfig[provider.id] && (
                          <p className="text-[9px] text-muted-foreground mt-4 italic max-w-[250px]">
                            Server OAuth is not configured. Use a personal access token from {provider.label} settings.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {syncActions.map((action) => (
                          <button
                            key={action.direction}
                            onClick={() => void runSyncAction(provider.id, action.direction)}
                            disabled={busy !== null}
                            className="group flex flex-col gap-2 rounded-xl border border-border/40 bg-background p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50"
                          >
                            <div className="flex items-center justify-between">
                              <action.icon size={16} className="text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
                              <span className="text-[9px] font-black uppercase tracking-widest text-primary">Run</span>
                            </div>
                            <span className="text-[11px] font-bold text-foreground">{action.label}</span>
                            <span className="text-[9px] text-muted-foreground leading-relaxed">{action.helper}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Settings/Advanced Section */}
                  {(connected || showAdvanced[provider.id]) && (
                    <div className="pt-4 space-y-4 border-t border-border/10">
                      <div className="flex items-center gap-2">
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Authentication & Rules</h4>
                        <div className="h-px flex-1 bg-border/20" />
                      </div>
                      
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Username</label>
                          <input
                            type="text"
                            value={drafts[provider.id].username}
                            onChange={e => setDrafts(prev => ({ ...prev, [provider.id]: { ...prev[provider.id], username: e.target.value } }))}
                            className="h-[44px] w-full rounded-lg border border-border/60 bg-background px-3 text-xs focus:border-primary/50 focus:outline-none"
                            placeholder="Enter username (optional)"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Access Token</label>
                          <input
                            type="password"
                            value={drafts[provider.id].accessToken}
                            onChange={e => setDrafts(prev => ({ ...prev, [provider.id]: { ...prev[provider.id], accessToken: e.target.value } }))}
                            className="h-[44px] w-full rounded-lg border border-border/60 bg-background px-3 text-xs focus:border-primary/50 focus:outline-none"
                            placeholder="Paste OAuth token"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Conflict Resolution</label>
                          <select 
                            className="w-full h-[44px] bg-background border border-border/60 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary/50"
                            value={drafts[provider.id].conflictMode}
                            onChange={e => setDrafts(prev => ({ ...prev, [provider.id]: { ...prev[provider.id], conflictMode: e.target.value as ConflictMode } }))}
                          >
                            {conflictModeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Library Automation</label>
                          <div className="flex h-[44px] rounded-lg border border-border/60 bg-muted/20 p-1">
                            {syncModeOptions.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => setDrafts(prev => ({ ...prev, [provider.id]: { ...prev[provider.id], syncMode: option.value } }))}
                                className={`flex-1 rounded-md px-2 text-[9px] font-black uppercase tracking-widest transition-all ${
                                  drafts[provider.id].syncMode === option.value ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border/10">
                        {connected ? (
                          <button
                            onClick={() => void handleDisconnect(provider.id)}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-destructive hover:opacity-80 transition-opacity"
                          >
                            <Unlink2 size={12} />
                            Disconnect Account
                          </button>
                        ) : (
                          <div className="text-[9px] font-bold text-muted-foreground uppercase italic">Enter token to connect manually</div>
                        )}
                        <button
                          onClick={async () => {
                            if (!drafts[provider.id].accessToken.trim()) {
                              setError('Token is required for manual connection.');
                              return;
                            }
                            await connectProvider(provider.id, drafts[provider.id]);
                          }}
                          disabled={busy !== null}
                          className="px-6 py-2 bg-foreground text-background text-[10px] font-black uppercase tracking-widest rounded-lg hover:opacity-90 transition-all flex items-center gap-2"
                        >
                          {busy?.startsWith('save') ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                          Save Connection
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Compact History */}
      {jobs.filter(job => job.items_processed > 0 || job.status === 'failed').length > 0 && (
        <div className="pt-4 space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">Historical Trace</h3>
            <div className="h-px flex-1 bg-border/20" />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {jobs
              .filter(job => job.items_processed > 0 || job.status === 'failed')
              .slice(0, 6)
              .map((job) => (
              <div key={job.id} className="flex items-center justify-between rounded-xl border border-border/40 bg-background/40 p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase text-foreground truncate">{job.provider}</span>
                    <span className="text-[8px] font-bold text-muted-foreground uppercase opacity-50">{job.direction}</span>
                  </div>
                  <p className="text-[8px] text-muted-foreground mt-0.5">{formatDateTime(job.created_at)}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${job.status === 'completed' ? 'text-primary' : 'text-destructive'}`}>
                    {job.items_processed} items
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
