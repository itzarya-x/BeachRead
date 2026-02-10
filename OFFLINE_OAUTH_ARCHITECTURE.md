# Offline OAuth Handling - Visual Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            navigator.onLine API                      │   │
│  │     (Detects network connectivity)                   │   │
│  └────────────┬───────────────────────────────────────┬─┘   │
│               │                                       │       │
│         [online event]                        [offline event]│
│               │                                       │       │
│  ┌────────────▼───────────────────────────────────────▼─┐   │
│  │         useOnline Hook                                │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │ useState(navigator.onLine)                      │ │   │
│  │  │ + window.addEventListener("online", ...)       │ │   │
│  │  │ + window.addEventListener("offline", ...)      │ │   │
│  │  │ Returns: isOnline (boolean)                     │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  └────────────┬─────────────────────────────────────────┘   │
│               │                                             │
│  ┌────────────▼──────────────────────────────────────────┐  │
│  │      AuthContext + AuthProvider                       │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │ isOnline (from useOnline hook)                   │ │  │
│  │  │ ├─ loginWithOAuth():                             │ │  │
│  │  │ │  if (!isOnline) throw "offline message"        │ │  │
│  │  │ │                                                 │ │  │
│  │  │ └─ loginWithMagicLink():                         │ │  │
│  │  │    if (!isOnline) throw "offline message"        │ │  │
│  │  │                                                   │ │  │
│  │  │ Provides: { user, isOnline, error, ... }         │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  └──────────┬─────────────────────────────────────────────┘  │
│             │                                                 │
│   ┌─────────┴─────────────────────────────┬─────────────┐   │
│   │                                       │             │   │
│  Components Consuming isOnline:           │             │   │
│  ┌────────────────────────────────────┐   │             │   │
│  │ LoginModal.tsx                     │   │             │   │
│  │ • Detects offline errors           │   │             │   │
│  │ • Shows "offline" UI mode          │   │             │   │
│  │ • Disables buttons when offline    │   │             │   │
│  └────────────────────────────────────┘   │             │   │
│  ┌────────────────────────────────────┐   │             │   │
│  │ SidebarAccountBlock.tsx            │   │             │   │
│  │ • Disables sign in button offline  │   │             │   │
│  │ • Shows yellow status when offline │   │             │   │
│  │ • Updates user message             │   │             │   │
│  └────────────────────────────────────┘   │             │   │
│  ┌────────────────────────────────────┐   │             │   │
│  │ OfflineBanner.tsx                  │   │             │   │
│  │ • Shows offline message (yellow)   │   │             │   │
│  │ • Shows reconnected msg (green)    │   │             │   │
│  └────────────────────────────────────┘   │             │   │
│  ┌────────────────────────────────────┐   │             │   │
│  │ Login.tsx Page                     │   │             │   │
│  │ • Disables OAuth/magic buttons     │   │             │   │
│  │ • Shows offline banner             │   │             │   │
│  └────────────────────────────────────┘   │             │   │
│                                           │             │   │
└───────────────────────────────────────────┴─────────────┘   │
```

## Data Flow: User Attempts OAuth While Offline

```
┌─────────────┐
│ User clicks │
│   "Google"  │
└──────┬──────┘
       │
       ▼
┌──────────────────────┐
│ handleOAuthLogin()   │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ await loginWithOAuth("google")    │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Check: if (!isOnline) {          │
│   throw new Error("offline msg") │
│ }                                │
└──────┬───────────────────────────┘
       │
    OFFLINE?
    /        \
 YES/          \NO
  /              \
 ▼                ▼
Error thrown   Proceed to
in callback    Supabase auth
 │              │
 ▼              ▼
Catch:       Auth flow
setMode      (redirect)
("offline")
 │
 ▼
