# Cloud Architecture Phases 3-8: File Structure & Exports

## Overview

Complete sync system implementation for offline-first cloud architecture. All phases (3-8) implemented and ready for Supabase integration.

## File Structure

```
src/
├── lib/
│   └── sync/                          # PHASE 3-8: Sync System
│       ├── states.ts                  # PHASE 4.1: Sync state definitions
│       ├── conflict.ts                # PHASE 4.4: Conflict resolution (v1: last-write-wins)
│       ├── engine.ts                  # PHASE 4.2,4.3,4.5: Upload/Download/Sync orchestration
│       ├── migration.ts               # PHASE 5: Initial migration (first login batch upload)
│       ├── index.ts                   # PHASE 7: Backup/Restore (force upload/download)
│       ├── offline.ts                 # PHASE 8: Offline queue
│       └── all.ts                     # Convenience re-exports
│
├── context/
│   └── AuthContext.tsx                # PHASE 3: Authentication context & useState
│
└── pages/
    └── Login.tsx                      # PHASE 3: Login page UI
```

## Module Exports & API

### 1. Sync States (`src/lib/sync/states.ts`)

**Exports:**

```typescript
export enum SyncState {
    LOCAL, SYNCED, PENDING_UPLOAD, PENDING_DOWNLOAD, CONFLICT, SYNCING, ERROR
}

export interface SyncMetadata {
    state: SyncState;
    localUpdatedAt: number;
    cloudUpdatedAt?: number;
    lastSyncAt?: number;
    error?: string;
    conflict?: {...};
}

export function needsSync(state: SyncState): boolean
export function isSynced(state: SyncState): boolean
export function hasConflict(state: SyncState): boolean
export function transitionState(currentState, action): SyncState
export function getSyncStatusLabel(state: SyncState): string
```

**Purpose:** Define all 7 sync states and provide state machine transitions

**When to use:**

- Track record sync status
- Query state (is synced? needs sync?)
- Prevent invalid state transitions

---

### 2. Conflict Resolution (`src/lib/sync/conflict.ts`)

**Exports:**

```typescript
export const lastWriteWinsStrategy: ConflictResolutionStrategy;

export function resolveConflict(
    local: any,
    cloud: any,
    strategy?: ConflictResolutionStrategy,
): { winner: any; loser: any; strategy: string };

export function detectConflict(local: any, cloud: any, base?: any): boolean;

export function getConflictDetails(
    local: any,
    cloud: any,
): {
    localVersion: any;
    cloudVersion: any;
    isLocalNewer: boolean | null;
    recommendation: "local" | "cloud";
};

export function canThreeWayMerge(conflict: MergeConflict): boolean;
export function threeWayMerge(conflict: MergeConflict): any;
```

**Purpose:** Resolve conflicts when both local and cloud changed

**v1 Strategy:** Last-write-wins (by updatedAt timestamp)

**When to use:**

- After downloading cloud changes
- When both sides have modifications
- To determine which version to keep

---

### 3. Sync Engine (`src/lib/sync/engine.ts`)

**Exports:**

```typescript
export interface SyncEvent {
    type: "upload_start" | "upload_complete" | "download_start" | "download_complete" | "conflict" | "error";
    itemId: string;
    state?: SyncState;
    error?: string;
    timestamp: number;
}

export interface SyncStats {
    itemsUploaded: number;
    itemsDownloaded: number;
    conflicts: number;
    errors: number;
    lastSyncAt: number;
}

export function getSyncEngine(): SyncEngine

// SyncEngine methods:
subscribe(listener: (event: SyncEvent) => void): () => void
async uploadItem(itemId: string, itemData: any): Promise<void>
async downloadUpdates(userId: string): Promise<void>
getStats(): SyncStats
isOnlineNow(): boolean
async forceSyncAll(): Promise<void>
```

**Purpose:** Core sync orchestration - upload/download flows

**Features:**

- PHASE 4.2: Upload flow (queue + background push)
- PHASE 4.3: Download flow (merge + conflict detection)
- PHASE 4.5: Never blocks UI (setTimeout for async)

**When to use:**

- Mark item for upload: `await engine.uploadItem(itemId, data)`
- Pull cloud changes: `await engine.downloadUpdates(userId)` (call on login)
- Subscribe to events: `engine.subscribe(event => {...})`
- Get stats: `engine.getStats()`

---

