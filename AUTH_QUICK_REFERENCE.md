# Authentication Implementation - Quick Reference

## Current Status

✅ **PHASE 1** - Supabase Auth Integration  
✅ **PHASE 2** - Login UI (Magic Link + OAuth)  
✅ **PHASE 3** - Logout UI with Confirmation  
🔄 **PHASE 4** - Link Data to userId (IN PROGRESS)  
⏳ **PHASE 5** - First-Time Login Flow  

## Key Files

| File | Purpose | Status |
|------|---------|--------|
| [src/lib/supabase-client.ts](src/lib/supabase-client.ts) | Supabase client factory | ✅ |
| [src/context/AuthContext.tsx](src/context/AuthContext.tsx) | Global auth state | ✅ |
| [src/pages/Login.tsx](src/pages/Login.tsx) | Login page + magic link | ✅ |
| [src/components/account/AccountSection.tsx](src/components/account/AccountSection.tsx) | Account + logout | ✅ |
| [.env.example](.env.example) | Config template | ✅ |

## Environment Variables

```bash
# .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Usage

### Check If User Is Logged In

```typescript
import { useAuth } from "@/context/AuthContext";

export function MyComponent() {
    const { user, isAuthenticated, loading } = useAuth();
    
    if (loading) return <div>Loading...</div>;
    if (!isAuthenticated) return <div>Not signed in</div>;
    
    return <div>Signed in as {user?.email}</div>;
}
```

### Use User ID for Cloud Queries

```typescript
import { useAuth } from "@/context/AuthContext";

export function MyData() {
    const { user } = useAuth();
    
    // Filter cloud queries by userId
    const query = `
        SELECT * FROM media 
        WHERE user_id = ?
    `;
    
    // Or via Supabase:
    // supabase.from('media')
    //   .select()
    //   .eq('user_id', user.id)
}
```

### Manual Login/Logout

```typescript
import { useAuth } from "@/context/AuthContext";

export function Auth() {
    const { login, logout, user } = useAuth();
    
    return (
        <div>
            {user ? (
                <>
                    Signed in as {user.email}
                    <button onClick={() => logout()}>Logout</button>
                </>
            ) : (
                <button onClick={() => login("user@example.com", "password")}>
                    Login
                </button>
            )}
        </div>
    );
}
```

## Authentication Methods

### Email + Password

```typescript
const { login } = useAuth();

// In your form
await login(email, password);
// → User logged in
// → Session stored
```

### Email Magic Link

```typescript
const { loginWithMagicLink } = useAuth();

// Send link to email
await loginWithMagicLink("user@example.com");
// → Email sent
// → User clicks link → Auto-logged in
```

### Google OAuth

```typescript
const { loginWithOAuth } = useAuth();

// Start OAuth flow
await loginWithOAuth("google");
// → Redirects to Google
// → Returns to app
// → Auto-logged in
```

### Logout

```typescript
const { logout } = useAuth();

await logout();
// → Session cleared
// → User logged out
// → Local data preserved
```

## Type Definitions

```typescript
export interface AuthUser {
    id: string;              // Unique user ID
    email: string;           // User email
    displayName?: string;    // Display name (optional)
    avatar?: string;         // Avatar URL (optional)
    accessToken?: string;    // JWT token
}

export interface AuthContextValue {
    user: AuthUser | null;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    loginWithOAuth: (provider: "google" | "github") => Promise<void>;
    loginWithMagicLink: (email: string) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}
```

## Session Restoration

**Automatic** - On app start:

1. App mounts
2. AuthContext checks `supabase.auth.getSession()`
3. If valid session found → User restored (invisible)
4. If no session → User stays logged out (no interruption)
5. localStorage backed up for fast restoration

**Manual session check:**

```typescript
import { supabase, isSupabaseConfigured } from "@/lib/supabase-client";

if (isSupabaseConfigured()) {
    const { data } = await supabase!.auth.getSession();
    const currentSession = data.session;
}
```

## Configuration

### With Supabase

1. Create Supabase project at [supabase.com](https://supabase.com)
2. Get credentials from Settings → API
3. Add to `.env.local`:
   ```bash
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
4. Enable authentication providers:
   - Email (default, enabled)
   - Google (configure OAuth app)
   - Others as needed

### Without Supabase (Offline Mode)

- Leave env vars empty or commented out
- App uses mock authentication
- All features work locally
- No cloud sync

## Error Handling

All auth methods throw errors on failure:

```typescript
const { login } = useAuth();

try {
    await login(email, password);
} catch (error) {
    console.error("Login failed:", error);
    // Show error to user
}
```

Error is also in context:

```typescript
const { error } = useAuth();

if (error) {
    return <div className="error">{error}</div>;
}
```

## localStorage

Automatically managed by AuthContext:

- `yura_auth_user` - Current user (cleared on logout)
- `yura_supabase_session` - Session token (auto-managed by Supabase)

These are cleared on logout:

```typescript
localStorage.removeItem("yura_auth_user");
// Supabase also clears session
```

## Offline Mode

Works automatically if:

- No Supabase env vars configured
- Or Supabase unreachable
- Or browser offline

Uses mock authentication:

- Any email works
- Password validation skipped
- localStorage used for state
- All app features work

**Note:** Real cloud sync won't work offline, but local features work fine.

## Common Issues

### "useAuth must be used within AuthProvider"

**Cause:** Component using `useAuth()` but not wrapped in `<AuthProvider>`

**Fix:** Ensure AuthProvider wraps the component (usually in App.tsx)

```typescript
// App.tsx
<AuthProvider>
    <YourComponent />
</AuthProvider>
```

### Session not persisting after reload

**Check:**
1. Supabase credentials configured?
2. localStorage working (not blocked by browser)?
3. Session valid (not expired)?

**Debug:**
```typescript
// In console:
localStorage.getItem("yura_auth_user");
localStorage.getItem("yura_supabase_session");
```

### Magic link not working

**Check:**
1. Email provider enabled in Supabase?
2. Email address valid?
3. Check spam folder?
4. Email not expired (links last 1 hour)?

### Google OAuth failing

**Check:**
1. OAuth app configured in Supabase?
2. Google OAuth credentials added to Supabase?
3. Redirect URL correct in Supabase settings?
4. Browser allowing redirects?

## GDPR Compliance

Auth data includes:

- **Stored in Supabase:** Email, name, avatar URL
- **Stored locally:** User ID (necessary for cloud sync)
- **Session tokens:** Auto-managed, stored securely

User can request data deletion:
- All user data removed from Supabase
- All cloud-synced data deleted
- Local data unaffected (independent)

## Next Steps (Phases 4-5)

### PHASE 4: Link Cloud Data to userId
- Add `user_id` column to all cloud tables
- Filter all queries by `userId`
- Verify data isolation between users

### PHASE 5: First-Time Login Flow
- If cloud empty + local has data → Ask to upload
- If cloud has data + local empty → Ask to download
- If both have data → Offer merge or choose

---

## Documentation Files

- [PHASE1_SUPABASE_AUTH.md](PHASE1_SUPABASE_AUTH.md) - Full PHASE 1 details
- [PHASE2_LOGIN_UI.md](PHASE2_LOGIN_UI.md) - Full PHASE 2 details
- [PHASE3_LOGOUT_UI.md](PHASE3_LOGOUT_UI.md) - Full PHASE 3 details
- [PHASE4_USERID_LINKING.md](PHASE4_USERID_LINKING.md) - PHASE 4 (coming)
- [PHASE5_FIRST_LOGIN_FLOW.md](PHASE5_FIRST_LOGIN_FLOW.md) - PHASE 5 (coming)
