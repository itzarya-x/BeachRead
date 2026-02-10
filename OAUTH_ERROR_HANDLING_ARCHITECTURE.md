# OAuth Error Handling - Visual Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    YURA APP - OAUTH FLOW                        │
│                   Error Handling Architecture                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  LAYER 1: PRE-FLIGHT CHECKS (Prevent errors before they occur) │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────┐  ┌──────────────────────────────┐    │
│  │ navigator.onLine   │  │ window.open() capability     │    │
│  │ (Is offline?)      │  │ (Are popups blocked?)        │    │
│  └────────┬───────────┘  └──────────────┬───────────────┘    │
│           │                             │                    │
│    useOnline() hook         isPopupBlocked() function        │
│           │                             │                    │
│           └─────────────┬───────────────┘                    │
│                         │                                    │
│              ✅ BOTH CHECKS PASS?                            │
│                         │                                    │
│                  Proceed to OAuth                            │
│                                                               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  LAYER 2: ATTEMPT WITH SAFETY FEATURES                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Supabase.auth.signInWithOAuth({                              │
│    provider: "google",                                        │
│    options: { redirectTo: ... }                               │
│  })                                                            │
│                                                               │
│  WITH:                                                        │
│  • 20-second timeout (prevents hangs)                         │
│  • Error event listeners                                      │
│  • User cancellation detection                                │
│                                                               │
│  RESULT:                                                      │
│  ├─ Success → redirect/login                                 │
│  ├─ Timeout → error                                           │
│  ├─ Network error → error                                     │
│  ├─ User cancel → error                                       │
│  └─ Other → error                                             │
│                                                               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  LAYER 3: ERROR CLASSIFICATION                                │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  detectErrorReason(error, isOnline, isPopupBlocked)          │
│           │                                                   │
│  Maps to: ├─ offline                                          │
│           ├─ popup-blocked                                    │
│           ├─ provider-unreachable                             │
│           ├─ network-timeout                                  │
│           ├─ network-error                                    │
│           ├─ user-cancelled                                   │
│           └─ unknown                                          │
│                                                               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  LAYER 4: INTERNAL LOGGING                                    │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  logOAuthFailure(provider, reason, details)                  │
│           │                                                   │
│  Stores: {                                                    │
│    timestamp: 1707592000000,                                  │
│    level: "warn",                                             │
│    event: "oauth_failure",                                    │
│    reason: "popup-blocked",                                   │
│    details: { provider: "google" },                           │
│    userAgent: "Mozilla/5.0..."                                │
│  }                                                             │
│           │                                                   │
│  Persists to localStorage (last 50 entries)                  │
│           │                                                   │
│  Accessible via:                                              │
│  • getLogs() → [{ ... }, { ... }]                            │
│  • getLogsAsString() → formatted text                         │
│  • exportLogsForSupport() → with metadata                     │
│                                                               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  LAYER 5: ERROR CONTEXT                                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  AuthContextValue {                                           │
│    error: string | null,          ← Human message              │
│    errorDetail: {                                              │
│      reason: OAuthErrorReason,    ← Machine classification    │
│      message: string,              ← User-friendly text        │
│      isRetryable: boolean          ← Can user retry?          │
│    }                                                            │
│  }                                                             │
│                                                               │
│  Provided to all components via useAuth() hook               │
│                                                               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  LAYER 6: RETRY MECHANISM                                     │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  useOAuthRetry() Hook                                         │
│  ├─ Tracks: attempts, last time, can retry status           │
│  ├─ Max attempts: 5 (configurable)                           │
│  ├─ Backoff delays:                                          │
│  │  - Attempt 1: 0s                                          │
│  │  - Attempt 2: 1s                                          │
│  │  - Attempt 3: 2s                                          │
│  │  - Attempt 4: 4s                                          │
│  │  - Attempt 5: 8s                                          │
│  ├─ Auto-retry when online: YES (optional)                  │
│  └─ Prevents:                                                │
│     - Spam (exponential backoff)                             │
│     - Infinite loops (max 5 attempts)                        │
│     - Accidental auto-retry                                  │
│                                                               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  LAYER 7: ERROR UI                                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  OAuthErrorScreen Component                                   │
│  ┌──────────────────────────────────────────────────────┐    │
│  │                                                       │    │
│  │  [Icon for error type]                               │    │
│  │                                                       │    │
│  │  Title: "You are offline"                             │    │
│  │  Description: "Internet is required to sign in"       │    │
│  │                                                       │    │
│  │  [ℹ️ Advice box: "Your local vault is available"]    │    │
│  │                                                       │    │
│  │  [Try again] or [Waiting for connection...]          │    │
│  │                                                       │    │
│  │  Helpful tip: "Auto-enables when online"              │    │
│  │                                                       │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  Maps error reason to:                                        │
│  • Icon (visual clue)                                         │
│  • Title (what happened)                                      │
│  • Description (why it happened)                              │
│  • Advice (how to fix it)                                     │
│  • Button state (retry possible?)                             │
│  • Help text (specific next step)                             │
│                                                               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  LAYER 8: MODAL INTEGRATION                                   │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  LoginModal.tsx                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Mode: "methods"      → [Google] [Email]             │    │
│  │  Mode: "magic-link-sent" → [Check your email]       │    │
│  │  Mode: "oauth-error"  → [OAuthErrorScreen]          │    │
│  │  Mode: "offline"      → [Offline messaging]         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  State Machine:                                               │
│  methods                                                      │
│    ├─ User clicks Google                                     │
│    ├─ Try OAuth                                              │
│    ├─ Error or Offline?                                      │
│    │  ├─ YES → oauth-error mode                             │
│    │  └─ NO → success (redirect)                            │
│    │                                                         │
│    └─ User clicks "Try again"                                │
│       └─ handleRetryOAuth()                                   │
│          ├─ recordAttempt()                                  │
│          └─ retry() with backoff                             │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Error Detection Decision Tree

