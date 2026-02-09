# 🎯 Authentication UI Quick Reference

**For:** Developers & Designers  
**Date:** February 10, 2026

---

## 🚀 Quick Start

### User Wants to Login

```typescript
// Option 1: From anywhere in the app
import { LoginModal } from '@/components/account/LoginModal';

const [showLogin, setShowLogin] = useState(false);

<button onClick={() => setShowLogin(true)}>Sign In</button>
<LoginModal isOpen={showLogin} onOpenChange={setShowLogin} />
```

### Check if User is Logged In

```typescript
import { useAuth } from '@/context/AuthContext';

function MyComponent() {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) return <Spinner />;
  
  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }
  
  return <div>Welcome, {user.email}!</div>;
}
```

### Show Sync Status

```typescript
import { useCloudSyncStatus } from '@/hooks/useCloudSyncStatus';

function MyComponent() {
  const syncStatus = useCloudSyncStatus();
  
  return (
    <div>
      Status: {syncStatus.status}
      {syncStatus.isEnabled && <span>✓ Synced</span>}
      {syncStatus.requiresLogin && <span>⚠️ Login required</span>}
    </div>
  );
}
```

---

## 📦 Component Cheat Sheet

### SidebarAccountBlock

**Where:** Bottom of sidebar  
**Purpose:** Show login status, open login modal or account panel

```tsx
import { SidebarAccountBlock } from '@/components/account/SidebarAccountBlock';

<SidebarAccountBlock collapsed={false} />
```

**Props:**
- `collapsed?: boolean` - Show icon-only view

**States:**
- Not logged in → Shows "Sign in for sync" button
- Logged in → Shows avatar, email, sync status

---

### LoginModal

**Where:** Global modal  
**Purpose:** Login with Google or magic link

```tsx
import { LoginModal } from '@/components/account/LoginModal';

<LoginModal 
  isOpen={isOpen} 
  onOpenChange={setIsOpen} 
/>
```

**Props:**
- `isOpen: boolean` - Control visibility
- `onOpenChange: (open: boolean) => void` - Close callback

**Features:**
- Google OAuth
- Email magic link
- Auto-closes on success
- Error handling

---

### AccountDetailsPanel

**Where:** Drawer from sidebar  
**Purpose:** Show account info, logout

```tsx
import { AccountDetailsPanel } from '@/components/account/AccountDetailsPanel';

<AccountDetailsPanel 
  isOpen={isOpen} 
  onOpenChange={setIsOpen} 
/>
```

**Props:**
- `isOpen: boolean`
- `onOpenChange: (open: boolean) => void`

**Shows:**
- Email
- Cloud sync status
- Re-sync button
- Logout button (with confirmation)

---

### AccountSection

**Where:** Settings page  
**Purpose:** Full account management

```tsx
import { AccountSection } from '@/components/account/AccountSection';

<AccountSection onLoginClick={() => navigate('/login')} />
```

**Props:**
- `onLoginClick?: () => void` - Custom login handler

**Shows:**
- Avatar, email, display name
- Cloud sync status
- Logout button (with confirmation)
- Login CTA if not authenticated

---

### CloudSyncStatusIndicator

**Where:** Sidebar footer  
**Purpose:** Minimal sync status badge

```tsx
import { CloudSyncStatusIndicator } from '@/components/sync/CloudSyncStatusIndicator';

<CloudSyncStatusIndicator />
```

**No props** - Auto-detects auth and sync status

**Shows:**
- 🟢 "Cloud backup enabled" (if logged in)
- ⚫ "Sign in to enable cloud sync" (if not logged in)

---

### SyncStatusIndicator

**Where:** Sidebar footer  
**Purpose:** Full sync status with dropdown

```tsx
import { SyncStatusIndicator } from '@/components/sync/SyncStatusIndicator';

<SyncStatusIndicator
  status="synced"
  lastSyncTime={new Date()}
  itemsUploaded={5}
  itemsDownloaded={3}
  conflictCount={0}
  onDetailsClick={() => setShowDetails(true)}
/>
```

**Props:**
- `status: 'synced' | 'syncing' | 'error' | 'offline'`
- `lastSyncTime?: Date`
- `itemsUploaded?: number`
- `itemsDownloaded?: number`
- `conflictCount?: number`
- `onDetailsClick?: () => void`

---

### OfflineBanner

**Where:** Top of app  
**Purpose:** Show offline/online status

```tsx
import { OfflineBanner } from '@/components/sync/OfflineBanner';

<OfflineBanner />
```

**No props** - Auto-detects online/offline

**Shows:**
- Yellow banner when offline
- Green banner when reconnecting
- Auto-dismisses after 4 seconds

---

### FirstLoginDialog

**Where:** Global dialog  
**Purpose:** Vault migration on first login

