# 🎨 CLOUD SYNC UI — VISUAL REFERENCE & FLOW DIAGRAMS

**Date:** February 10, 2026

---

## 📍 UI Placement Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ☁️ OFFLINE BANNER (if offline)                                         │
│  "You're offline. Changes will sync when back online."                  │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┬───────────────────────────────────────────────────┐
│   APP SIDEBAR        │  MAIN CONTENT                                     │
│                      │                                                   │
│  📱 Yura  [☰]        │  HOME / ANIME / MANGA / STATS / SETTINGS / etc    │
│                      │                                                   │
│  👤 [Avatar]         │                                                   │
│     User Name        │                                                   │
│                      │                                                   │
│  🏠 Home             │                                                   │
│  📺 Anime            │                                                   │
│  📚 Manga            │                                                   │
│  🏆 Tier Maker       │                                                   │
│  📊 Stats            │                                                   │
│  ⏰ Activity          │                                                   │
│  ❤️  Favourites      │                                                   │
│  ⚙️  Settings         │                                                   │
│                      │                                                   │
│ ┌────────────────┐   │                                                   │
│ │ 🟢 Synced      │ ← │  SYNC STATUS INDICATOR                           │
│ │ Last: 2m ago   │   │  (Clickable → dropdown details)                  │
│ └────────────────┘   │                                                   │
└──────────────────────┴───────────────────────────────────────────────────┘
```

---

## 🔄 Sync Status States

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SYNC STATUS INDICATOR STATES                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  SYNCED (🟢)                                                            │
│  ┌─────────────────────────────────────────┐                           │
│  │ 🟢 Synced                               │                           │
│  │ Last synced 2 minutes ago               │                           │
│  │                                         │                           │
│  │ Uploaded: 5   Downloaded: 3  Conflicts: 0                           │
│  │                                         │                           │
│  │ 🌐 Connected to internet                │                           │
│  │                                         │                           │
│  │ [View Details] button                   │                           │
│  └─────────────────────────────────────────┘                           │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  SYNCING (🟡)                                                           │
│  ┌─────────────────────────────────────────┐                           │
│  │ 🟡 Syncing...                           │                           │
│  │ Working on your changes...              │                           │
│  │                                         │                           │
│  │ Uploaded: 3   Downloaded: 1  Conflicts: 0                           │
│  │                                         │                           │
│  │ 🌐 Connected to internet                │                           │
│  │                                         │                           │
│  │ [⊘ Cancel] button                       │                           │
│  └─────────────────────────────────────────┘                           │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ERROR (🔴)                                                             │
│  ┌─────────────────────────────────────────┐                           │
│  │ 🔴 Sync Error                           │                           │
│  │ Last tried 5 minutes ago                │                           │
│  │                                         │                           │
│  │ ⚠️ Sync encountered an error.           │                           │
│  │ Check settings for details.             │                           │
│  │                                         │                           │
│  │ 🌐 Connected to internet                │                           │
│  │                                         │                           │
│  │ [View Details] button                   │                           │
│  └─────────────────────────────────────────┘                           │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  OFFLINE (⚫)                                                            │
│  ┌─────────────────────────────────────────┐                           │
│  │ ⚫ Offline                               │                           │
│  │ Last synced 30 minutes ago              │                           │
│  │                                         │                           │
│  │ 🌐 Offline — changes will sync later   │                           │
│  │                                         │                           │
│  │ [View Details] button                   │                           │
│  └─────────────────────────────────────────┘                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📄 Settings Page Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SETTINGS PAGE                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ACCOUNT SECTION                                                        │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ [Avatar] John Doe                                              │    │
│  │ john.doe@example.com                                           │    │
│  │ 🟢 Cloud sync enabled                                          │    │
│  │                                                                │    │
│  │ [Logout Button - Red]                                          │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  BACKUP STATUS                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ 🛡️ Vault safely backed up                                      │    │
│  │ Last backup: 2 hours ago                                        │    │
│  │ Items backed up: 1,247                                          │    │
│  │ Your vault is synced across all your devices.                  │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  CLOUD SYNC CONTROLS                                                    │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ Manually control your vault synchronization.                   │    │
│  │                                                                │    │
│  │ [☁️⬆️ Force Upload]  [☁️⬇️ Force Download]  [🔄 Re-Sync]      │    │
│  │                                                                │    │
│  │ ⚠️ WARNING: Force operations can replace data.                 │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  BACKUP & EXPORT                                                        │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ Download your vault as JSON for manual backup.                 │    │
│  │                                                                │    │
│  │ [📥 Export Backup] [📤 Import Backup]                          │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ACTIVE DEVICES                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ 🖥️  MacBook Pro                           [This device]        │    │
│  │     Chrome 121 • macOS Sonoma              Last seen: now       │    │
│  │                                                                │    │
│  │ 📱 iPhone 14                                                   │    │
│  │    Safari • iOS 17                         Last seen: 2h ago    │    │
│  │                                                                │    │
│  │ 📱 iPad Pro                                                    │    │
│  │    Safari • iPadOS 17                      Last seen: 3d ago    │    │
│  │                                                                │    │
│  │ ℹ️ Unrecognized device? Sign out from other devices.           │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  [Rest of GDPR Settings sections...]                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 First Login Dialog

```
┌──────────────────────────────────────────────────────────────────────┐
│  SET UP CLOUD SYNC                                                   │
│  Choose how to sync your vault across devices                        │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────┐         ┌─────────────────────────┐   │
│  │     Local items        │         │    Cloud items          │   │
│  │                        │         │                         │   │
│  │         42             │         │          0              │   │
│  └────────────────────────┘         └─────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ ☁️⬆️  UPLOAD TO CLOUD                                         │  │
│  │ Save your 42 local items to cloud                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ ☁️⬇️  DOWNLOAD FROM CLOUD                                     │  │
│  │ Restore your 0 cloud items here                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 🔀 MERGE BOTH                                                │  │
│  │ Combine local and cloud (recommended)                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│  [Skip for now]                                                     │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## ⚔️ Conflict Resolver Dialog

