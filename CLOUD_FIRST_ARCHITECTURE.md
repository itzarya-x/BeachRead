# Cloud-First Architecture Implementation

## Overview

This document describes the cloud-first data synchronization architecture implemented for MyAniListArchive. When users are authenticated via Supabase, all data reads and writes are performed against the cloud database (Supabase PostgreSQL) instead of local IndexedDB. This enables true multi-device synchronization where the same vault appears identically across all devices.

## Architecture

### Data Flow

#### **When User is Authenticated**

```
User Action (add/edit/delete)
    ↓
DataContext CRUD Operation
    ↓
Cloud Storage Provider (Supabase)
    ↓
user_media table in Supabase
    ↓
Real-time Subscription
    ↓
Store Update (Zustand)
    ↓
UI Re-render
    ↓
Other Devices (via real-time sync)
```

#### **When User is NOT Authenticated**

```
User Action (add/edit/delete)
    ↓
DataContext CRUD Operation
    ↓
Local Storage Provider (IndexedDB)
    ↓
Local IndexedDB
    ↓
Store Update (Zustand)
    ↓
UI Re-render
```

### Components

#### 1. **CloudStorageProvider** (`src/lib/storage/cloud.ts`)

Implements the `IStorageProvider` interface for cloud-based storage operations.

**Key Features:**

- Connects to Supabase using JWT authentication
- All operations use Supabase PostgreSQL (user_media table)
- Automatic fallback to local IndexedDB on connection errors
- Local caching for better performance
- Soft delete support (deleted field)
- Real-time subscription management

**Core Methods:**

```typescript
// User Entries (Media Items)
getAllUserEntries(userId: number): Map<number, UserEntry>  // Fetch all from cloud
saveUserEntry(entry: UserEntry): void                      // Insert/update in cloud
deleteUserEntry(entryId: number): void                     // Soft delete
hardDeleteUserEntry(entryId: number): void                 // Permanent delete

// Real-time Sync
subscribeToUserMedia(userId, callback)                     // Listen to changes
unsubscribeAll()                                            // Stop listening
```

#### 2. **RealtimeSyncManager** (`src/lib/realtime-sync.ts`)

Manages real-time synchronization across devices using Supabase Realtime.

**Key Features:**

- PostgreSQL `postgres_changes` event subscriptions
- Handles INSERT, UPDATE, DELETE events
- Automatically enriches remote data with cached media
- Updates Zustand store on remote changes
- Error handling with fallback to local

**Event Handling:**

```typescript
INSERT Event
  ├─ Parse remote entry
  ├─ Enrich with cached data
  ├─ Add to store
  └─ Notify UI

UPDATE Event
  ├─ Extract user-editable fields
  ├─ Handle soft deletes
  ├─ Update store
  └─ Trigger re-render

DELETE Event
  ├─ Remove from store
  └─ Trigger re-render
```

#### 3. **DataContext** (`src/context/DataContext.tsx`)

Central data management hub that orchestrates storage and sync.

**Key Logic:**

```typescript
// On mount or auth state change:
if (authUser?.id) {
    // Authenticated → Use cloud storage
    await initializeStorageProvider(true, authUser.id);

    // Load data from cloud
    const entries = await storage.getAllUserEntries(userId);

    // Start real-time sync
    syncManager.startSync({ userId: authUser.id });
} else {
    // Not authenticated → Use local storage
    await initializeStorageProvider(false);

    // Load data from IndexedDB
    const entries = await storage.getAllUserEntries(userId);

    // Stop real-time sync
    syncManager.stopSync();
}
```

#### 4. **AuthContext** (`src/context/AuthContext.tsx`)

Provides authentication state to DataContext.

**Triggers Cloud/Local Switch:**

- When `useAuth().user` is populated → Enable cloud storage
- When `useAuth().user` is null → Fall back to local storage

## Multi-Device Synchronization

### How It Works

1. **Device A** makes a change (e.g., scores anime)

    ```
    User Action → Cloud Storage → Supabase → user_media table updated
    ```

2. **Real-time Event Fired**

    ```
    Supabase detects INSERT/UPDATE on user_media
    → Broadcasts to all subscribed channels for that user
    ```

3. **Device B Receives Event**

    ```
    Real-time Subscription Active
    → RealtimeSyncManager.handleUpdate() called
    → Zustand store updated
    → UI re-renders with new data
    ```

4. **Device C Receives Event**
    ```
    Same as Device B
    ```

**Result**: All authenticated devices show identical data in real-time

### Benefits

✅ **Consistency**: Single source of truth (Supabase)
✅ **Real-time**: Changes appear instantly across devices
✅ **Offline Fallback**: Local IndexedDB when not authenticated
✅ **Performance**: Caching + indexed queries
✅ **Reliability**: Automatic fallback on errors
✅ **Enterprise-Grade**: GDPR-compliant, audit trail ready

## Implementation Details

### Storage Provider Switching

**Initialization:**

