/**
 * Auth Validation Utilities
 *
 * Client-side validation for auth forms.
 * Email format, password strength, etc.
 */

export interface ValidationResult {
    valid: boolean;
    error?: string;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
    if (!email) {
        return { valid: false, error: "Email is required" };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valid: false, error: "Please enter a valid email address" };
    }

    return { valid: true };
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): ValidationResult {
    if (!password) {
        return { valid: false, error: "Password is required" };
    }

    if (password.length < 8) {
        return {
            valid: false,
            error: "Password must be at least 8 characters long",
        };
    }

    // Optional: Require specific character types
    // if (!/[A-Z]/.test(password)) {
    //     return { valid: false, error: "Password must contain an uppercase letter" };
    // }
    // if (!/[a-z]/.test(password)) {
    //     return { valid: false, error: "Password must contain a lowercase letter" };
    // }
    // if (!/\d/.test(password)) {
    //     return { valid: false, error: "Password must contain a number" };
    // }

    return { valid: true };
}

/**
 * Calculate password strength score (0-5)
 */
export function calculatePasswordStrength(password: string): number {
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;

    return Math.min(score, 5);
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(score: number): string {
    if (score <= 1) return "Weak";
    if (score <= 2) return "Fair";
    if (score <= 3) return "Good";
    return "Strong";
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

/**
 * Validate form data object
 */
export function validateFormData(data: Record<string, any>): ValidationResult {
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === "string" && !value.trim()) {
            return {
                valid: false,
                error: `${key} is required`,
            };
        }
    }

    return { valid: true };
}

/**
 * Rate limiting helper (client-side)
 * Tracks attempts with localStorage
 */
export class RateLimiter {
    private key: string;
    private maxAttempts: number;
    private windowMs: number;

    constructor(key: string, maxAttempts: number = 5, windowMs: number = 60000) {
        this.key = `rate_limit_${key}`;
        this.maxAttempts = maxAttempts;
        this.windowMs = windowMs;
    }

    /**
     * Check if action is allowed
     */
    isAllowed(): boolean {
        const now = Date.now();
        const data = this.getData();

        // Clear old attempts
        const recentAttempts = data.attempts.filter((time: number) => now - time < this.windowMs);

        return recentAttempts.length < this.maxAttempts;
    }

    /**
     * Record an attempt
     */
    recordAttempt(): void {
        const now = Date.now();
        const data = this.getData();
        data.attempts.push(now);

        // Keep only recent attempts
        data.attempts = data.attempts.filter((time: number) => now - time < this.windowMs);

        localStorage.setItem(this.key, JSON.stringify(data));
    }

    /**
     * Get remaining attempts
     */
    getRemaining(): number {
        const now = Date.now();
        const data = this.getData();
        const recentAttempts = data.attempts.filter((time: number) => now - time < this.windowMs);

        return Math.max(0, this.maxAttempts - recentAttempts.length);
    }

    /**
     * Get time until next attempt is allowed (ms)
     */
    getResetTime(): number {
        const now = Date.now();
        const data = this.getData();

        if (data.attempts.length === 0) {
            return 0;
        }

        const oldestAttempt = Math.min(...data.attempts);
        const resetTime = oldestAttempt + this.windowMs;

        return Math.max(0, resetTime - now);
    }

    /**
     * Reset rate limiter
     */
    reset(): void {
        localStorage.removeItem(this.key);
    }

    /**
     * Get stored data
     */
    private getData() {
        try {
            const stored = localStorage.getItem(this.key);
            return stored ? JSON.parse(stored) : { attempts: [] };
        } catch {
            return { attempts: [] };
        }
    }
}