```
┌──────────────────────────────────────────────────────────────────────┐
│  ⚠️  RESOLVE 3 CONFLICTS                                             │
│  Choose which version to keep                                        │
│  Conflict 1 of 3                                                     │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  📺 "Demon Slayer"                                                   │
│                                                                      │
│  ┌────────────────────────┐  ┌────────────────────────┐           │
│  │ LOCAL (This Device)    │  │ CLOUD                  │           │
│  │                        │  │                        │           │
│  │ 2/25 at 3:45 PM       │  │ 2/25 at 5:20 PM       │           │
│  │ MacBook Pro            │  │ iPhone                 │           │
│  │                        │  │                        │           │
│  │ ┌──────────────────┐   │  │ ┌──────────────────┐   │           │
│  │ │ {                │   │  │ │ {                │   │           │
│  │ │   "score": 8,    │   │  │ │   "score": 9,    │   │           │
│  │ │   "progress": 12 │   │  │ │   "progress": 12 │   │           │
│  │ │ }                │   │  │ │ }                │   │           │
│  │ └──────────────────┘   │  │ └──────────────────┘   │           │
│  │                        │  │                        │           │
│  │ [KEEP THIS]            │  │ [KEEP THIS]            │           │
│  └────────────────────────┘  └────────────────────────┘           │
│                                                                      │
│  Progress: [========  ...]  (1 of 3)                                │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 📱 Mobile View

```
┌─────────────────────────┐
│  ☁️ OFFLINE BANNER      │
│  (if offline)           │
├─────────────────────────┤
│                         │
│ [☰] Yura          [🔍]  │  ← Collapsed sidebar + search
│                         │
│ MAIN CONTENT            │
│ (Full width)            │
│                         │
│                         │
│                         │
│                         │
│ [Footer with icons]     │
│  [🏠] [📺] [📊] [⚙️]    │
│  [🟢]  (sync status)    │
│                         │
└─────────────────────────┘

SIDEBAR EXPANDED:
┌─────────────────────────┐
│ [☰] Yura               │
│ [Avatar] User Name      │
│ 🏠 Home                 │
│ 📺 Anime                │
│ 📚 Manga                │
│ 🏆 Tier Maker          │
│ 📊 Stats                │
│ ⏰ Activity              │
│ ❤️  Favorites          │
│ ⚙️  Settings            │
│                         │
│ [Dropdown: 🟢 Synced]  │
└─────────────────────────┘
```

---

## 🔄 User Journeys

### Journey 1: First Time Login

```
START
  ↓
USER CLICKS "Sign In"
  ↓
LOGIN FORM
  Email: user@example.com
  Password: ••••••
  [Sign In] button
  ↓
