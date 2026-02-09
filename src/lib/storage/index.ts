/**
 * Storage Manager
 *
 * Provides a singleton storage provider instance.
 * Can be switched between local and cloud implementations.
 *
 * Usage:
 *   const storage = getStorageProvider();
 *   await storage.saveUserEntry(entry);
 */

import { CloudStorageProvider } from "./cloud";
import { LocalStorageProvider } from "./local";
import type { IStorageProvider } from "./types";

let storageProvider: IStorageProvider | null = null;

/**
 * Initialize storage provider
 *
 * @param useCloud - Use cloud storage (with local fallback) or local only
 */
export async function initializeStorageProvider(useCloud: boolean = false): Promise<IStorageProvider> {
    if (!storageProvider) {
        storageProvider = useCloud ? new CloudStorageProvider() : new LocalStorageProvider();
        await storageProvider.initialize();
    }
    return storageProvider;
}

/**
 * Get the current storage provider
 */
export function getStorageProvider(): IStorageProvider {
    if (!storageProvider) {
        throw new Error("Storage provider not initialized. Call initializeStorageProvider() first.");
    }
    return storageProvider;
}

/**
 * Check if storage is ready
 */
export function isStorageReady(): boolean {
    return storageProvider?.isReady() ?? false;
}

/**
 * Reset storage provider (for testing)
 */
export function resetStorageProvider(): void {
    storageProvider = null;
}

/**
 * Switch storage provider implementation
 */
export async function switchStorageProvider(useCloud: boolean): Promise<void> {
    resetStorageProvider();
    await initializeStorageProvider(useCloud);
}
