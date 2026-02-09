# Acceptance Tests — Authentication & Cloud Sync

## Test 1: Login → User ID Available

**Objective:** Verify that login produces a user ID available to the app.

### Setup

1. Open Yura in browser
2. Not currently logged in
3. See "Sign in to enable cloud sync" hint in sidebar

### Steps

1. Navigate to Settings
2. Click "Sign In"
3. Enter email: `test@example.com`
4. Enter password: `test123456`
5. Click "Login with Email"

### Expected Result

- ✅ Login succeeds
- ✅ Redirected to home
- ✅ See "Cloud backup enabled" in sidebar (green indicator)
- ✅ Open browser DevTools → Console
- ✅ Type: `localStorage.getItem('yura_auth_user')`
- ✅ See user object with `id` field present
- ✅ Account section shows "Signed in as: test@example.com"

### Verification

```javascript
// In browser console:
const user = JSON.parse(localStorage.getItem("yura_auth_user"));
console.log(user.id); // Should print UUID
console.log(user.email); // Should print test@example.com
```

---

## Test 2: Reload → Still Logged In (Session Persistence)

**Objective:** Verify that session auto-restores on page reload.

### Setup

1. Logged in from Test 1
2. See "Cloud backup enabled" indicator
3. Settings shows "Signed in as: email"

### Steps

1. Press F5 or Cmd+R (refresh page)
2. Wait for app to load
3. Check sidebar for status indicator

### Expected Result

- ✅ Page reloads (no login screen shown)
- ✅ Immediately see "Cloud backup enabled" indicator
- ✅ No loading state blocking the page
- ✅ App is responsive
- ✅ Settings still shows "Signed in as: email"
- ✅ Sidebar shows green indicator (not warning)

### Key Principle (PHASE 6)

User should never see a login screen after reloading if they were logged in before.

---

## Test 3: Logout → Cloud Disabled

**Objective:** Verify that logout disables cloud sync.

### Setup

1. Logged in from Test 2
2. See "Cloud backup enabled"
3. Have local media in database

### Steps

1. Open Settings
2. Find Account section
3. Click "Logout"
4. See confirmation dialog
5. Click "Yes, logout"

### Expected Result

- ✅ Logout succeeds
- ✅ Toast shows: "Logged out - You've been safely logged out. Local data remains intact."
- ✅ Sidebar now shows "Sign in to enable cloud sync" (clickable button)
- ✅ Account section shows "Sign In" button
- ✅ localStorage cleared: `yura_auth_user` removed
- ✅ All local media still present (unaffected)

### Verification

```javascript
// In console after logout:
console.log(localStorage.getItem("yura_auth_user")); // Should be null
```

### Key Principle (PHASE 7)

Cloud sync is disabled when user is not authenticated. Local data is always safe.

---

## Test 4: Multi-Device Sync → Cross-Device Access

**Objective:** Verify that logged-in user can access data across different devices.

### Setup - Device A

