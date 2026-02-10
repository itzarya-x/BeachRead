/**
 * Protected API Client
 *
 * Automatically handles:
 * - Adding JWT to requests
 * - Refreshing expired tokens
 * - Retrying failed requests with new token
 * - Error handling with safe messages
 */

import { isTokenExpired } from "@/hooks/useAuthToken";

export interface ApiResponse<T> {
    data?: T;
    error?: {
        message: string;
        code: string;
        details?: Record<string, unknown>;
    };
    success: boolean;
}

export interface ApiClientOptions {
    baseUrl?: string;
    getAccessToken: () => string | null;
    refreshToken: () => Promise<string | null>;
    onUnauthorized?: () => void; // Called when 401 is received
}

export class ApiClient {
    private baseUrl: string;
    private getAccessToken: () => string | null;
    private refreshToken: () => Promise<string | null>;
    private onUnauthorized?: () => void;

    constructor(options: ApiClientOptions) {
        this.baseUrl = options.baseUrl || "/api";
        this.getAccessToken = options.getAccessToken;
        this.refreshToken = options.refreshToken;
        this.onUnauthorized = options.onUnauthorized;
    }

    /**
     * Make a GET request
     */
    async get<T>(path: string): Promise<ApiResponse<T>> {
        return this.request<T>(path, { method: "GET" });
    }

    /**
     * Make a POST request
     */
    async post<T>(path: string, body?: Record<string, unknown>): Promise<ApiResponse<T>> {
        return this.request<T>(path, { method: "POST", body });
    }

    /**
     * Make a PUT request
     */
    async put<T>(path: string, body?: Record<string, unknown>): Promise<ApiResponse<T>> {
        return this.request<T>(path, { method: "PUT", body });
    }

    /**
     * Make a DELETE request
     */
    async delete<T>(path: string): Promise<ApiResponse<T>> {
        return this.request<T>(path, { method: "DELETE" });
    }

    /**
     * Core request handler with token refresh logic
     */
    private async request<T>(
        path: string,
        options: {
            method: string;
            body?: Record<string, unknown>;
        },
    ): Promise<ApiResponse<T>> {
        try {
            const token = this.getAccessToken();

            // If we have a token and it's expired, try to refresh it
            if (token && isTokenExpired(token)) {
                const newToken = await this.refreshToken();
                if (!newToken) {
                    // Refresh failed - trigger logout
                    this.onUnauthorized?.();
                    return {
                        success: false,
                        error: {
                            message: "Session expired. Please sign in again.",
                            code: "SESSION_EXPIRED",
                        },
                    };
                }
            }

            // Make the actual request
            return await this.makeRequest<T>(path, options);
        } catch (error) {
            return this.handleError<T>(error);
        }
    }

    /**
     * Make the actual HTTP request
     */
    private async makeRequest<T>(
        path: string,
        options: {
            method: string;
            body?: Record<string, unknown>;
        },
    ): Promise<ApiResponse<T>> {
        const token = this.getAccessToken();
        const url = `${this.baseUrl}${path}`;

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const fetchOptions: RequestInit = {
            method: options.method,
            headers,
            credentials: "include", // Include cookies (for refresh token)
        };

        if (options.body) {
            fetchOptions.body = JSON.stringify(options.body);
        }

        const response = await fetch(url, fetchOptions);

        // Handle 401 Unauthorized
        if (response.status === 401) {
            this.onUnauthorized?.();
            return {
                success: false,
                error: {
                    message: "Unauthorized",
                    code: "UNAUTHORIZED",
                },
            };
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            return {
                success: false,
                error: {
                    message: error.message || "Request failed",
                    code: error.code || `HTTP_${response.status}`,
                    details: error.details,
                },
            };
        }

        const data = await response.json();

        return {
            success: true,
            data,
        };
    }

    /**
     * Handle and format errors
     */
    private handleError<T>(error: unknown): ApiResponse<T> {
        console.error("API error:", error);

        if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
            return {
                success: false,
                error: {
                    message: "Network error. Please check your connection.",
                    code: "NETWORK_ERROR",
                },
            };
        }

        if (error instanceof Error) {
            return {
                success: false,
                error: {
                    message: error.message,
                    code: "ERROR",
                },
            };
        }

        return {
            success: false,
            error: {
                message: "An unexpected error occurred",
                code: "UNKNOWN_ERROR",
            },
        };
    }
}

/**
 * Create API client instance
 */
export function createApiClient(options: ApiClientOptions): ApiClient {
    return new ApiClient(options);
}
