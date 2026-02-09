# 🚀 Cloud Sync UI — Quick Reference

**Date:** February 10, 2026  
**For:** Developers implementing sync backend  
**Goal:** Show how to wire UI to sync engine

---

## 📍 Component Locations

```
✅ Sidebar Footer:      SyncStatusIndicator (live, always visible)
✅ Page Top:            OfflineBanner (auto-shows when offline)
✅ Settings Page:       AccountSection, BackupStatus, Cloud Controls, DeviceList
✅ Modal Dialogs:       FirstLoginDialog, ConflictResolver (global, triggered by context)
```

---

## 🔌 Integration Checklist

### In SyncUIContext.tsx

Replace TODO subscriptions:

```typescript
// CURRENT (TODO):
useEffect(() => {
    // When sync engine emits events, update status
    // This is placeholder for future integration
}, []);

// IMPLEMENT:
useEffect(() => {
    const engine = getSyncEngine();

    engine.subscribe(event => {
        if (event.type === "sync.started") {
            updateSyncStatus("syncing");
        } else if (event.type === "sync.completed") {
            updateSyncStatus("synced");
            updateSyncStats({
                itemsUploaded: event.uploaded,
                itemsDownloaded: event.downloaded,
                lastSyncTime: new Date(),
            });
        } else if (event.type === "sync.error") {
            updateSyncStatus("error");
        } else if (event.type === "conflicts.detected") {
            showConflicts(event.conflicts);
        }
    });

    return () => engine.unsubscribe();
}, []);
```

### In App.tsx - FirstLoginDialog

Connect callbacks to sync engine:

```typescript
// CURRENT (TODO):
onUpload={async () => {
    // TODO: Connect to actual sync engine
    console.log("Upload local vault");
}}

// IMPLEMENT:
onUpload={async () => {
    const migration = getMigrationManager();
    await migration.migrateVaultToCloud(user.id);
}}

// CURRENT (TODO):
onDownload={async () => {
    // TODO: Connect to actual sync engine
    console.log("Download from cloud");
}}

// IMPLEMENT:
onDownload={async () => {
    const backup = getBackupRestoreManager();
    await backup.forceDownloadCloudCopy(user.id);
}}

// CURRENT (TODO):
onMerge={async () => {
    // TODO: Connect to actual sync engine
    console.log("Merge local and cloud");
}}

// IMPLEMENT:
onMerge={async () => {
    // Call merge logic from sync engine
    const migration = getMigrationManager();
    await migration.mergeVaultFromCloud(user.id);
}}
```

### In Settings.tsx - Manual Controls

Connect buttons to sync engine:

```typescript
// CURRENT (TODO):
const handleForceUpload = async () => {
    try {
        toast({
            title: "Starting force upload",
            description: "Uploading all local data to cloud...",
        });
        // TODO: Call sync engine's forceUploadLocalCopy
        setTimeout(() => { ... }, 2000);

// IMPLEMENT:
const handleForceUpload = async () => {
    try {
        const backup = getBackupRestoreManager();
        await backup.forceUploadLocalCopy(user.id, (current, total) => {
            toast({
                title: "Uploading",
                description: `${current} / ${total} items`,
            });
        });
        // Success toast auto-shown by BackupRestoreManager
```

### In Settings.tsx - Backup Status

Connect to real sync data:

```typescript
// CURRENT (MOCK):
<BackupStatus
    isBackedUp={false}
    itemCount={0}
    lastBackupTime={undefined}
/>

// IMPLEMENT:
const syncStats = syncUI.syncStats;
const isBackedUp = syncStats.lastSyncTime !== undefined;

<BackupStatus
    isBackedUp={isBackedUp}
    lastBackupTime={syncStats.lastSyncTime}
    itemCount={mediaStore.items.length}  // or get from sync engine
/>
```

### In Settings.tsx - DeviceList

Connect to real user devices:

```typescript
// CURRENT (MOCK):
const mockDevices: Device[] = [
    {
        id: "device_1",
        name: "MacBook Pro",
        // ...
    },
];

<DeviceList devices={mockDevices} />

// IMPLEMENT:
const [devices, setDevices] = useState<Device[]>([]);

useEffect(() => {
    const loadDevices = async () => {
        // From user profile or auth provider
        const userDevices = await fetchUserDevices(user.id);
        setDevices(userDevices);
    };
    loadDevices();
}, [user.id]);

<DeviceList devices={devices} />
```

### In SyncStatusIndicator

Update on sync events:

```typescript
// CURRENT (STATIC):
<SyncStatusIndicator
    status="synced"
    lastSyncTime={new Date()}
    itemsUploaded={0}
    itemsDownloaded={0}
    conflictCount={0}
/>

// IMPLEMENT:
const syncUI = useSyncUIContext();

<SyncStatusIndicator
    status={syncUI.syncStatus}
    lastSyncTime={syncUI.syncStats.lastSyncTime}
    itemsUploaded={syncUI.syncStats.itemsUploaded}
    itemsDownloaded={syncUI.syncStats.itemsDownloaded}
    conflictCount={syncUI.syncStats.conflictCount}
    onDetailsClick={() => syncUI.setShowSyncDetails(true)}
/>
```

