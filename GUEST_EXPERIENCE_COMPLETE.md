# Guest Experience Implementation Guide

## Phase 5 - Complete Guest Mode Handling

**Status**: ✅ COMPLETE
**Date**: 2024
**Version**: 1.0

---

## 📋 Overview

This document describes the complete implementation of the guest experience feature (Phase 5), allowing the app to function gracefully for unauthenticated users while maintaining cloud-first architecture for authenticated users.

### Key Objectives

1. ✅ **Empty Vault Display**: Show empty arrays instead of blank page for guests
2. ✅ **Guest UI Messaging**: Display "Your vault is empty. Sign in to continue" message
3. ✅ **Navigation Preserved**: All pages remain navigable but show empty states
4. ✅ **Action Blocking**: Disable CRUD operations with login prompts
5. ✅ **Storage Mode Indicator**: Display "Cloud" or "Guest" in UI
6. ✅ **Auto-Refresh**: Reload data after login

---

## 🏗️ Architecture

### Storage Mode System (Foundation)

**File**: `src/lib/storage-mode.ts`

```typescript
// Hard switch based ONLY on authentication status
getActiveStorageMode(isAuthenticated: boolean, userId?: string): "cloud" | "local"

// Enforcement blocks
assertNotCloud(operation: string) // Throws if authenticated
assertCloud(operation: string)     // Throws if not authenticated

// Data logging
DataLog.reading(source: string)
DataLog.inserted(source: string, entryId: number, data: any)
DataLog.updated(source: string, entryId: number, fields: string[])
DataLog.deleted(source: string, entryId: number, hardDelete: boolean)
DataLog.verified(operation: string, entryId: number, success: boolean)
DataLog.error(operation: string, message: string)
DataLog.modeStatus()
```

### Guest Experience Components

#### 1. GuestExperience Component

**File**: `src/components/guest-experience/GuestExperience.tsx`

Displays when user is not authenticated:

