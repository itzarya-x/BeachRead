# 🎯 YURA Cloud Architecture - Visual Guide

## Current Status (Phase 1) ✅

```
┌─────────────────────────────────────────────────────────────┐
│                    YURA Application                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│   │   AnimeList  │  │  TierMaker   │  │   Settings   │    │
│   │   Component  │  │  Component   │  │  Component   │    │
│   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│          │                 │                 │             │
│          └─────────────────┼─────────────────┘             │
│                            │                               │
│                    ┌───────▼────────┐                      │
│                    │  DataContext   │                      │
│                    │   (useData)    │                      │
│                    └───────┬────────┘                      │
│                            │                               │
│              ┌─────────────▼─────────────┐                │
│              │  IStorageProvider         │                │
│              │     (Interface)           │                │
│              └─────────────┬─────────────┘                │
│                            │                               │
│        ┌───────────────────┴───────────────────┐          │
│        │                                       │          │
│  ┌─────▼──────────┐               ┌───────────▼─────┐   │
│  │                │               │                 │   │
│  │ LOCAL STORAGE  │               │ CLOUD STORAGE   │   │
│  │   ✅ ACTIVE    │               │  ⏳ Phase 2     │   │
│  │                │               │                 │   │
│  ├────────────────┤               ├─────────────────┤   │
│  │  IndexedDB     │               │   Supabase      │   │
│  │                │               │                 │   │
│  │ • media_cache  │               │ • profiles      │   │
│  │ • user_entries │               │ • media_cache   │   │
│  │ • tier_boards  │               │ • user_entries  │   │
│  │ • tiers        │               │ • tier_boards   │   │
│  │ • assignments  │               │ • tiers         │   │
│  │                │               │ • assignments   │   │
│  │ 🔒 LOCAL ONLY  │               │ • sync_queue    │   │
│  └────────────────┘               │ • user_settings │   │
│  100% Offline                      │                 │   │
│  Primary Storage                   │ 🌐 CLOUD SYNC   │   │
│                                    │ Optional        │   │
│                                    └─────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### User Edits Local Data

```
┌─────────────────┐
│  User Action    │
│ (Edit Anime)    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│   DataContext Handler   │
│  (addEntry, update...)  │
└────────┬────────────────┘
         │
         ▼
┌──────────────────────┐
│ Storage Provider     │
│ (getStorageProvider) │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ LocalStorageProvider │
│    (IndexedDB)       │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  IndexedDB Write     │
│   ✅ Saved Locally   │
└──────────────────────┘
         │
         ▼
┌──────────────────────────┐
│ App Works Offline! ✅    │
│ Data Persisted Locally   │
└──────────────────────────┘
```

### Phase 2: Sync to Cloud

```
┌──────────────────────┐
│  IndexedDB Updated   │
└────────┬─────────────┘
         │
         ▼
┌─────────────────────────┐
│  Record in Sync Queue   │
│                         │
│  {                      │
│    entity: "user_entry" │
│    operation: "create"  │
│    synced: false        │
│  }                      │
└────────┬────────────────┘
         │
         ▼
┌────────────────────┐
│  Is Device Online? │
└──┬──────────────┬──┘
   │              │
   ▼ YES          ▼ NO
┌────────┐    ┌──────────────┐
│ Sync   │    │ Queue Waits  │
│ Cloud  │    │ for Internet │
└───┬────┘    └──────────────┘
    │
    ▼
┌─────────────────────┐
│  Supabase Write     │
│  (Phase 2)          │
│                     │
│  Conflict resolved  │
│  by timestamp       │
└────────┬────────────┘
    │
    ▼
┌──────────────────┐
│ Mark as Synced   │
│                  │
│ synced: true     │
│ synced_at: now   │
└──────────────────┘
```

## File Structure

```
src/lib/
├── storage/                      ← NEW! Cloud abstraction layer
│   ├── types.ts                 ← IStorageProvider interface
│   ├── local.ts                 ← IndexedDB wrapper (PRIMARY)
│   ├── cloud.ts                 ← Supabase stub (Phase 2)
│   └── index.ts                 ← Storage manager singleton
│
├── tierStorage.ts               ← NEW! Compatibility wrapper
├── tierDatabase.ts              ← Old tier functions (still works)
├── database.ts                  ← Old IndexedDB functions (still works)
├── anilist-api.ts              ← API layer (unchanged)
├── gdpr-parser.ts              ← Parser (unchanged)
└── stats-engine.ts             ← Stats (unchanged)

src/context/
├── DataContext.tsx             ← UPDATED! Uses storage provider
└── StatsFilterContext.tsx      ← (unchanged)