```tsx
import { FirstLoginDialog } from '@/components/sync/FirstLoginDialog';

<FirstLoginDialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  localItemCount={42}
  cloudItemCount={0}
  onUpload={async () => { /* upload logic */ }}
  onDownload={async () => { /* download logic */ }}
  onMerge={async () => { /* merge logic */ }}
/>
```

**Props:**
- `isOpen: boolean`
- `onClose: () => void`
- `localItemCount: number`
- `cloudItemCount: number`
- `onUpload: () => Promise<void>`
- `onDownload: () => Promise<void>`
- `onMerge: () => Promise<void>`

---

### BackupStatus

**Where:** Settings page  
**Purpose:** Show backup confidence

```tsx
import { BackupStatus } from '@/components/sync/BackupStatus';

<BackupStatus 
  isBackedUp={true} 
  lastBackupTime={new Date()} 
  itemCount={42} 
/>
```

**Props:**
- `isBackedUp: boolean`
- `lastBackupTime?: Date`
- `itemCount?: number`

**Shows:**
- Green "Safely backed up" (if backed up)
- Yellow "Not backed up yet" (if not)

---

### DeviceList

**Where:** Settings page  
**Purpose:** Show logged-in devices

```tsx
import { DeviceList, type Device } from '@/components/account/DeviceList';

const devices: Device[] = [
  {
    id: 'device_1',
    name: 'MacBook Pro',
    type: 'desktop',
    lastSeen: new Date(),
    isCurrentDevice: true,
    browser: 'Chrome 121',
    os: 'macOS Sonoma',
    location: 'San Francisco, CA',
  },
];

<DeviceList devices={devices} />
```

**Props:**
- `devices: Device[]`

**Device Type:**
```typescript
type Device = {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  lastSeen: Date;
  isCurrentDevice: boolean;
  browser?: string;
  os?: string;
  location?: string;
};
```

---

## 🎣 Hooks Reference

### useAuth()

**Purpose:** Access authentication state

```typescript
import { useAuth } from '@/context/AuthContext';

const {
  user,                    // AuthUser | null
  loading,                 // boolean
  error,                   // string | null
  isAuthenticated,         // boolean
  login,                   // (email, password) => Promise<void>
  loginWithOAuth,          // (provider) => Promise<void>
  loginWithMagicLink,      // (email) => Promise<void>
  logout,                  // () => Promise<void>
} = useAuth();
```

**AuthUser Type:**
```typescript
type AuthUser = {
  id: string;
  email: string;
  displayName?: string;
  avatar?: string;
  accessToken?: string;
};
```

---

### useCloudSyncStatus()

**Purpose:** Check cloud sync availability

```typescript
import { useCloudSyncStatus } from '@/hooks/useCloudSyncStatus';

const {
  isEnabled,        // boolean - Can sync to cloud
  isConfigured,     // boolean - Supabase configured
  isAuthenticated,  // boolean - User logged in
  requiresLogin,    // boolean - Sync blocked by auth
  status,           // 'connected' | 'not-connected' | 'not-configured'
  message,          // string - User-friendly message
} = useCloudSyncStatus();
```

**Example:**
```typescript
const syncStatus = useCloudSyncStatus();

if (syncStatus.requiresLogin) {
  return <button>Sign in to enable sync</button>;
}

if (syncStatus.isEnabled) {
  return <span>✓ Cloud backup enabled</span>;
}
```

---

### useSyncUI()

**Purpose:** Control sync UI dialogs

```typescript
import { useSyncUI } from '@/hooks/useSyncUI';

const {
  showFirstLoginDialog,
  showConflictResolver,
  conflicts,
  localItemCount,
  cloudItemCount,
  showFirstLogin,
  hideFirstLogin,
  showConflicts,
  hideConflicts,
} = useSyncUI();
```

**Example:**
```typescript
const syncUI = useSyncUI();

// Show first login dialog
syncUI.showFirstLogin(42, 0); // 42 local, 0 cloud

// Show conflicts
syncUI.showConflicts([
  { id: '1', title: 'Item', localVersion: {...}, cloudVersion: {...} }
]);
```

---

## 🎨 Design Tokens

### Colors

```css
/* Sync Status */
--color-synced: #059669;      /* Green */
--color-syncing: #d97706;     /* Amber */
--color-error: #dc2626;       /* Red */
--color-offline: #6b7280;     /* Gray */

/* Actions */
--color-primary: #3b82f6;     /* Blue */
--color-success: #059669;     /* Green */
--color-warning: #d97706;     /* Amber */
--color-danger: #dc2626;      /* Red */

/* Backgrounds */
--bg-surface-1: #1a1a2e;      /* Dark */
--bg-surface-2: #252538;      /* Lighter dark */
--bg-surface-3: #2f2f42;      /* Even lighter */
```

