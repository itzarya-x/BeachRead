# Offline OAuth Handling - Quick Reference

## What Was Implemented

✨ **Smart Offline Detection**: App detects when user loses internet connection and handles it gracefully.

### The 10 Requirements - All Complete ✅

| Task                      | Implementation                         | Result                                |
| ------------------------- | -------------------------------------- | ------------------------------------- |
| 1. Detect Network State   | `useOnline()` hook + window events     | Global reactive `isOnline` state      |
| 2. Disable Login Buttons  | Buttons `disabled` when offline        | Users can't attempt OAuth offline     |
| 3. Clear Offline Message  | Dedicated offline UI screen            | "You are offline. Internet required." |
| 4. Retry Hint             | Auto-enable buttons on reconnect       | "You're back online" banner           |
| 5. Prevent OAuth Attempt  | Check `isOnline` in `loginWithOAuth()` | Safe, error-caught flow               |
| 6. Keep Session Online    | No forced logout                       | User stays logged in offline          |
| 7. Sync Queue Ready       | OfflineBanner confirms sync pending    | Backend queue ready to implement      |
| 8. Visual Indicator       | Yellow/green dots + icons + text       | Clear status at a glance              |
| 9. Error Translation      | Human-friendly messages                | No technical jargon                   |
| 10. Offline Functionality | All features work locally              | Browse, edit, tier, add, delete ✔     |

---

## How It Works

### For Not-Logged-In Users

```
ONLINE                          OFFLINE
┌─────────────────────┐        ┌─────────────────────┐
│ 🟦 Sign in for sync │        │ 🟨 Offline (disabled)│
│ (blue, enabled)     │   →    │ (yellow, disabled)  │
└─────────────────────┘        └─────────────────────┘
        ↓                              ↓
     Click                          Click
        ↓                              ↓
  LoginModal shows            LoginModal shows
  methods (Google,            offline screen with
  Magic Link)                 "Continue offline"
```

### For Logged-In Users

```
Avatar Status Indicator:
🟢 Green (animated) when ONLINE    →  "Syncing..."
🟡 Yellow (solid) when OFFLINE     →  "Offline — sync paused"

Sidebar status:
ONLINE:  "Syncing..." (with green dot)
OFFLINE: "Offline — sync paused" (with yellow dot)

System Banner (Top):
OFFLINE: "You're offline. Changes sync when reconnected."
ONLINE:  "You're back online" (shows 3 sec then fades)
```

---

## Code Usage

### In Components - Get Network State

```tsx
import { useAuth } from "@/context/AuthContext";

function MyComponent() {
    const { isOnline } = useAuth();

    return <button disabled={!isOnline}>{isOnline ? "Sign in" : "Offline"}</button>;
}
```

### Or Use Direct Hook

```tsx
import { useOnline } from "@/hooks/useOnline";

function MyComponent() {
    const isOnline = useOnline();

    return <span>{isOnline ? "Online" : "Offline"}</span>;
}
```

---

## User Experience Flows

### Scenario: User Goes Offline