src/pages/
└── TierMaker.tsx               ← Can use tierStorage (optional)
```

## Sync Queue Illustration

```
┌─────────────────────────────────────────┐
│         SYNC QUEUE TABLE                │
│  (Tracks offline changes)               │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ id | entity  | id | op | synced │  │
│  ├──────────────────────────────────┤  │
│  │ 1  │ entry   │456│add│   ❌     │  │
│  │ 2  │ entry   │789│upd│   ❌     │  │
│  │ 3  │ tier    │123│del│   ✅     │  │
│  │ 4  │ assign  │999│add│   ❌     │  │
│  └──────────────────────────────────┘  │
│                                         │
│  📍 When online:                        │
│     Process ❌ records → Supabase       │
│     Mark as ✅ when done                │
│                                         │
│  📍 When offline:                       │
│     App works normally                  │
│     Queue just accumulates              │
│     Syncs when connection returns       │
│                                         │
└─────────────────────────────────────────┘
```

## Component Migration Path

### Before (Direct DB)

```typescript
import { saveUserEntry } from "@/lib/database";
import { getTierBoard } from "@/lib/tierDatabase";

await saveUserEntry(entry);
const board = await getTierBoard(1);
```

### After (Storage Abstraction)

```typescript
import { getStorageProvider } from "@/lib/storage";
import { getTierBoard } from "@/lib/tierStorage";

const storage = getStorageProvider();
await storage.saveUserEntry(entry);
const board = await getTierBoard(1); // Same function!
```

**All tier functions work through wrapper!**
No import changes needed if using `tierStorage.ts`

## Authentication Flow (Phase 2)

```
┌──────────────────┐
│  Login Button    │
└────────┬─────────┘
         │
         ▼
┌──────────────────────┐
│  Supabase Auth       │
│  (email/password)    │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  Get User & Token    │
└────────┬─────────────┘
         │
         ▼
┌────────────────────────────────┐
│  Initialize CloudStorageProvider │
│  with user context              │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────┐
│  Fetch User Data     │
│  from Cloud          │
│  (user_entries,      │
│   tier_boards, etc)  │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  Merge with Local    │
│  (conflict resolved) │
└────────┬─────────────┘
         │
         ▼
┌─────────────────────┐
│  Display Data       │
│  (Local + Cloud)    │
└─────────────────────┘
```

## Security Model (Row Level Security)

```
USER A                          USER B
┌───────────────────┐           ┌───────────────────┐
│ user_id: ABC123   │           │ user_id: XYZ789   │
├───────────────────┤           ├───────────────────┤
│ Profile Row       │           │ Profile Row       │
│ Media Entries     │           │ Media Entries     │
│ Tier Boards       │           │ Tier Boards       │
│ Tier Assignments  │           │ Tier Assignments  │
└────────┬──────────┘           └─────────┬────────┘
         │ Can only see                   │ Can only see
         │ own records                    │ own records
         │                                │
         ├────────────────────────────────┤
         │                                │
         ▼                                ▼
    ┌──────────────────────────────────────────┐
    │     SUPABASE DATABASE                    │
    │  (RLS Enforced at SQL Level)             │
    │                                          │
    │  ✅ User A can READ user_entries         │
    │     WHERE user_id = 'ABC123'             │
    │                                          │
    │  ❌ User A cannot READ user_entries      │
    │     WHERE user_id = 'XYZ789'             │
    │                                          │
    │  (Same for CREATE, UPDATE, DELETE)       │
    └──────────────────────────────────────────┘
```

## Phase 2 Deployment

```
PHASE 1 ✅                    PHASE 2 ⏳
┌─────────────────┐          ┌──────────────────┐
│ Local Storage   │          │ Cloud Storage    │
│ (IndexedDB)     │────┬─────│ (Supabase)       │
│ ✅ Active       │    │     │ 🔄 Syncing       │
│                 │    │     │ ✅ Authorized    │
│ Works Offline   │    │     │                  │
│ No Auth Needed  │    │     │ Works Multi-Device
│                 │    │     │ Auth Required    │
└─────────────────┘    │     └──────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Sync Engine     │
              │ (Background)    │
              │                 │
              │ • Compares data │
              │ • Uploads new   │
              │ • Downloads new │
              │ • Resolves      │
              │   conflicts     │
              └─────────────────┘
```

## Remember

```
LOCAL IS PRIMARY
    ↓
Cloud is optional enhancement
    ↓
App works 100% offline
    ↓
Sync happens in background
    ↓
Users benefit on multi-device
```

---

**Phase 1**: ✅ Architecture Ready
**Phase 2**: ⏳ Supabase Integration
**Future**: 🚀 Cross-device sync + Features