```
                    ┌──────────────────────────┐
                    │ User clicks "Google"     │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ Is user online?         │
                    └─────────┬────────────┬──┘
                             YES            NO
                              │              │
                              │      ┌───────▼──────┐
                              │      │ Return error │
                              │      │ "offline"    │
                              │      └──────────────┘
                              │
                    ┌─────────▼────────────────┐
                    │ Are popups blocked?      │
                    └─────────┬────────────┬───┘
                             NO           YES
                              │             │
                              │    ┌────────▼──────────┐
                              │    │ Return error      │
                              │    │ "popup-blocked"   │
                              │    └───────────────────┘
                              │
                    ┌─────────▼──────────────────┐
                    │ Call Supabase OAuth        │
                    │ (with 20s timeout)        │
                    └─────────┬────────────┬─────┘
                          Success        Error
                              │            │
                              │    ┌───────▼─────────────┐
                              │    │ Error Analysis:     │
                              │    │                     │
                    ┌─────────▼─┐  ├─ Timeout?           │
                    │ Login OK! │  │  → network-timeout  │
                    │ Redirect  │  │                     │
                    └───────────┘  ├─ Network error?     │
                                   │  → network-error    │
                                   │                     │
                                   ├─ User closed?      │
                                   │  → user-cancelled  │
                                   │                    │
                                   ├─ Provider down?    │
                                   │  → provider-unreachable
                                   │                    │
                                   └─ Unknown?         │
                                      → unknown        │
                                                       │
                                   ┌─────────▼────────┐
                                   │ Show UI for this  │
                                   │ specific reason   │
                                   └───────────────────┘
```

## User Flow by Error Type

```
┌─────────────────────────────────────────────────────────────┐
│ ERROR: OFFLINE                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ User clicks Google                                          │
│       │                                                     │
│       ├─ Check online: NO                                   │
│       │                                                     │
│       ├─ Show UI:                                           │
│       │  "You are offline"                                  │
│       │  "Internet required"                                │
│       │  [Waiting...] (disabled)                            │
│       │                                                     │
│       ├─ User waits for connection                          │
│       │                                                     │
│       ├─ Network returns                                    │
│       │  (system detects via "online" event)               │
│       │                                                     │
│       ├─ Button auto-enables:                               │
│       │  [✓ Back online — try again]                        │
│       │                                                     │
│       ├─ User clicks "Try again"                            │
│       │                                                     │
│       └─ OAuth flow starts (check online: YES) → Success   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ERROR: POPUP BLOCKED                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ User clicks Google                                          │
│       │                                                     │
│       ├─ Check online: YES                                  │
│       ├─ Check popups: BLOCKED                              │
│       │                                                     │
│       ├─ Show UI:                                           │
│       │  "Popup blocked"                                    │
│       │  [ℹ️ "Enable popups... look for icon in address"]   │
│       │  [Try again] (enabled)                              │
│       │                                                     │
│       ├─ User enables popups in browser                     │
│       │                                                     │
│       ├─ User clicks "Try again"                            │
│       │                                                     │
│       ├─ Check popups: NOT BLOCKED (now allowed)            │
│       │                                                     │
│       └─ OAuth flow continues → Success                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ERROR: TIMEOUT (>20s)                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ User clicks Google                                          │
│       │                                                     │
│       ├─ All checks pass                                    │
│       ├─ OAuth starts                                       │
│       ├─ ... waiting 20 seconds ...                         │
│       │                                                     │
│       ├─ Timeout triggers                                   │
│       │                                                     │
│       ├─ Show UI:                                           │
│       │  "Connection timed out"                             │
│       │  [Try again] (with 1s delay)                        │
│       │                                                     │
│       ├─ User waits 1 second                                │
│       │                                                     │
│       ├─ User clicks "Try again"                            │
│       │  (Attempt 2, now with 2s delay)                     │
│       │                                                     │
│       └─ If fails again: exponential backoff continues     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
App.tsx
  │
  ├─ AuthProvider
  │  ├─ useOnline() hook
  │  ├─ loginWithOAuth() {
  │  │  ├─ Check isOnline
  │  │  ├─ Check isPopupBlocked()
  │  │  ├─ Call Supabase (20s timeout)
  │  │  ├─ detectErrorReason()
  │  │  ├─ logOAuthFailure()
  │  │  └─ setErrorDetail()
  │  │}
  │  │
  │  └─ Provides: { user, isOnline, errorDetail, ... }
  │
  ├─ AppLayout
  │  │
  │  └─ SidebarAccountBlock
  │     ├─ useAuth() → { isOnline }
  │     └─ Shows offline state
  │
  └─ LoginModal
     ├─ useAuth() → { errorDetail }
     ├─ useOAuthRetry() → { retry, recordAttempt }
     │
     ├─ handleOAuthLogin() {
     │  ├─ recordAttempt()
     │  ├─ loginWithOAuth()
     │  └─ On error → setMode("oauth-error")
     │}
     │
     ├─ handleRetryOAuth() {
     │  ├─ retry() (applies backoff)
     │  └─ handleOAuthLogin()
     │}
     │
     └─ Renders:
        ├─ mode="methods" → [Google] [Email]
        ├─ mode="oauth-error" →
        │  └─ OAuthErrorScreen { reason, onRetry }
        │     └─ Shows error with next steps
        └─ mode="offline" → [Offline messaging]
```