### 4. Initial Migration (`src/lib/sync/migration.ts`)

**Exports:**

```typescript
export interface MigrationStatus {
    isFirstLogin: boolean;
    itemsToMigrate: number;
    itemsMigrated: number;
    inProgress: boolean;
    completed: boolean;
    error?: string;
}

export function getMigrationManager(): MigrationManager

// MigrationManager methods:
async checkFirstLogin(userId: string): Promise<boolean>
async getItemsToMigrate(userId: string): Promise<number>
async migrateVaultToCloud(userId: string, onProgress?: (current, total) => void): Promise<void>
getStatus(): MigrationStatus
resetMigration(userId: string): void
```

**Purpose:** PHASE 5 - Batch upload local vault on first login

**Workflow:**

1. User logs in
2. Check if first login: `const isFirst = await migration.checkFirstLogin(userId)`
3. If first login, show dialog: "Upload your local vault to cloud?"
4. Batch upload: `await migration.migrateVaultToCloud(userId)`
5. Mark complete in localStorage

**When to use:**

- After successful login to check if migration needed
- Show progress UI during batch upload
- Enable multi-device experience from day 1

---

### 5. Backup & Restore (`src/lib/sync/index.ts`)

**Exports:**

```typescript
export interface BackupRestoreStatus {
    type: "backup" | "restore" | null;
    inProgress: boolean;
    itemsProcessed: number;
    totalItems: number;
    completed: boolean;
    error?: string;
}

export function getBackupRestoreManager(): BackupRestoreManager

// BackupRestoreManager methods:
async forceDownloadCloudCopy(userId: string, onProgress?: (current, total) => void): Promise<void>
async forceUploadLocalCopy(userId: string, onProgress?: (current, total) => void): Promise<void>
async exportLocalVault(): Promise<string>
async importLocalVault(jsonData: string): Promise<number>
getStatus(): BackupRestoreStatus
cancel(): void
```

**Purpose:** PHASE 7 - User-initiated backup/restore operations

**Use Cases:**

- `forceDownloadCloudCopy()` - "Sync to this device" / "Get latest from cloud"
- `forceUploadLocalCopy()` - "Upload my data" / "Recover from cloud issues"
- `exportLocalVault()` - Manual backup to disk
- `importLocalVault()` - Restore from manual backup

**When to use:**

- Add buttons in Settings: "Force Download", "Force Upload"
- Manual backup/restore features
- Data recovery scenarios

---

### 6. Offline Queue (`src/lib/sync/offline.ts`)

**Exports:**

```typescript
export interface QueuedChange {
    id: string;
    itemId: string;
    type: "create" | "update" | "delete";
    data: any;
    timestamp: number;
    synced: boolean;
}

export interface OfflineQueueStatus {
    isOnline: boolean;
    pendingChanges: number;
    failedChanges: number;
    lastSyncAttempt?: number;
}

export function getOfflineQueueManager(): OfflineQueueManager

// OfflineQueueManager methods:
async queueChange(itemId: string, type: "create"|"update"|"delete", data: any): Promise<void>
getStatus(): OfflineQueueStatus
getPendingChanges(): QueuedChange[]
clearQueue(): void
```

**Purpose:** PHASE 8 - Keep working offline, sync when reconnected

**Workflow:**

1. Internet down? Changes auto-queue to localStorage
2. User continues editing (everything works locally)
3. Internet back? Auto-retry sync
4. Zero data loss

**Features:**

- Automatic offline detection (window.onOnline/onOffline)
- Persistent queue (localStorage backup)
- Retry with backoff (5 sec interval)
- Auto-sync on reconnect

**When to use:**

- Already auto-used in sync flow
- Manual trigger: `await queue.queueChange(itemId, "update", data)`
- Check status: `queue.getStatus()`

---

### 7. Auth Context (`src/context/AuthContext.tsx`)

**Exports:**

```typescript
export interface AuthUser {
    id: string;
    email: string;
    displayName?: string;
    avatar?: string;
    accessToken: string;
}

export interface AuthContextValue {
    user: AuthUser | null;
    loading: boolean;
    error: string | null;
    isAuthenticated: boolean;
    login(email: string, password: string): Promise<void>;
    loginWithOAuth(provider: "google" | "github"): Promise<void>;
    logout(): Promise<void>;
}

export function useAuth(): AuthContextValue;
export function AuthProvider({ children }): React.ReactNode;
```