Show offline UI
with reassurance
```

## State Machine: Login Modal Offline Behavior

```
                    ┌─────────────┐
                    │  "methods"  │ (initial)
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
    OAuth Click      Email Submit      Magic Link Click
        │                  │                  │
        │ (online)         │ (online)         │ (online)
        ▼                  ▼                  ▼
    Supabase         Login Success      Email Sent
        │                  │                  │
        │ (success)        │ (success)        │ (success)
        ▼                  ▼                  ▼
  Navigate/          Modal closes    set mode:
  Redirect              │           "magic-link-sent"
                        ▼                  │
                    (redirect)             ▼
                                     Show: "Check email"
                                           │
                                           │
        ┌──────────────────────────────────────┐
        │          OFFLINE FLOW                 │
        └──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
    OAuth Click      Email Submit      Magic Link Click
    (offline)       (offline)          (offline)
        │                  │                  │
    catch error       catch error        catch error
        │                  │                  │
        ▼                  ▼                  ▼
  if (msg.includes("offline"))
        │
    setMode("offline")
        │
        ▼
  ┌─────────────────────────────────────┐
  │     OFFLINE UI MODE                 │
  │  • Wifi icon (striked through)      │
  │  • Message: "You are offline"       │
  │  • Info: "Internet required"        │
  │  • Buttons:                         │
  │    - "Continue offline" (action)    │
  │    - "Try again" (when online)      │
  └─────────────────────────────────────┘
        │
        ├─ Continue offline → Close modal
        │
        └─ When isOnline becomes true
           │
           ▼
        "Try again" button
        becomes enabled
        (auto-enable, no refresh)
```

## UI Component Hierarchy

```
┌─ App.tsx
│  │
│  └─ AuthProvider (provides isOnline)
│     │
│     ├─ OfflineBanner
│     │  └─ Shows: "offline" (yellow) or "back online" (green)
│     │
│     └─ AppContent
│        │
│        ├─ Layout / Sidebar
│        │  │
│        │  └─ SidebarAccountBlock
│        │     ├─ Not Logged In:
│        │     │  └─ [Blue] "Sign in for sync" (enabled if isOnline)
│        │     │     [Yellow] "Offline" (disabled if !isOnline)
│        │     │
│        │     └─ Logged In:
│        │        ├─ Avatar with status dot
│        │        │  ├─ 🟢 Green (online, animated)
│        │        │  └─ 🟡 Yellow (offline)
│        │        │
│        │        └─ Status text
│        │           ├─ "Syncing..." (online)
│        │           └─ "Offline — sync paused" (offline)
│        │
│        └─ Pages / Routes
│           │
│           ├─ /login
│           │  └─ Login.tsx
│           │     ├─ Shows offline banner
│           │     ├─ Disables buttons if !isOnline
│           │     └─ Shows reconnect notice
│           │
│           └─ (other pages use data locally)
│
└─ Modals
   │
   └─ LoginModal (for sidebar)
      ├─ Methods mode: Show Google + Email
      ├─ Offline mode: Show reassurance + continue offline button
      ├─ Error mode: Show error message
      └─ Magic-link-sent mode: Show confirmation
```

## Network State Lifecycle

```
┌────────────────┐
│   CONNECTED    │
│  (isOnline=✓)  │
└────────┬───────┘
         │
    Network drops
         │
         ▼
┌────────────────────────────────┐
│   DISCONNECTED (offline event)  │
│   (isOnline=✗)                  │
│                                 │
│   - Buttons disabled ✗          │
│   - Yellow indicators ✓         │
│   - Offline message ✓           │
│   - Session preserved ✓         │
│   - Local features work ✓       │
└────────┬─────────────────────────┘
         │
    Network returns
         │
         ▼
┌────────────────────────────────┐
│   RECONNECTED (online event)    │
│   (isOnline=✓)                  │
│                                 │
│   - Buttons enabled ✓           │
│   - Green indicators ✓          │
│   - "Back online" banner ✓      │
│   - Sync resumes ✓              │
│   - Session active ✓            │
└────────┬─────────────────────────┘
         │
    Network drops again
         │
         ▼
    (repeat)
```

## Error Handling Flow

```
User Action (OAuth/Email)
         │
         ▼
Call auth method
         │
         ▼
Check: isOnline?
    /              \
  NO              YES
  │                │
  ▼                ▼
Throw:         Try auth
"offline       with
message"       Supabase
  │                │
  │         ┌──────┴──────┐
  │         │ Success  │ Failure
  │         ▼          ▼
  │         (OK)    Throw error
  │                 │
  └─────────┬───────┘
            │
         catch
            │
     Check error msg
        /          \
    offline?     other?
      /              \
     ▼                ▼
