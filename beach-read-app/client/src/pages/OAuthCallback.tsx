import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Minimal popup callback page for the custom AniList OAuth flow.
 *
 * Flow:
 *  1. User enters Client ID + Secret in TrackingSyncPanel.
 *  2. handleCustomClientAuthorize() opens a popup to AniList with
 *     redirect_uri = `${origin}/oauth/callback?provider=anilist`.
 *  3. AniList redirects the popup here with `?code=...&state=anilist`.
 *  4. This page sends window.opener.postMessage(...) and closes.
 *  5. TrackingSyncPanel receives the message and calls exchangeCodeForToken().
 *
 * If this page is NOT in a popup (no opener) it shows a plain close prompt.
 */
export default function OAuthCallback() {
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const hashParams = new URLSearchParams(location.hash.substring(1)); // Remove the '#'

        const code = params.get('code');
        const tokenFromHash = hashParams.get('access_token');
        const error = params.get('error') || hashParams.get('error');
        const provider = params.get('provider') || params.get('state') || 'anilist';

        if (!window.opener) {
            return;
        }

        const basePayload = { source: 'beachread-oauth', provider };

        if (error) {
            window.opener.postMessage({ ...basePayload, ok: false, error }, window.location.origin);
        } else if (tokenFromHash) {
            // Implicit Grant Flow
            const expiresIn = parseInt(hashParams.get('expires_in') || '0', 10);
            window.opener.postMessage({
                ...basePayload,
                ok: true,
                accessToken: tokenFromHash,
                tokenExpiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null
            }, window.location.origin);
        } else if (code) {
            // Authorization Code Flow
            window.opener.postMessage({ ...basePayload, ok: true, code }, window.location.origin);
        } else {
            window.opener.postMessage({ ...basePayload, ok: false, error: 'No authorization data received.' }, window.location.origin);
        }

        window.close();
    }, [location.search, location.hash]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#faf9f6]">
            <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full border-2 border-[#8b7e74] border-t-transparent animate-spin mx-auto" />
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#8b7e74]">
                    Completing authentication…
                </p>
                <p className="text-[10px] text-[#8b7e74]/50 font-serif italic">
                    This window will close automatically.
                </p>
            </div>
        </div>
    );
}