1. Login with email: `multidevice@example.com`
2. Add 5-10 anime to list
3. Verify they appear in cloud
4. Close browser (but don't logout)

### Steps - Device B

1. Open Yura in different browser/device
2. Not logged in (new device)
3. See "Sign in to enable cloud sync" hint
4. Click "Sign In"
5. Enter same email: `multidevice@example.com`
6. Enter same password
7. Click "Login with Email"
8. Wait for app to load

### Expected Result - Device B

- ✅ Login succeeds
- ✅ Redirected to home
- ✅ See same 5-10 anime you added on Device A
- ✅ Data synced to Device B
- ✅ Sidebar shows "Cloud backup enabled"
- ✅ Settings shows "Signed in as: multidevice@example.com"

### Advanced: Verify User ID Consistency

```javascript
// On Device A (after login):
const userA = JSON.parse(localStorage.getItem("yura_auth_user"));
console.log("Device A User ID:", userA.id);

// On Device B (after login):
const userB = JSON.parse(localStorage.getItem("yura_auth_user"));
console.log("Device B User ID:", userB.id);

// Should be SAME
console.log(userA.id === userB.id); // true
```

### Key Principle (PHASE 6 + 7)

Same user ID across devices = same cloud data. This is the foundation of multi-device sync.

---

## Test 5: Magic Link Login

**Objective:** Verify email magic link authentication works.

### Setup

1. Logged out
2. See "Sign in to enable cloud sync"

### Steps

1. Navigate to Settings
2. Click "Sign In"
3. Enter email: `magiclink@example.com`
4. Click toggle: "Use magic link instead"
5. Click "Send Magic Link"
6. Check email inbox for login link
7. Click link in email

### Expected Result

- ✅ Magic link sent message shown: "Check your email"
- ✅ Email received with login link
- ✅ Click link → auto-logged in
- ✅ Redirected to home
- ✅ See "Cloud backup enabled"
- ✅ Settings shows "Signed in as: magiclink@example.com"

### Key Principle (PHASE 2)

Magic link is frictionless: no password needed, just email.

---

## Test 6: Google OAuth Login

**Objective:** Verify Google OAuth authentication works.

### Setup

1. Logged out
2. See "Sign in to enable cloud sync"

### Steps

1. Navigate to Settings
2. Click "Sign In"
3. Click "Continue with Google"
4. Redirected to Google login
5. Sign in with Google account
6. Grant permission to Yura

### Expected Result

- ✅ Redirected back to Yura
- ✅ Auto-logged in (no additional steps)
- ✅ See "Cloud backup enabled"
- ✅ Account shows Google email
- ✅ Avatar may show Google profile picture

### Key Principle (PHASE 2)

OAuth is one-click frictionless login.

---

## Test 7: Error Handling — Invalid Password

**Objective:** Verify proper error handling on login failure.

### Setup

1. Logged out
2. Email/password login form visible

### Steps

1. Enter email: `test@example.com`
2. Enter wrong password: `wrongpassword123`
3. Click "Login with Email"

### Expected Result

- ✅ Login fails
- ✅ Error message shown: "Login failed: [Supabase error message]"
- ✅ User stays on login form
- ✅ Can retry with correct password
- ✅ Not logged in

### Key Principle (PHASE 9)

Errors are actionable and non-destructive.

---

## Test 8: Error Handling — Logout Failure

**Objective:** Verify logout error handling.

### Setup

1. Logged in
2. Network connection working

### Steps - Simulate Network Error

1. Open DevTools (F12)
2. Go to Network tab
3. Throttle to "Offline"
4. Try to logout
5. See error message
6. Resume network

### Expected Result

- ✅ Logout fails with error message
- ✅ User still logged in (safe)
- ✅ Toast shows: "Logout failed: Network error"
- ✅ Can retry logout
- ✅ After reconnecting, logout succeeds

### Key Principle (PHASE 9)

Errors don't cause data loss. User stays logged in until logout succeeds.

---

## Test 9: UI Feedback — Cloud Sync Status

**Objective:** Verify status indicators show correct information.

### States to Verify

**State 1: Not Configured (No Supabase)**

- Remove `VITE_SUPABASE_*` env vars
- Restart app
- Result: No indicator shown

**State 2: Configured, Not Logged In**

- Set Supabase env vars
- Logout
- Result: ⚪ "Sign in to enable cloud sync" (clickable)
- Click: Goes to login

**State 3: Configured, Logged In**

- Login
- Result: 🟢 "Cloud backup enabled"
- Indicator pulses if syncing

**State 4: Auto-Logged In After Reload**

- Login
- Reload page
- Result: 🟢 "Cloud backup enabled" shows immediately (no loading)

### Key Principle (PHASE 8)

Status is always visible and accurate. One glance tells you cloud backup state.

---

## Test 10: Auto Login — Background Session Restoration

**Objective:** Verify that session restoration is invisible (PHASE 6).

### Setup

1. Login with email: `autotest@example.com`
2. Verify logged in
3. Open DevTools Console (F12)
4. Add this code:

```javascript
const observer = new PerformanceObserver(entryList => {
    const entries = entryList.getEntries();
    entries.forEach(entry => {
        if (entry.name.includes("supabase")) {
            console.log("Auth API call:", entry.name, entry.duration + "ms");
        }
    });
});
observer.observe({ entryTypes: ["resource"] });
```

### Steps

1. Reload page (Cmd+R)
2. Immediately open Settings
3. Check if "Signed in as" appears
4. Monitor console for API calls

### Expected Result

- ✅ No login screen shown
- ✅ Settings loaded
- ✅ "Signed in as: autotest@example.com" visible
- ✅ Took < 1 second for session to restore
- ✅ Background Supabase API calls present but not blocking
- ✅ Page is responsive immediately

### Key Principle (PHASE 6)

Session restoration happens silently in background. User never waits for login.

---

## Summary: What Each Test Verifies

| Test    | Phase | Verifies                          |
| ------- | ----- | --------------------------------- |
| Test 1  | 1     | User ID created on login          |
| Test 2  | 6     | Auto login, session persistence   |
| Test 3  | 7     | Cloud sync disabled on logout     |
| Test 4  | 1,6,7 | Multi-device identity consistency |
| Test 5  | 2     | Magic link frictionless auth      |
| Test 6  | 2     | OAuth frictionless auth           |
| Test 7  | 9     | Error handling on auth fail       |
| Test 8  | 9     | Error handling on sync fail       |
| Test 9  | 8     | UI feedback accuracy              |
| Test 10 | 6     | Background session restoration    |

---

## Quick Checklist

- [ ] Can login with email/password
- [ ] Can login with magic link
- [ ] Can login with Google
- [ ] Session persists on reload
- [ ] Cloud sync enabled when logged in
- [ ] Cloud sync disabled when logged out
- [ ] Logout clears credentials
- [ ] Error messages are clear
- [ ] Multi-device sync works
- [ ] Status indicator is accurate
- [ ] No login interruptions
- [ ] Local data always safe

---

## Philosophy Test

Ask yourself after running these tests:

1. **"Did I see a login screen unnecessarily?"** → If yes, PHASE 6 not working
2. **"Could I sync to cloud without logging in?"** → If yes, PHASE 7 not working
3. **"Did I know if cloud was working?"** → If no, PHASE 8 not working
4. **"Were errors clear and actionable?"** → If no, PHASE 9 not working

If all answers are correct, authentication feels like **background infrastructure**, not a feature.

---

## Result

After passing all 10 acceptance tests, you have:

✔ **Identity** - User has secure UUID  
✔ **Cloud Ready** - Multi-device sync ready  
✔ **Safe** - Cloud requires login  
✔ **Invisible** - Auth never interrupts  
✔ **Transparent** - Status always visible

Without a social network.

Just a personal vault that syncs.