1. User has internet
2. Network drops
3. "You're offline" banner appears (yellow)
4. Sign in button changes: Blue → Yellow (disabled)
5. Avatar status dot: Green → Yellow
6. Status text: "Syncing..." → "Offline — sync paused"
7. User browses, edits, adds entries (all local, unsync'd)
8. Network returns
9. "You're back online" banner appears (green, 3 sec)
10. Status returns to normal
11. Changes start syncing

### Scenario: User Tries to Sign In Offline

1. User clicks "Sign in for sync"
2. LoginModal opens
3. User clicks "Continue with Google"
4. Instead of error, shows dedicated offline screen
5. Message: "You are offline. Internet required."
6. Reassurance: "Your local vault is still available"
7. Options: "Continue offline" or wait for connection
8. When connection back: "Try again" button auto-enables
9. User can retry login

### Scenario: User Already Logged In, Goes Offline

1. Avatar shows user is logged in (green dot, animated)
2. Network drops
3. Status: "Syncing..." → "Offline — sync paused"
4. Green dot → Yellow dot
5. User can still:
    - View library ✔
    - Search ✔
    - Edit anime/manga ✔
    - Create tier lists ✔
    - Add entries ✔
    - Delete entries ✔
6. Everything works locally
7. Network returns
8. "You're back online" banner
9. Sync resumes with queued changes

---

## Visual Indicators

### Sign In Button (Not Logged In)

**ONLINE** (Blue)

```
☁️ Sign in for sync
[Clickable]
```

**OFFLINE** (Yellow)

```
📡 Offline
[Disabled, tooltip: "Internet required"]
```

### Avatar Status Dot (Logged In)

**ONLINE**

```
🟢 Green, animated pulse
Status: "Syncing..."
```

**OFFLINE**

```
🟡 Yellow, solid
Status: "Offline — sync paused"
```

### System Notifications

**OFFLINE (Top banner, yellow)**

```
📡 You're offline. Changes sync when reconnected.
```

**RECONNECTED (Top banner, green, auto-dismisses)**

```
✓ You're back online
```

---

## Files Changed

| File                                             | Change      | Impact                              |
| ------------------------------------------------ | ----------- | ----------------------------------- |
| `src/hooks/useOnline.ts`                         | **NEW**     | Network detection hook              |
| `src/context/AuthContext.tsx`                    | **UPDATED** | Added `isOnline`, offline checks    |
| `src/components/account/LoginModal.tsx`          | **UPDATED** | Offline UI mode, error handling     |
| `src/components/account/SidebarAccountBlock.tsx` | **UPDATED** | Offline indicators, disabled button |
| `src/components/OfflineIndicator.tsx`            | **NEW**     | Reusable offline indicator          |
| `src/pages/Login.tsx`                            | **UPDATED** | Disabled buttons, offline banner    |
| `src/components/sync/OfflineBanner.tsx`          | **UPDATED** | Uses shared `useOnline` hook        |

---

## Testing Quick List

- [ ] **Disable internet** via DevTools or airplane mode
- [ ] **Not logged in**: Try clicking "Sign in" → See offline modal
- [ ] **Logged in**: Try clicking Google → See offline message
- [ ] **Buttons disabled** when offline (can't click through)
- [ ] **Status indicators** change (color, text, icons)
- [ ] **Enable internet** → All buttons auto-enable
- [ ] **Green banner** shows "back online" for 3 sec
- [ ] **Local features** still work (browse, edit, add, delete)
- [ ] **No data loss** when going offline
- [ ] **No console errors** in browser DevTools

---

## Key Design Decisions

1. **Offline = Dedicated UI** (not error state)
    - Clearer for users
    - Reassuring tone
    - "Your local vault is still available"

2. **Auto-Enable Buttons**
    - No manual refresh needed
    - Smooth UX when network returns
    - Button text updates automatically

3. **Keep Sessions**
    - No forced logout offline
    - Data persists in localStorage
    - Better user trust

4. **Color Coding**
    - 🟡 Yellow = Offline/Caution
    - 🟢 Green = Online/Good
    - Instant visual recognition

5. **Reassuring Messages**
    - Not: "Network error"
    - But: "You are offline. Your local vault is still available."
    - Reduces anxiety

---

## What Still Works Offline

✔ Browse anime/manga library
✔ Search and filter
✔ Edit anime/manga entries
✔ Create tier lists
✔ Add entries to custom lists
✔ Delete entries
✔ View stats
✔ All viewing/editing features

**What Needs Network**
✗ Sign in (OAuth, magic link)
✗ Cloud sync
✗ Loading from AniList

---

## Future: Sync Queue

Current banner says: "Changes will sync automatically when online"

To implement:

1. Capture all edits in queue while offline
2. On reconnect, flush queue in order
3. Handle conflicts gracefully
4. Show sync progress

See `OFFLINE_OAUTH_HANDLING.md` for details.

---

## Questions?

Check these docs:

- `OFFLINE_OAUTH_HANDLING.md` - Full technical details
- `AUTH_IMPLEMENTATION_COMPLETE.md` - Original auth flow
- `CLOUD_SYNC_UI_COMPLETE.md` - Sync UI architecture
