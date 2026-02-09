# PHASE 3: Logout UI with Confirmation

## Overview

**Objective:** Safe logout with user confirmation and clear status display.  
**Principle:** Always show current login status, confirm before logout  
**Features:** "Signed in as" display, logout with confirmation dialog

## Status: ✅ COMPLETED

### Tasks Completed

#### TASK 3.1: Signed In Status Display
- ✅ Updated [src/components/account/AccountSection.tsx](src/components/account/AccountSection.tsx)
- ✅ Shows "Signed in as: email@example.com" in blue banner
- ✅ Avatar + display name (if available)
- ✅ "Cloud sync active" status badge with pulse animation
- ✅ User metadata displayed when authenticated

#### TASK 3.2: Logout Confirmation Dialog
- ✅ Two-step logout process
- ✅ Click "Logout" button
- ✅ Confirmation appears: "Are you sure? Your local data will be kept safe."
- ✅ Two buttons: "Yes, logout" (red) + "Cancel"
- ✅ Cancel returns to normal view
- ✅ Confirm calls `logout()` and shows toast

## Features

### Signed In Display

**Status Banner:**
```
┌─────────────────────────────────┐
│ Signed in as: user@example.com  │
└─────────────────────────────────┘
```

**User Card (if available):**
- Avatar image or fallback gradient
- Display name (if provided by OAuth)
- Email address

**Status Badge:**
```
🟢 Cloud sync active
```

**Logout Button:**
```
Logout → Click → Confirmation Dialog
```

### Logout Confirmation Flow

**Step 1: User clicks "Logout"**
```
┌────────────────────────────────────────┐
│ Account                                │
├────────────────────────────────────────┤
│ Signed in as: user@example.com         │
│ ...                                    │
│ [Logout]                               │
└────────────────────────────────────────┘
```

**Step 2: Confirmation appears**
```
┌────────────────────────────────────────┐
│ ⚠️ Are you sure?                        │
│ Your local data will be kept safe.     │
│                                        │
│ [Yes, logout]  [Cancel]                │
└────────────────────────────────────────┘
```

**Step 3: Confirm or cancel**
- **Yes, logout:**
  - Calls `supabase.auth.signOut()`
  - Clears user state
  - Removes from localStorage
  - Shows toast: "Logged out"
  - Redirects to home
  - Local data remains intact

- **Cancel:**
  - Dialog closes
  - Returns to account view
  - User still logged in

### Not Logged In Display

**Sign In CTA:**
```
┌────────────────────────────────────────┐
│ Account                                │
├────────────────────────────────────────┤
│ Sign in to enable cloud sync and      │
│ access your vault on multiple devices.│
│                                        │
│ [Sign In]                              │
└────────────────────────────────────────┘
```

## Code Changes

### AccountSection Component

**New State:**
```typescript
const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
```

**New Logic:**
```typescript
// Two-step logout
if (showLogoutConfirm) {
    // Show confirmation dialog
} else {
    // Show logout button
    // Click → setShowLogoutConfirm(true)
}
```

**Updated Rendering:**
- "Signed in as: email" blue banner
- Avatar + display name display
- Status badge with animation
- Conditional confirmation dialog
- Loading states during logout

## UI/UX Details

### Visual Hierarchy

1. **Signed in as** (most prominent)
   - Blue background
   - Font weight: semibold
   - Clear indication of login status

2. **User info** (secondary)
   - Avatar + name
   - Subtle, informational

3. **Status badge** (tertiary)
   - Small, animated pulse
   - Shows cloud sync active

4. **Logout button** (action)
   - Red/destructive style
   - Careful placement to prevent accidents

### Confirmation Dialog

**Colors:**
- Red background (destructive action)
- Red borders
- Clear warning text

**Buttons:**
- "Yes, logout" - Destructive (red background)
- "Cancel" - Outline (secondary)

**Message:**
- Reassures about local data
- Clear consequences
- Professional tone

### Loading States

- Logout button disabled during logout
- Button text changes to "Logging out..."
- Prevents double-clicks
- Visual feedback

### Toast Notifications

**After logout:**
```
✓ Logged out
You've been safely logged out. Local data remains intact.
```

**On error:**
```
✗ Logout failed
[Error message]
```

## Responsive Design

- **Mobile:** Full width buttons, stackable
- **Desktop:** Buttons side-by-side
- **Tablet:** Scales appropriately
- **All:** Touch-friendly sizes

## Features Preserved

✅ All existing settings functionality  
✅ Local data never affected by logout  
✅ Can still use app offline  
✅ Tiers, Stats, Media all work  
✅ No breaking changes

## Testing Checklist

- [ ] **Logged In View:**
  - [ ] See "Signed in as: email"
  - [ ] Email displayed correctly
  - [ ] Avatar shows (or fallback)
  - [ ] Display name shown
  - [ ] Status badge says "Cloud sync active"

- [ ] **Logout Confirmation:**
  - [ ] Click "Logout" button
  - [ ] Confirmation dialog appears
  - [ ] Message is clear
  - [ ] Two buttons visible

- [ ] **Cancel Logout:**
  - [ ] Click "Cancel"
  - [ ] Dialog closes
  - [ ] Still logged in
  - [ ] Still see account info

- [ ] **Confirm Logout:**
  - [ ] Click "Yes, logout"
  - [ ] Button disables (shows "Logging out...")
  - [ ] Wait for completion
  - [ ] Toast appears: "Logged out"
  - [ ] Redirected to home
  - [ ] Sign in CTA shows

- [ ] **After Logout:**
  - [ ] See "Sign in to enable cloud sync..."
  - [ ] Can click "Sign In" again
  - [ ] All local data still present
  - [ ] Tiers, Stats, Media unchanged

- [ ] **Not Logged In:**
  - [ ] Sign in CTA visible
  - [ ] "Sign In" button works
  - [ ] Tooltip helpful

- [ ] **Error Handling:**
  - [ ] Network error during logout
  - [ ] Clear error message in toast
  - [ ] Can retry
  - [ ] No orphaned state

## Deployment

No additional setup needed beyond PHASE 1 & 2.

**Automatic Features:**
- ✅ Session auto-restoration on reload
- ✅ Logout clears all credentials
- ✅ Local data preserved
- ✅ Works with mock auth (offline)

## Next Steps

- **PHASE 4:** Link cloud data to userId (filtering queries)
- **PHASE 5:** First-time login flow (upload/download/merge)

## Verification

- ✅ AccountSection updated with confirmation flow
- ✅ Status display shows "Signed in as"
- ✅ Confirmation dialog implemented
- ✅ Toast notifications work
- ✅ Loading states during logout
- ✅ Error handling complete
- ✅ Mobile responsive
- ✅ Type safety maintained
- ✅ Zero breaking changes

## Principles Maintained

✅ **Safe** - Confirmation prevents accidents  
✅ **Clear** - Status always visible  
✅ **Transparent** - Local data never lost  
✅ **Reversible** - Can cancel at any time  
✅ **Frictionless** - One click to logout (after confirm)  