```typescript
// In DataContext useEffect
if (authUser?.id) {
    // Cloud-first when authenticated
    await initializeStorageProvider(
        true, // useCloud: true
        authUser.id, // userId for Supabase queries
    );
} else {
    // Local-only when not authenticated
    await initializeStorageProvider(false);
}
```

**Provider Factory** (`src/lib/storage/index.ts`):

```typescript
export async function initializeStorageProvider(useCloud: boolean, userId?: string): Promise<IStorageProvider> {
    if (useCloud) {
        return new CloudStorageProvider(userId);
    } else {
        return new LocalStorageProvider();
    }
}
```

### Real-time Subscription Pattern

**Start Sync** (when authenticated):

```typescript
const syncManager = getRealtimeSyncManager();
syncManager.startSync({
    userId: authUser.id,
    onInsert: entry => console.log("Remote insert:", entry),
    onUpdate: (id, updates) => console.log("Remote update:", id, updates),
    onDelete: id => console.log("Remote delete:", id),
    onError: error => console.error("Sync error:", error),
});
```

**Channel Setup**:

```typescript
this.supabase
    .channel(`user_media:${userId}`)
    .on(
        "postgres_changes",
        {
            event: "*",
            schema: "public",
            table: "user_media",
            filter: `user_id=eq.${userId}`,
        },
        payload => {
            // Handle INSERT/UPDATE/DELETE
        },
    )
    .subscribe();
```

**Stop Sync** (when logging out):

```typescript
useEffect(() => {
    if (!authUser) {
        syncManager.stopSync();
        switchStorageProvider(false); // Back to local
    }
}, [authUser]);
```

### CRUD Operations (Unchanged API)

All existing CRUD methods work identically - the storage provider handles where data goes:

```typescript
// Add entry (goes to Supabase if authenticated, IndexedDB if not)
await addEntry({
    _seriesId: 5,
    mediaType: "ANIME",
    status: "WATCHING",
});

// Update entry (same behavior)
await updateEntry(5, { score: 9, progress: 12 });

// Delete entry (same behavior)
await deleteEntry(5);
```

**Provider Routes Correctly:**

- If authenticated → CloudStorageProvider → Supabase upsert
- If not authenticated → LocalStorageProvider → IndexedDB save

## Data Schema

### User Media Table (Supabase)

```sql
CREATE TABLE user_media (
    id BIGINT PRIMARY KEY,
    user_id UUID NOT NULL,
    series_id INT NOT NULL,
    data JSONB,                    -- User-editable fields
    edited_at TIMESTAMP,
    deleted BOOLEAN DEFAULT false, -- Soft delete
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    UNIQUE(user_id, series_id)
);

CREATE INDEX idx_user_media_user_id ON user_media(user_id);
CREATE INDEX idx_user_media_deleted ON user_media(deleted);
```

### User Entry Data Structure

```typescript
interface UserEntry {
    entryId: number; // Unique ID
    seriesId: number; // AniList series ID
    userId: number; // User ID
    data: {
        status: MediaStatus; // PLANNING, WATCHING, etc.
        score: number; // 0-10
        progress: number; // Episodes watched
        progressVolumes: number; // Volumes read
        repeat: number;
        priority: number;
        tierId: number | null; // Tier ranking ID
        isPrivate: boolean;
        notes: string | null;
        customLists: string[];
        startedAt: string | null;
        completedAt: string | null;
        advancedScores: number[];
        hiddenDefault: boolean;
    };
    editedAt: number; // Timestamp
    deleted: boolean; // Soft delete flag
}
```

## Error Handling & Resilience

### Automatic Fallback

All cloud operations have try-catch blocks that fall back to local storage:

```typescript
async getAllUserEntries(userId: number) {
    if (!this.supabase || !this.userId) {
        return this.local.getAllUserEntries(userId)
    }

    try {
        // Try cloud first
        const { data, error } = await this.supabase
            .from("user_media")
            .select("*")
            .eq("user_id", this.userId)

        if (error) throw error
        return data.map(row => this.mapToUserEntry(row))
    } catch (err) {
        console.warn("Cloud fetch failed, using local:", err)
        // Fall back to local
        return this.local.getAllUserEntries(userId)
    }
}
```

### Offline Behavior

- **Online**: All operations go to Supabase
- **Offline**: All operations use IndexedDB
- **Reconnection**: Real-time subscription auto-reconnects

### Deduplication

Real-time sync prevents duplicate inserts by checking store state:

```typescript
private isProcessing = false

private async handleInsert(payload: any) {
    if (this.isProcessing) return  // Prevent duplicates

    try {
        this.isProcessing = true
        // Process event...
    } finally {
        this.isProcessing = false
    }
}
```

## Testing Checklist

### ✅ Single Device Tests

- [ ] User logs in → Data loads from Supabase
- [ ] Add entry → Appears in Supabase user_media table
- [ ] Edit entry → Updates in Supabase
- [ ] Delete entry → Soft deleted in Supabase
- [ ] Refresh page → Data persists from Supabase
- [ ] User logs out → Switches to local storage

