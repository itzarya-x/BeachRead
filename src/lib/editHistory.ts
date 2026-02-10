/**
 * TASK 8: Edit History Tracking
 * 
 * Track: who changed, what changed, when
 * Allow user to undo
 */

import type { DisplayMedia } from "@/types/display";

export interface EditHistoryEntry {
    id: string;
    entryId: number;
    userId: string | number;
    timestamp: number;
    action: "create" | "update" | "delete";
    before: Partial<DisplayMedia> | null;
    after: Partial<DisplayMedia> | null;
    field: string; // Which field changed (e.g., "score", "status", "progress")
    oldValue: any;
    newValue: any;
}

class EditHistoryManager {
    private history: EditHistoryEntry[] = [];
    private maxHistory = 1000; // Limit history size
    private storageKey = "yura_edit_history";

    constructor() {
        this.loadFromStorage();
    }

    /**
     * Record an edit
     */
    recordEdit(
        entryId: number,
        userId: string | number,
        action: "create" | "update" | "delete",
        before: Partial<DisplayMedia> | null,
        after: Partial<DisplayMedia> | null,
        field?: string,
        oldValue?: any,
        newValue?: any
    ): void {
        const entry: EditHistoryEntry = {
            id: `${Date.now()}-${Math.random()}`,
            entryId,
            userId,
            timestamp: Date.now(),
            action,
            before,
            after,
            field: field || "multiple",
            oldValue,
            newValue,
        };

        this.history.unshift(entry);
        
        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history = this.history.slice(0, this.maxHistory);
        }

        this.saveToStorage();
    }

    /**
     * Get history for a specific entry
     */
    getEntryHistory(entryId: number): EditHistoryEntry[] {
        return this.history.filter(e => e.entryId === entryId);
    }

    /**
     * Get recent history
     */
    getRecentHistory(limit: number = 50): EditHistoryEntry[] {
        return this.history.slice(0, limit);
    }

    /**
     * Get history by user
     */
    getUserHistory(userId: string | number, limit: number = 50): EditHistoryEntry[] {
        return this.history.filter(e => e.userId === userId).slice(0, limit);
    }

    /**
     * Undo last edit for an entry
     */
    getLastEdit(entryId: number): EditHistoryEntry | null {
        return this.history.find(e => e.entryId === entryId) || null;
    }

    /**
     * Clear history
     */
    clearHistory(): void {
        this.history = [];
        this.saveToStorage();
    }

    /**
     * Load from localStorage
     */
    private loadFromStorage(): void {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.history = JSON.parse(stored);
            }
        } catch (err) {
            console.warn("Failed to load edit history:", err);
        }
    }

    /**
     * Save to localStorage
     */
    private saveToStorage(): void {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.history));
        } catch (err) {
            console.warn("Failed to save edit history:", err);
        }
    }
}

export const editHistory = new EditHistoryManager();