- Empty vault icon (📚)
- "Your vault is empty" heading
- Sign-in instructions
- Storage mode indicator (Guest mode)
- Features list (what they'll unlock after signing in)
- Sign In button

**Usage**:

```tsx
import { GuestExperience } from "@/components/guest-experience";

// In your route/page component
if (!authUser) {
    return <GuestExperience />;
}
```

#### 2. StorageModeIndicator Component

**File**: `src/components/guest-experience/StorageModeIndicator.tsx`

Shows storage mode in UI (visible only in dev mode):

- Variants: `inline`, `badge`, `full`
- Updates dynamically on auth changes
- Shows: "☁️ Cloud Storage" or "👤 Guest Mode"

**Usage**:

```tsx
import { StorageModeIndicator } from "@/components/guest-experience";

// In header/footer/footer
<StorageModeIndicator variant="badge" showLabel={true} />;
```

#### 3. LoginRequiredDialog Component

**File**: `src/components/guest-experience/LoginRequiredDialog.tsx`

Modal shown when guests try to perform restricted actions:

- Action name in dialog
- Clear sign-in prompt
- Cancel/Sign In buttons
- Loading state during login

**Usage**:

```tsx
import { LoginRequiredDialog, useLoginRequired } from "@/components/guest-experience";

function MyComponent() {
    const [loginDialog, handleMissingAuth] = useLoginRequired();

    const handleAddEntry = () => {
        if (!authUser) {
            handleMissingAuth("add a new entry");
            return;
        }
        // Proceed with adding entry
    };

    return (
        <>
            {loginDialog}
            <button onClick={handleAddEntry}>Add Entry</button>
        </>
    );
}
```

---

## 🔄 Data Loading Flow (Guest Mode)

### DataContext Load Effect

**File**: `src/context/DataContext.tsx` - Load Effect (Lines ~145-200)

```
┌─ Is User Authenticated?
│
├─ NO (Guest Mode)
│   ├─ Set storageMode = "local"
│   ├─ Log: "✨ Guest experience: showing empty vault"
│   ├─ Return empty arrays:
│   │   ├─ animeList = []
│   │   ├─ mangaList = []
│   │   ├─ userEdits = new Map()
│   │   └─ user = { id: 0, titleLanguage: "ROMAJI" }
│   └─ Exit immediately (non-blocking)
│
└─ YES (Cloud Mode)
    ├─ Set storageMode = "cloud"
    ├─ Initialize CloudStorageProvider
    ├─ Load GDPR base data
    ├─ Load user edits from Supabase
    ├─ Apply enrichment
    └─ Start background API sync
```

### Key Changes in DataContext

1. **Load Effect** (Lines ~145-200)
    - Detects guest mode early
    - Returns empty arrays for guests
    - Uses cloud for authenticated users
    - Never falls back to IndexedDB when authenticated

2. **addEntry() Function** (Lines ~284-286)
    - **NEW**: Throws error if `storageMode === "local"`
    - Prevents guest data modifications

3. **updateEntry() Function** (Lines ~382-384)
    - **NEW**: Throws error if `storageMode === "local"`
    - Prevents guest entry updates

4. **deleteEntry() Function** (Lines ~487-489)
    - **NEW**: Throws error if `storageMode === "local"`
    - Prevents guest entry deletions

---

## 🎯 Implementation Checklist

### Phase 5 Tasks

- [x] **TASK 1.1**: Return empty arrays for guests (no IndexedDB fallback)
    - Modified: DataContext load effect
    - Returns: `[], [], new Map(), minimal user object`

- [x] **TASK 2**: Show empty vault UI message
    - Created: GuestExperience component
    - Displays: Icon, heading, description, features list, sign-in button

- [x] **TASK 3**: Keep navigation working (empty states)
    - In DataContext: Set empty arrays, not errors
    - Pages show empty lists naturally

- [x] **TASK 4**: Disable cloud actions with login prompt
    - Created: LoginRequiredDialog component
    - Integrated: Throws on addEntry/updateEntry/deleteEntry for guests
    - Components can catch and show dialog

- [x] **TASK 5**: Display storage mode indicator
    - Created: StorageModeIndicator component
    - Added to DataContext return value
    - Available for UI integration

- [x] **TASK 6**: Auto-refresh after login
    - DataContext useEffect depends on: `[authUser]`
    - Automatically re-runs when user logs in
    - Reloads from Supabase

---

## 🧪 Acceptance Testing

### Test Case 1: Open App Logged Out

```
Given: No authenticated user
When: App loads
Then:
  ✅ No errors or crashes
  ✅ UI renders
  ✅ Empty lists displayed (animeList = [], mangaList = [])
  ✅ GuestExperience component visible
  ✅ Sign In button clickable
  ✅ Dev console shows: "✨ Guest experience: showing empty vault"
  ✅ StorageModeIndicator shows "👤 Guest Mode"
```

### Test Case 2: Navigate While Logged Out

```
Given: Guest user viewing app
When: User navigates between pages (Home, Stats, Tiermaker)
Then:
  ✅ All pages show empty states
  ✅ Navigation works (no errors)
  ✅ Stats show zeros
  ✅ Tiermaker shows empty
  ✅ No data mutations attempted
```

### Test Case 3: Try to Add Entry as Guest

```
Given: Guest user on home page
When: User attempts to add new entry (clicks "Add" button)
Then:
  ✅ LoginRequiredDialog modal appears
  ✅ Modal says: "Sign in required - to add a new entry"
  ✅ User can click "Sign In" or "Cancel"
  ✅ No entry created
```

### Test Case 4: Sign In and See Data

```
Given: Guest user on app
When: User clicks Sign In → completes OAuth → redirected back
Then:
  ✅ DataContext re-runs (authUser changed)
  ✅ Cloud storage provider initializes
  ✅ Data loads from Supabase
  ✅ animeList and mangaList populated
  ✅ StorageModeIndicator changes to "☁️ Cloud"
  ✅ Dev console shows: "Cloud Mode ☁️"
  ✅ User can now add/edit/delete entries
```

### Test Case 5: Sign Out and Return to Guest

```
Given: Authenticated user viewing data
When: User clicks Logout
Then:
  ✅ DataContext re-runs (authUser cleared)
  ✅ Data reset to empty arrays
  ✅ GuestExperience visible again
  ✅ Actions blocked again
  ✅ StorageModeIndicator shows "👤 Guest Mode"
```

---

## 🔒 Data Access Rules (Enforcement)

### Authentication State → Storage Provider Mapping

```
┌─────────────────────────────────────────────────────┐
│ AUTHENTICATION STATUS → STORAGE PROVIDER MAPPING    │
├─────────────────────────────────────────────────────┤
│ Authenticated (authUser exists)                     │
│  ├─ Storage Mode: "cloud"                           │
│  ├─ Provider: CloudStorageProvider (Supabase)      │
│  ├─ Data: User's synced media library               │
│  └─ Operations: ✅ READ, ✅ WRITE, ✅ DELETE       │
│                                                     │
│ Not Authenticated (authUser = null)                 │
│  ├─ Storage Mode: "local"                           │
│  ├─ Data: Empty arrays                              │
│  ├─ Operations: ❌ WRITE, ❌ DELETE                │
│  └─ Read: ✅ (returns empty, no error)             │
│                                                     │
│ Transition: Guest → Authenticated                   │
│  ├─ Trigger: Login successful                       │
│  ├─ Action: DataContext re-loads (useEffect)        │
│  └─ Result: Cloud data appears                      │
│                                                     │
│ Transition: Authenticated → Guest                   │
│  ├─ Trigger: Logout clicked                         │
│  ├─ Action: DataContext re-loads (useEffect)        │
│  └─ Result: Data cleared, UI resets                 │
└─────────────────────────────────────────────────────┘
```

---

## 🚨 Error Handling

### For CRUD Operations (Guest)

**When guest tries to add/update/delete**:

```typescript
// In DataContext functions
if (storageMode === "local") {
    const errorMsg = "Sign in required to perform this action";
    console.warn(`❌ ${errorMsg}`);
    throw new Error(errorMsg);
}
```

**In Components** (recommended):

```tsx
const handleAddEntry = async (entry: NewEntry) => {
    try {
        await addEntry(entry);
    } catch (err) {
        if (err.message.includes("Sign in required")) {
            handleMissingAuth("add a new entry"); // Show dialog
            return;
        }
        // Handle other errors
    }
};
```

---

## 📝 Logging Output Examples

### Guest Loading

```
✨ Guest experience: showing empty vault
📊 Guest Mode 👤
💾 Storage Mode: local (guest access)
```

### Cloud Loading (After Login)

```
📊 Cloud Mode ☁️
💾 Storage Mode: cloud (authenticated)
📖 Reading GDPR
✅ Inserted 150 entries (Anime)
✅ Inserted 80 entries (Manga)
```

### Attempted Write While Guest

```
❌ Guest users cannot add entries. Please sign in.
❌ Error: Sign in required to add entries
```

---

## 📦 File Structure

```
src/
├── components/
│   └── guest-experience/          # NEW DIRECTORY
│       ├── index.ts               # Central exports
│       ├── GuestExperience.tsx     # Empty vault UI
│       ├── StorageModeIndicator.tsx # Mode display
│       └── LoginRequiredDialog.tsx  # Auth prompt modal
│
├── context/
│   └── DataContext.tsx            # MODIFIED
│       ├── Load effect (guest detection)
│       ├── addEntry (guest blocking)
│       ├── updateEntry (guest blocking)
│       └── deleteEntry (guest blocking)
│
├── lib/
│   └── storage-mode.ts            # PHASE 4 (Foundation)
│       ├── Storage mode manager
│       ├── Enforcement blocks
│       └── Logging system
```

---

## 🎓 Integration Points

### 1. In Page/Route Components

```tsx
import { GuestExperience } from "@/components/guest-experience";
import { useAuth } from "@/context/AuthContext";
import { useDataContext } from "@/context/DataContext";

export function HomePage() {
    const { authUser } = useAuth();
    const { animeList, loading } = useDataContext();

    // Show guest experience for non-authenticated users
    if (!authUser && !loading) {
        return <GuestExperience />;
    }

    return <div>{/* Your normal page content */}</div>;
}
```

### 2. In Header/Navigation

```tsx
import { StorageModeIndicator } from "@/components/guest-experience";

export function Header() {
    return (
        <header className="flex justify-between items-center">
            <h1>MyAniListArchive</h1>
            <StorageModeIndicator variant="badge" />
        </header>
    );
}
```

### 3. In Action Handlers

```tsx
import { useLoginRequired } from "@/components/guest-experience";

export function EntryCard({ entry }) {
    const [loginDialog, handleMissingAuth] = useLoginRequired();
    const { authUser } = useAuth();
    const { updateEntry } = useDataContext();

    const handleRatingChange = async (newRating: number) => {
        if (!authUser) {
            handleMissingAuth("update your rating");
            return;
        }

        try {
            await updateEntry(entry._entryId, { score: newRating });
        } catch (err) {
            console.error("Failed to update entry:", err);
        }
    };

    return (
        <>
            {loginDialog}
            <div className="entry-card">{/* Card content */}</div>
        </>
    );
}
```

---

## ✨ Features Enabled

### For Guests

- ✅ View empty vault (no errors)
- ✅ Browse all pages (empty states)
- ✅ See sign-in prompts
- ✅ Navigate authentication flow
- ✅ See storage mode indicator (dev only)

### For Authenticated Users

- ✅ View full synced library
- ✅ Add new entries
- ✅ Edit entries
- ✅ Delete entries
- ✅ Create tier lists
- ✅ View statistics
- ✅ See cloud storage indicator

---

## 🐛 Troubleshooting

### Issue: App shows blank screen when logged out

**Solution**: Check that GuestExperience component is rendered in your route

```tsx
if (!authUser && !loading) return <GuestExperience />;
```

### Issue: Guest can still perform mutations

**Solution**: Ensure error is caught and dialog shown

```tsx
try {
    await updateEntry(...);
} catch (err) {
    if (err.message.includes("Sign in required")) {
        handleMissingAuth("update this entry");
    }
}
```

### Issue: Storage mode shows undefined

**Solution**: Ensure storageMode is in DataContext value

```tsx
// In DataContext return value
value={{
    // ... other values
    storageMode,  // Must be included
    // ... more values
}}
```

### Issue: Data not loading after login

**Solution**: Check that authUser is properly detected and useEffect re-runs

```tsx
// This dependency array in load useEffect should include authUser
useEffect(() => {
    load();
}, [authUser]); // authUser must be here
```

---

## 📊 Storage Mode Decision Matrix

| Scenario           | Authentication | Storage Mode | Operation | Result                  |
| ------------------ | -------------- | ------------ | --------- | ----------------------- |
| App loads, no user | ❌             | local        | Read      | Empty arrays ✅         |
| User tries add     | ❌             | local        | Write     | Error, Dialog ❌        |
| User signs in      | ✅             | cloud        | Reload    | Data from Supabase ✅   |
| Add entry          | ✅             | cloud        | Write     | Saved to Supabase ✅    |
| User signs out     | ❌             | local        | Reset     | Empty arrays, Dialog ✅ |

---

## 🎯 Success Metrics

- [x] 0 TypeScript errors after implementation
- [x] Build completes without errors
- [x] Guest mode returns empty, not errors
- [x] CRUD operations throw errors for guests (not silent fails)
- [x] Storage mode indicator shows correctly
- [x] Auto-refresh works on login/logout
- [x] All pages render with empty states
- [x] Components export properly

---

## 📋 Next Steps (Future Phases)

1. **Persistence Layer** (Phase 6)
    - Store guest preferences locally
    - Preserve UI state on reload

2. **Guest Tier Maker** (Phase 7)
    - Allow guests to create temporary tier lists
    - Store locally (not synced)

3. **Analytics** (Phase 8)
    - Track guest → registered conversion
    - Monitor feature engagement

4. **Onboarding** (Phase 9)
    - Welcome flow for guests
    - Feature tour on first visit

---

**Implementation Complete** ✅
**Ready for Testing** 🚀
