const PROXY_API_BASE_URL = '/api';
const DIRECT_API_BASE_URL = import.meta.env.VITE_API_URL?.trim() || 'http://localhost:3001/api';

function shouldRetryViaDirectBase(initialBase: string, status: number): boolean {
    if (!DIRECT_API_BASE_URL) return false;
    if (initialBase !== PROXY_API_BASE_URL) return false;
    return status === 502 || status === 503 || status === 504;
}

export class ApiError extends Error {
    status: number;
    data?: unknown;

    constructor(status: number, message: string, data?: unknown) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

async function handleResponse(response: Response) {
    if (!response.ok) {
        let data;
        try {
            data = await response.json();
        } catch {
            data = null;
        }
        throw new ApiError(response.status, data?.message || `HTTP error! status: ${response.status}`, data);
    }
    return response.json();
}

async function safeFetch(input: RequestInfo | URL, init?: RequestInit) {
    try {
        return await fetch(input, init);
    } catch (error) {
        throw new ApiError(0, 'Network error: API server unreachable', error);
    }
}

export const apiClient = {
    async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
        const response = await safeFetch(`${PROXY_API_BASE_URL}${endpoint}`, {
            ...options,
            method: 'GET',
            headers,
        });
        if (shouldRetryViaDirectBase(PROXY_API_BASE_URL, response.status)) {
            const retryResponse = await safeFetch(`${DIRECT_API_BASE_URL}${endpoint}`, {
                ...options,
                method: 'GET',
                headers,
            });
            return handleResponse(retryResponse);
        }
        return handleResponse(response);
    },

    async post<T>(endpoint: string, body?: unknown, options: RequestInit = {}): Promise<T> {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
        const response = await safeFetch(`${PROXY_API_BASE_URL}${endpoint}`, {
            ...options,
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });
        if (shouldRetryViaDirectBase(PROXY_API_BASE_URL, response.status)) {
            const retryResponse = await safeFetch(`${DIRECT_API_BASE_URL}${endpoint}`, {
                ...options,
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });
            return handleResponse(retryResponse);
        }
        return handleResponse(response);
    },

    async patch<T>(endpoint: string, body?: unknown, options: RequestInit = {}): Promise<T> {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
        const response = await safeFetch(`${PROXY_API_BASE_URL}${endpoint}`, {
            ...options,
            method: 'PATCH',
            headers,
            body: JSON.stringify(body),
        });
        if (shouldRetryViaDirectBase(PROXY_API_BASE_URL, response.status)) {
            const retryResponse = await safeFetch(`${DIRECT_API_BASE_URL}${endpoint}`, {
                ...options,
                method: 'PATCH',
                headers,
                body: JSON.stringify(body),
            });
            return handleResponse(retryResponse);
        }
        return handleResponse(response);
    },

    async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
        const response = await safeFetch(`${PROXY_API_BASE_URL}${endpoint}`, {
            ...options,
            method: 'DELETE',
            headers,
        });
        if (shouldRetryViaDirectBase(PROXY_API_BASE_URL, response.status)) {
            const retryResponse = await safeFetch(`${DIRECT_API_BASE_URL}${endpoint}`, {
                ...options,
                method: 'DELETE',
                headers,
            });
            return handleResponse(retryResponse);
        }
        return handleResponse(response);
    }
};

export const publicApiClient = apiClient;