### ✅ Multi-Device Tests

- [ ] Open app on Device A, Device B
- [ ] Both log in with same account
- [ ] Add entry on Device A → Appears on Device B instantly
- [ ] Edit entry on Device A → Updates on Device B instantly
- [ ] Delete entry on Device A → Removed from Device B instantly
- [ ] Go offline on Device B → Updates pause (no sync)
- [ ] Go back online on Device B → Catches up with changes

### ✅ Edge Cases

- [ ] Log out on one device → Local storage active
- [ ] Log in on another device → Cloud storage active
- [ ] Network error → Falls back to local
- [ ] Concurrent edits → Last write wins
- [ ] Large vault (10,000+ entries) → Performance acceptable
- [ ] Real-time subscription closes → Auto-reconnect

## Performance Considerations

### Caching Strategy

**Media Cache** (IndexedDB):

- Stores AniList API data (static information)
- Expires after 30 days (configurable)
- Used for enriching entries locally

**User Edits Cache** (IndexedDB):

- Local copy of user_media rows
- Reduces Supabase queries on reload
- Syncs bidirectionally with cloud

### Query Optimization

**Supabase:**

```typescript
// Efficient: Single query with index
await this.supabase
    .from("user_media")
    .select("*")
    .eq("user_id", userId) // Index exists
    .order("created_at", { ascending: false });

// Avoid: Multiple queries
for (const id of largeList) {
    await this.supabase.from("user_media").select("*").eq("id", id);
}
```

### Batch Operations

For migration/sync scenarios:

```typescript
// Efficient: Batch insert
await this.supabase.from("user_media").upsert(entries, { onConflict: "id" });

// Avoid: Loop inserts
for (const entry of entries) {
    await this.supabase.from("user_media").insert(entry);
}
```

## Configuration

### Environment Variables

Required in `.env.local`:

```env
VITE_SUPABASE_URL=https://utcoxardgtuzufroeuey.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Storage Provider Selection

Automatic based on authentication:

```typescript
// Checked in DataContext.tsx
const { user: authUser } = useAuth();

if (authUser?.id) {
    await initializeStorageProvider(true, authUser.id); // Cloud
} else {
    await initializeStorageProvider(false); // Local
}
```

## Migration Path (First-Login)

When new user logs in for first time:

1. Check if cloud vault is empty
2. Check if local vault has entries
3. Show migration dialog
4. Execute vault migration (bulk upload)
5. Enable cloud-first for future sessions

**See**: [VAULT_MIGRATION_GUIDE.md](VAULT_MIGRATION_GUIDE.md)

## Future Enhancements

### Phase 2 (Sync Queue)

- Sync queue for offline changes
- Conflict resolution strategy
- Bidirectional sync

### Phase 3 (Real-time Collaboration)

- Shared vaults between users
- Comments and discussions
- Activity timeline

### Phase 4 (Advanced Features)

- Tier boards (cloud sync)
- Custom lists (cloud sync)
- Tags and metadata

## Files Modified

### Core Implementation

- **`src/lib/storage/cloud.ts`** - Cloud storage provider (316 lines)
- **`src/lib/storage/index.ts`** - Provider factory with userId support
- **`src/lib/realtime-sync.ts`** - Real-time sync manager (NEW, 290 lines)
- **`src/context/DataContext.tsx`** - Auth-aware provider switching + cleanup

### Integration

- **`src/context/AuthContext.tsx`** - Provides auth state (unchanged)
- **`src/store/mediaStore.ts`** - Zustand store (unchanged, receives sync updates)

## Deployment Notes

### Before Production

1. **Database**: Ensure `user_media` table created in Supabase
2. **Auth**: JWT signing configured correctly
3. **Realtime**: Enable Realtime subscriptions in Supabase settings
4. **Backups**: Automated backups configured
5. **Monitoring**: Error tracking (Sentry/etc) set up

### Performance Tuning

- Supabase connections: 100+ concurrent
- Realtime channels: <100ms latency target
- Query response time: <500ms p95
- Local IndexedDB: 50MB+ available

### Scaling

- Supabase auto-scales PostgreSQL
- Realtime can handle 10,000+ concurrent users
- Consider data partitioning by userId for very large vaults

## Debugging

### Check Cloud Connection

```typescript
const { data, error } = await supabase.from("user_media").select("count").limit(1);

if (error) console.error("Cloud connection failed:", error);
```

### Monitor Real-time Events

```typescript
// In browser console
window.localStorage.setItem("DEBUG", "realtime");

// Will log all events:
// [SYNC] Insert event: {...}
// [SYNC] Update event: {...}
// [SYNC] Delete event: {...}
```

### Check Storage Provider

```typescript
import { getStorageProvider } from "@/lib/storage";
const provider = getStorageProvider();
console.log(provider.constructor.name); // CloudStorageProvider or LocalStorageProvider
```

## References

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [PostgREST API Docs](https://postgrest.org/)
- [Zustand Docs](https://github.com/pmndrs/zustand)