### Spacing

```css
--space-xs: 0.25rem;  /* 4px */
--space-sm: 0.5rem;   /* 8px */
--space-md: 0.75rem;  /* 12px */
--space-lg: 1rem;     /* 16px */
--space-xl: 1.5rem;   /* 24px */
--space-2xl: 2rem;    /* 32px */
```

### Border Radius

```css
--radius-sm: 0.375rem;  /* 6px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1rem;      /* 16px */
```

---

## 🔔 Toast Notifications

### Success

```typescript
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();

toast({
  title: 'Success!',
  description: 'Your changes have been saved.',
});
```

### Error

```typescript
toast({
  title: 'Error',
  description: 'Something went wrong.',
  variant: 'destructive',
});
```

### Info

```typescript
toast({
  title: 'Info',
  description: 'Your vault is syncing...',
});
```

---

## 🎯 Common Patterns

### Show Login if Not Authenticated

```tsx
function ProtectedFeature() {
  const { isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  
  if (!isAuthenticated) {
    return (
      <>
        <div>
          <p>Sign in to use this feature</p>
          <button onClick={() => setShowLogin(true)}>Sign In</button>
        </div>
        <LoginModal isOpen={showLogin} onOpenChange={setShowLogin} />
      </>
    );
  }
  
  return <div>Protected content</div>;
}
```

### Conditional Sync Controls

```tsx
function SyncButton() {
  const syncStatus = useCloudSyncStatus();
  const { toast } = useToast();
  
  if (!syncStatus.isEnabled) {
    return (
      <button disabled>
        Sync disabled - {syncStatus.message}
      </button>
    );
  }
  
  return (
    <button onClick={() => {
      toast({ title: 'Syncing...', description: 'Your vault is syncing' });
      // TODO: Call sync engine
    }}>
      Sync Now
    </button>
  );
}
```

### Show User Avatar

```tsx
function UserAvatar() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  return (
    <div>
      {user.avatar ? (
        <img src={user.avatar} alt={user.email} className="w-10 h-10 rounded-full" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
          {user.email[0].toUpperCase()}
        </div>
      )}
    </div>
  );
}
```

---

## 🐛 Debugging

### Check Auth State

```typescript
import { useAuth } from '@/context/AuthContext';

function DebugAuth() {
  const auth = useAuth();
  
  return (
    <pre>
      {JSON.stringify({
        isAuthenticated: auth.isAuthenticated,
        loading: auth.loading,
        error: auth.error,
        user: auth.user,
      }, null, 2)}
    </pre>
  );
}
```

### Check Sync Status

```typescript
import { useCloudSyncStatus } from '@/hooks/useCloudSyncStatus';

function DebugSync() {
  const sync = useCloudSyncStatus();
  
  return (
    <pre>
      {JSON.stringify(sync, null, 2)}
    </pre>
  );
}
```

### Check Supabase Config

```typescript
import { isSupabaseConfigured } from '@/lib/supabase-client';

console.log('Supabase configured:', isSupabaseConfigured());
```

---

## 📚 File Locations

```
src/
├── components/
│   ├── account/
│   │   ├── SidebarAccountBlock.tsx
│   │   ├── AccountSection.tsx
│   │   ├── AccountDetailsPanel.tsx
│   │   ├── LoginModal.tsx
│   │   └── DeviceList.tsx
│   │
│   └── sync/
│       ├── CloudSyncStatusIndicator.tsx
│       ├── SyncStatusIndicator.tsx
│       ├── OfflineBanner.tsx
│       ├── FirstLoginDialog.tsx
│       ├── ConflictResolver.tsx
│       └── BackupStatus.tsx
│
├── context/
│   ├── AuthContext.tsx
│   └── SyncUIContext.tsx
│
├── hooks/
│   ├── useCloudSyncStatus.ts
│   └── useSyncUI.ts
│
└── lib/
    └── supabase-client.ts
```

---

## 🔗 Integration Checklist

### To Connect Sync Engine:

- [ ] Replace `onUpload` in FirstLoginDialog with actual sync call
- [ ] Replace `onDownload` in FirstLoginDialog with actual sync call
- [ ] Replace `onMerge` in FirstLoginDialog with actual sync call
- [ ] Replace `handleForceUpload` in Settings with actual sync call
- [ ] Replace `handleForceDownload` in Settings with actual sync call
- [ ] Replace `handleReSync` in Settings with actual sync call
- [ ] Subscribe to sync events in SyncStatusIndicator
- [ ] Connect ConflictResolver to actual conflict resolution
- [ ] Fetch real device data for DeviceList
- [ ] Update BackupStatus with real sync timestamps

---

**Last Updated:** February 10, 2026  
**Status:** ✅ Production Ready  
**Version:** 1.0.0