### In ConflictResolver

Connect to sync engine resolution:

```typescript
// CURRENT (TODO):
onResolve={async (conflictId, choice) => {
    // TODO: Connect to actual conflict resolver
    console.log(`Resolved conflict ${conflictId} with choice: ${choice}`);
}}

// IMPLEMENT:
onResolve={async (conflictId, choice) => {
    const conflict = resolveConflict(conflictId, {
        strategy: "manual-choose",
        choice,  // "local" or "cloud"
    });

    // Push resolution to cloud
    await getSyncEngine().uploadItem(conflict.id, conflict.data);
}}
```

---

## 📊 Sync Events (from sync engine)

Listen for these events in SyncUIContext:

```typescript
interface SyncEvent {
    type:
        | "sync.started"
        | "sync.completed"
        | "sync.error"
        | "sync.progress"
        | "conflicts.detected"
        | "upload.completed"
        | "download.completed"
        | "offline.queued"
        | "online.retry";

    // Event data
    uploaded?: number;
    downloaded?: number;
    errors?: string[];
    conflicts?: ConflictItem[];
    itemId?: string;
    queueLength?: number;
}
```

---

## 🎬 Flow Examples

### First Time Login Flow

```
1. User signs in with email/password
   → Auth success, userId stored

2. AuthContext.login() completes
   → App renders AppContent

3. SyncUIContext initializes
   → Checks: getMigrationManager().checkFirstLogin(userId)

4. First login detected
   → Count local items: mediaStore.items.length
   → Count cloud items: await getSyncEngine().getCloudItemCount(userId)
   → Call: syncUI.showFirstLogin(local, cloud)

5. FirstLoginDialog opens
   → User chooses: Upload / Download / Merge

6. Operation completes
   → Toast shown
   → Dialog closes
   → SyncStatusIndicator updates
```

### Offline → Online Flow

```
1. User goes offline
   → OfflineBanner shows: "You're offline"

2. User makes changes to vault
   → Changes saved locally
   → Marked PENDING_UPLOAD in sync state
   → Added to OfflineQueueManager

3. User comes back online
   → window.online event fires
   → OfflineBanner shows: "Back online! Syncing..."

4. Auto-retry logic triggers
   → OfflineQueueManager.autoRetry()
   → Items from queue pushed to sync engine
   → OfflineQueueManager.flush() after success

5. Sync completes
   → SyncStatusIndicator updates to 🟢 synced
   → OfflineBanner auto-hides after 4s
```

### Conflict Detection Flow

```
1. Download updates from cloud
   → getSyncEngine().downloadUpdates(userId)

2. Conflict detected during merge
   → SyncEngine emits: "conflicts.detected" event

3. SyncUIContext receives event
   → Call: syncUI.showConflicts(items)

4. ConflictResolver modal opens
   → Show all conflicting items

5. User resolves each item
   → Choose: "Keep local" or "Keep cloud"
   → onResolve() callback called

6. All conflicts resolved
   → Toast: "All 3 conflicts resolved"
   → Modal closes
   → Final sync completes
```

---

## 🧪 Testing Checklist

- [ ] Sync status indicator shows correct icon for each state
- [ ] Clicking status icon opens dropdown
- [ ] Offline banner appears/disappears correctly
- [ ] First login dialog shows correct item counts
- [ ] Upload/download/merge buttons connect to sync engine
- [ ] Conflict resolver shows both versions
- [ ] Choosing version resolves conflict
- [ ] Force upload/download buttons work
- [ ] Re-sync button fetches latest
- [ ] Device list shows real devices
- [ ] Toasts appear on all operations
- [ ] Account section shows logged-in user
- [ ] Backup status shows correct info
- [ ] Mobile layout is responsive
- [ ] No console errors

---

## 📝 Files to Modify

To complete integration:

1. ✅ `src/context/SyncUIContext.tsx` — Add event listeners
2. ✅ `src/App.tsx` — Wire FirstLoginDialog & ConflictResolver callbacks
3. ✅ `src/pages/Settings.tsx` — Wire button callbacks & backup status
4. ✅ `src/components/account/DeviceList.tsx` — Fetch real devices
5. ✅ `src/components/sync/SyncStatusIndicator.tsx` — Update from context

---

## 🎯 Priority Order

1. **High:** SyncUIContext event listeners (enables all real-time updates)
2. **High:** FirstLoginDialog callbacks (enables vault migration)
3. **High:** Settings sync buttons (enables manual control)
4. **Medium:** Device list (shows multi-device experience)
5. **Medium:** Backup status (shows confidence)
6. **Low:** Conflict resolver details (only needed if conflicts occur)

---

**Status:** All UI components ready. Awaiting backend integration. ✅