**Purpose:** PHASE 3 - Manage authentication state

**Features:**

- Email/password login (mock + TODO for Supabase)
- OAuth stubs (ready for integration)
- userId storage in localStorage
- Auto-recovery from stored session

**When to use:**

- In components: `const { user, login, logout } = useAuth()`
- Login flow: `await login(email, password)`
- Check auth: `if (user) { ... }`

---

### 8. Login Page (`src/pages/Login.tsx`)

**Purpose:** PHASE 3 - UI for authentication

**Features:**

- Email/password form
- Google & GitHub OAuth buttons
- Error message display
- Loading states
- Offline mode tip
- Redirect to home on success

---

### 9. Convenience Exports (`src/lib/sync/all.ts`)

**Purpose:** One-line imports for all sync modules

```typescript
import {
    SyncState,
    getSyncEngine,
    resolveConflict,
    getMigrationManager,
    getBackupRestoreManager,
    getOfflineQueueManager,
} from "@/lib/sync/all";
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        User Actions                          │
│                   (Edit, Login, Sync)                        │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
         ▼           ▼           ▼
    ┌────────┐ ┌──────────┐ ┌─────────────┐
    │ LOGIN  │ │   EDIT   │ │ SYNC BUTTON │
    └────┬───┘ └────┬─────┘ └────┬────────┘
         │          │            │
         ▼          ▼            ▼
    ┌─────────────────────────────────────────┐
    │      AuthContext + useAuth()             │
    │   (PHASE 3: Authentication)              │
    └────────────────────┬────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐   ┌──────────────┐
    │Local     │   │Migration │   │Sync Engine   │
    │Storage   │   │Manager   │   │              │
    │(IndexDB) │   │(PHASE 5) │   │(PHASE 4.2-5) │
    └────┬─────┘   └─────┬────┘   └────┬─────────┘
         │               │             │
         └───────────────┼─────────────┘
                         │
                ┌────────▼────────┐
                │  Offline Queue  │
                │   (PHASE 8)     │
                └────────┬────────┘
                         │
              ┌──────────▼──────────┐
              │  Online/Offline?    │
              └──────────┬──────────┘
                    YES /│\ NO
                   /     │     \
        ┌─────────┘      │      └──────┐
        │ Online         │              │ Offline
        ▼                ▼              ▼
    ┌──────────────┐ ┌──────────┐ ┌──────────────┐
    │Conflict      │ │ Queued   │ │ Wait for     │
    │Resolution    │ │ Changes  │ │ Connection  │
    │(PHASE 4.4)   │ │          │ │              │
    │              │ └─────┬────┘ └──────┬───────┘
    │ Last-Write   │       │             │
    │ Wins         │       │    Reconnect?
    └──────┬───────┘       │       │
           │               │       ▼
           └───────────────┼──►Auto-Retry
                           │
                ┌──────────▼──────────┐
                │   Cloud Storage     │
                │  (CloudProvider)    │
                │  (PHASE 1: Stub)    │
                │  TODO: Supabase     │
                └─────────────────────┘
```

---

## Integration Checklist

- [ ] Wire AuthContext to Supabase client
- [ ] Implement CloudStorageProvider methods
- [ ] Add login route protection
- [ ] Add migration dialog on first login
- [ ] Add sync status indicator to UI
- [ ] Add conflict resolution UI
- [ ] Add backup/restore buttons to Settings
- [ ] Add offline indicator
- [ ] Monitor sync events and log
- [ ] Test offline scenarios
- [ ] Test multi-device sync
- [ ] Deploy to production

---

## Key Principles

1. **Local Primary, Cloud Secondary**
    - App works 100% offline
    - Cloud is sync layer only
    - Never blocks on cloud operations

2. **Never Block UI**
    - All sync via setTimeout(..., 0)
    - Background processing
    - Event-driven updates

3. **Conflict Resolution (v1)**
    - Last-write-wins by timestamp
    - Simple, predictable
    - Stores metadata for future UI

4. **Queue-Based Offline**
    - Queue to localStorage
    - Auto-retry on reconnect
    - Zero data loss

5. **Event-Driven Architecture**
    - Components subscribe to sync events
    - No polling
    - Real-time UI updates

---

## Next: Supabase Integration

See CLOUD_ARCHITECTURE_PHASES_3_8.md for next steps on integrating Supabase.