[✓ Login successful]
  ↓
SyncUIContext DETECTS: First login
  ↓
CHECKS: getMigrationManager().checkFirstLogin(userId)
  ↓
SHOWS: FirstLoginDialog
  "Upload to cloud?" "Download from cloud?" "Merge?"
  ↓
USER CHOOSES: "Merge both"
  ↓
[📊 Progress bar shows]
  ↓
[✓ Merge complete]
  ↓
TOAST: "3 items merged successfully"
  ↓
REDIRECT: App home
  ↓
SyncStatusIndicator shows: 🟢 Synced
  ↓
END (Multi-device sync enabled!)
```

### Journey 2: Offline → Online

```
START
  ↓
USER EDITS: "My Anime" score 8→9
  ↓
[✓ Saved locally]
  ↓
INTERNET DISCONNECTS
  ↓
OfflineBanner SHOWS: "You're offline"
  ↓
USER KEEPS EDITING
  Changes queued to OfflineQueueManager
  ↓
USER GOES ONLINE
  ↓
OfflineBanner SHOWS: "Back online! Syncing..."
  ↓
OfflineQueueManager AUTO-RETRIES
  Items pushed to SyncEngine
  ↓
[🟡 Syncing...]
  ↓
[✓ Sync complete]
  ↓
OfflineBanner HIDES (after 4s)
  ↓
SyncStatusIndicator: 🟢 Synced
  ↓
TOAST: "3 items synced"
  ↓
END
```

### Journey 3: Conflict Resolution

```
START
  ↓
USER EDITS: MacBook (score: 8)
  iPhone EDITS: Same item (score: 9)
  ↓
SyncEngine.downloadUpdates()
  ↓
[CONFLICT DETECTED]
  ↓
SyncUIContext: syncUI.showConflicts(items)
  ↓
ConflictResolver MODAL OPENS
  Shows: Side-by-side comparison
  ↓
USER REVIEWS
  Local: score 8 (MacBook)
  Cloud: score 9 (iPhone)
  ↓
USER CLICKS: "Keep this" on Cloud version
  ↓
[⟳ Resolving...]
  ↓
[✓ Resolved]
  ↓
NEXT CONFLICT (if any)
  OR
  TOAST: "All conflicts resolved"
  Modal closes
  ↓
END
```

### Journey 4: Manual Force Operations

```
START
  ↓
USER GOES TO: Settings → Cloud Sync Controls
  ↓
USER CLICKS: "Force Upload"
  ↓
DIALOG: "This will replace cloud data with local. Continue?"
  [Cancel] [Upload]
  ↓
USER CONFIRMS: "Upload"
  ↓
[⟳ Uploading...]
  TOAST: "Uploading 45 items..."
  ↓
[✓ Complete]
  ↓
TOAST: "✓ Uploaded 45 items successfully"
  ↓
SyncStatusIndicator: 🟢 Synced
  ↓
END
```

---

## 🎨 Color Scheme

```
SUCCESS (Synced)
  Icon: 🟢
  Color: #059669 (green-600)
  Hex: rgb(5, 150, 105)
  Usage: Everything is synced

PROGRESS (Syncing)
  Icon: 🟡
  Color: #d97706 (amber-600)
  Hex: rgb(217, 119, 6)
  Usage: Operation in progress

ERROR (Failed)
  Icon: 🔴
  Color: #dc2626 (red-600)
  Hex: rgb(220, 38, 38)
  Usage: Something went wrong

OFFLINE (No Connection)
  Icon: ⚫
  Color: #6b7280 (gray-600)
  Hex: rgb(107, 114, 128)
  Usage: Not connected to internet
```

---

## 📏 Component Sizes

```
SyncStatusIndicator
  Collapsed: 32px × 32px (icon only)
  Expanded: 120px × 48px (dropdown)

OfflineBanner
  Height: 44px
  Width: 100%

FirstLoginDialog
  Width: 512px (max-width: md)
  Height: 600px (scrollable)

ConflictResolver
  Width: 768px (max-width: 2xl)
  Height: 400px (scrollable)

AccountSection
  Width: 100% (full width in Settings)
  Height: 240px

DeviceList
  Width: 100% (full width in Settings)
  Height: 400px (scrollable if 3+ devices)

BackupStatus
  Width: 100% (full width in Settings)
  Height: 180px
```

---

**Visual Reference Complete** ✅
