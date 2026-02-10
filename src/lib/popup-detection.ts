/**
 * Popup Blocker Detection
 *
 * Detects if popups are blocked by browser before attempting OAuth.
 * Prevents confusing errors when popups are silently blocked.
 */

/**
 * Checks if popups are likely blocked by browser
 * Returns: true if likely blocked, false if likely allowed
 */
export function isPopupBlocked(): boolean {
    try {
        // Attempt to open a small test window
        const testWindow = window.open("about:blank", "test", "width=1,height=1");

        if (!testWindow) {
            // Popup was blocked
            return true;
        }

        // Popup was allowed - close the test window
        testWindow.close();
        return false;
    } catch (err) {
        // If error occurs, assume popups might be blocked
        return true;
    }
}

/**
 * Safely attempts to open OAuth popup
 * Returns: promise that resolves with window reference or rejects with reason
 */
export async function openOAuthPopup(
    url: string,
    title: string = "Login",
    width: number = 500,
    height: number = 600,
): Promise<Window> {
    return new Promise((resolve, reject) => {
        try {
            // Check if popups are blocked first
            if (isPopupBlocked()) {
                reject(new Error("popup-blocked"));
                return;
            }

            // Calculate popup position (center of screen)
            const left = window.screenX + (window.outerWidth - width) / 2;
            const top = window.screenY + (window.outerHeight - height) / 2;

            // Open the popup
            const popup = window.open(
                url,
                title,
                `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
            );

            if (!popup) {
                reject(new Error("popup-blocked"));
                return;
            }

            // Verify window is accessible
            try {
                popup.focus();
            } catch (err) {
                // Window exists but might be cross-origin
                // This is fine - let it proceed
            }

            resolve(popup);
        } catch (err) {
            reject(new Error("popup-error"));
        }
    });
}