## Data Flow: Error to UI

```
OAuth Attempt
     │
     ├─ Error thrown
     │
     ├─ Caught in loginWithOAuth()
     │
     ├─ detectErrorReason()
     │  └─ Returns: "popup-blocked" (example)
     │
     ├─ setError() → Human message
     │  "Your browser blocked the popup..."
     │
     ├─ setErrorDetail() → Machine info
     │  {
     │    reason: "popup-blocked",
     │    message: "...",
     │    isRetryable: true
     │  }
     │
     ├─ logOAuthFailure() → Debug log
     │  { event: "oauth_failure", reason: "popup-blocked", ... }
     │
     ├─ throw error (to caller)
     │
     ├─ Caught in LoginModal.handleOAuthLogin()
     │  ├─ setMode("oauth-error")
     │  └─ Component re-renders
     │
     └─ Renders OAuthErrorScreen
        ├─ reason="popup-blocked"
        ├─ Shows popup icon 🚫
        ├─ Shows title: "Popup blocked"
        ├─ Shows advice: "Enable popups... look for icon"
        ├─ Shows [Try again] button
        └─ User clicks → handleRetryOAuth() → cycle
```

## State Management

```
LoginModal Component State:
┌──────────────────────────────────────────┐
│ mode: "methods" | "magic-link-sent" |   │
│       "oauth-error" | "offline"          │
├──────────────────────────────────────────┤
│ email: string                            │
├──────────────────────────────────────────┤
│ loading: boolean                         │
└──────────────────────────────────────────┘

useOAuthRetry Hook State:
┌──────────────────────────────────────────┐
│ attempts: number (0-5)                   │
├──────────────────────────────────────────┤
│ lastAttemptTime: number | null           │
├──────────────────────────────────────────┤
│ isRetrying: boolean                      │
├──────────────────────────────────────────┤
│ canRetry: boolean                        │
└──────────────────────────────────────────┘

AuthContext State:
┌──────────────────────────────────────────┐
│ error: string | null (human message)     │
├──────────────────────────────────────────┤
│ errorDetail: {                           │
│   reason: OAuthErrorReason,              │
│   message: string,                       │
│   isRetryable: boolean                   │
│ } | null                                 │
├──────────────────────────────────────────┤
│ isOnline: boolean (from useOnline)       │
└──────────────────────────────────────────┘
```

## Security Model

```
Public (User Sees):
├─ Human-friendly error messages
├─ Specific next steps
└─ No technical jargon

Internal (Not Shown):
├─ Stack traces
├─ Error codes
├─ Network details
└─ Sensitive data

Logged (For Debugging):
├─ Timestamped events
├─ Error reasons (classified)
├─ Provider info
├─ Masked emails (first 3 chars)
├─ No passwords
├─ No tokens
└─ Stored in localStorage (last 50 entries)

Can Export:
├─ getLogs() → Array
├─ getLogsAsString() → Text
└─ exportLogsForSupport() → With metadata
```