Set mode:         Set mode:
"offline"         "error"
     │                │
     ▼                ▼
Show offline UI   Show error UI
"You are offline" "Error: ..."
"Continue"        "Try again"
```

## Component: LoginModal States

```
┌─────────────────────────────────────────────────────────────┐
│                      LoginModal                             │
│  (isOpen: boolean, onOpenChange: function)                  │
└─────────────────────────────────────────────────────────────┘

State: mode = "methods" | "magic-link-sent" | "error" | "offline"

┌─ "methods" (initial)
│  ┌──────────────────────────────────────┐
│  │ [🌐 Continue with Google] (disabled) │ if offline
│  │         OR                           │
│  │ [🌐 Continue with Google]            │ if online
│  ├──────────────────────────────────────┤
│  │ ─────── or ───────                  │
│  ├──────────────────────────────────────┤
│  │ Enter email:  [your@email.com]       │
│  │ [📧 Send magic link] (disabled)      │ if offline
│  │         OR                           │
│  │ [📧 Send magic link]                 │ if online
│  └──────────────────────────────────────┘
│
├─ "magic-link-sent"
│  ┌──────────────────────────────────────┐
│  │ 📧 (green circle)                    │
│  ├──────────────────────────────────────┤
│  │ Check your email                     │
│  │ We sent a link to: your@email.com    │
│  ├──────────────────────────────────────┤
│  │ [← Back]                             │
│  └──────────────────────────────────────┘
│
├─ "error"
│  ┌──────────────────────────────────────┐
│  │ ❌ Error Box                         │
│  │ "Login failed: ..."                  │
│  ├──────────────────────────────────────┤
│  │ [← Try again]                        │
│  └──────────────────────────────────────┘
│
└─ "offline" [NEW]
   ┌──────────────────────────────────────┐
   │ 📡 (wifi icon, struck through)       │
   ├──────────────────────────────────────┤
   │ You are offline                      │
   │ Internet is required to sign in.     │
   │ Your local vault is still available. │
   ├──────────────────────────────────────┤
   │ [📡 Waiting for connection...]       │ if !isOnline
   │          OR                          │
   │ [✓ You're back online — try again]   │ if isOnline
   ├──────────────────────────────────────┤
   │ [← Continue offline]                 │
   └──────────────────────────────────────┘
```

## File Dependencies

```
useOnline.ts (no dependencies except React)
     │
     ├─→ AuthContext.tsx
     │    ├─→ SidebarAccountBlock.tsx
     │    ├─→ LoginModal.tsx
     │    ├─→ Login.tsx (page)
     │    └─→ (any component that needs isOnline)
     │
     └─→ OfflineBanner.tsx
          └─→ App.tsx (included in AppContent)
```

## Testing: Offline State Transitions

```
NORMAL FLOW (Online → Offline → Online)

1. App loads
   isOnline = ✓ (navigator.onLine = true)

2. Disable network (DevTools or airplane mode)
   ✓ "offline" event fires
   ✓ setIsOnline(false)
   ✓ isOnline = ✗

3. Buttons immediately disabled
   - SidebarAccountBlock: "Offline" (yellow)
   - LoginModal Google: disabled
   - LoginModal Email: disabled
   - OfflineBanner: shows yellow message

4. Try to sign in
   - Click disabled button (won't work)
   - Or try programmatically
   - Catches offline error
   - Shows offline UI

5. Enable network
   ✓ "online" event fires
   ✓ setIsOnline(true)
   ✓ isOnline = ✓

6. Buttons immediately enabled
   - SidebarAccountBlock: "Sign in for sync" (blue)
   - LoginModal: all buttons enabled
   - Green "back online" banner shows (3 sec then fades)
   - Offline banner disappears

7. User can now sign in
   - Clicks button (enabled)
   - OAuth flows normally
   - Success/redirect
```

## Performance Notes

- `useOnline()`: O(1) - simple state management
- No polling: Uses native browser events
- No external dependencies
- Minimal re-renders: Only when isOnline changes
- No memory leaks: Cleanup on unmount
- Browser support: All modern browsers

This architecture ensures:

- ✅ Fast network detection
- ✅ Smooth UX transitions
- ✅ Clear user feedback
- ✅ No data loss
- ✅ Graceful degradation
- ✅ Scalable design
