/**
 * TASK 6 & 7: Realtime State Management
 * 
 * Every mutation → invalidate stats → recompute
 * Stats use Yura DB (not AniList)
 * 
 * Uses React-based state management (works without Zustand)
 */

import type { DisplayMedia } from "@/types/display";
import { useState, useRef, useEffect } from "react";

interface MediaStore {
    // Data
    animeList: DisplayMedia[];
    mangaList: DisplayMedia[];
    
    // Stats invalidation counter (increment to trigger recomputation)
    statsVersion: number;
    
    // Selection for mass edit (TASK 9)
    selectedEntries: Set<number>;
    
    // Actions
    setAnimeList: (list: DisplayMedia[]) => void;
    setMangaList: (list: DisplayMedia[]) => void;
    addEntry: (entry: DisplayMedia) => void;
    updateEntry: (entryId: number, updates: Partial<DisplayMedia>) => void;
    deleteEntry: (entryId: number) => void;
    invalidateStats: () => void;
    
    // Selection (TASK 9)
    toggleSelection: (entryId: number) => void;
    selectAll: (entryIds: number[]) => void;
    clearSelection: () => void;
    isSelected: (entryId: number) => boolean;
}

// Global state (singleton pattern)
let globalState: MediaStore = {
    animeList: [],
    mangaList: [],
    statsVersion: 0,
    selectedEntries: new Set<number>(),
    setAnimeList: () => {},
    setMangaList: () => {},
    addEntry: () => {},
    updateEntry: () => {},
    deleteEntry: () => {},
    invalidateStats: () => {},
    toggleSelection: () => {},
    selectAll: () => {},
    clearSelection: () => {},
    isSelected: () => false,
};

const listeners = new Set<() => void>();

function notifyListeners() {
    listeners.forEach(listener => listener());
}

function setState(updates: Partial<MediaStore>) {
    globalState = { ...globalState, ...updates };
    notifyListeners();
}

function getState(): MediaStore {
    return globalState;
}

// Initialize state with proper functions
function initializeState() {
    globalState = {
        animeList: [],
        mangaList: [],
        statsVersion: 0,
        selectedEntries: new Set<number>(),
        setAnimeList: (list) => {
            setState({ animeList: list });
            getState().invalidateStats();
        },
        setMangaList: (list) => {
            setState({ mangaList: list });
            getState().invalidateStats();
        },
        addEntry: (entry) => {
            const list = entry.mediaType === "ANIME" ? "animeList" : "mangaList";
            const current = getState()[list];
            setState({ [list]: [...current, entry] });
            getState().invalidateStats();
        },
        updateEntry: (entryId, updates) => {
            const animeList = getState().animeList.map(e => 
                e._entryId === entryId ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
            );
            const mangaList = getState().mangaList.map(e => 
                e._entryId === entryId ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
            );
            setState({ animeList, mangaList });
            getState().invalidateStats();
        },
        deleteEntry: (entryId) => {
            setState({
                animeList: getState().animeList.filter(e => e._entryId !== entryId),
                mangaList: getState().mangaList.filter(e => e._entryId !== entryId),
                selectedEntries: new Set([...getState().selectedEntries].filter(id => id !== entryId)),
            });
            getState().invalidateStats();
        },
        invalidateStats: () => {
            setState({ statsVersion: getState().statsVersion + 1 });
        },
        toggleSelection: (entryId) => {
            const selected = new Set(getState().selectedEntries);
            if (selected.has(entryId)) {
                selected.delete(entryId);
            } else {
                selected.add(entryId);
            }
            setState({ selectedEntries: selected });
        },
        selectAll: (entryIds) => {
            setState({ selectedEntries: new Set(entryIds) });
        },
        clearSelection: () => {
            setState({ selectedEntries: new Set() });
        },
        isSelected: (entryId) => {
            return getState().selectedEntries.has(entryId);
        },
    };
}

// Initialize immediately
initializeState();

// React hook for using the store
export function useMediaStore(): MediaStore {
    const [, forceUpdate] = useState(0);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        const listener = () => {
            if (mountedRef.current) {
                forceUpdate(n => n + 1);
            }
        };
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
            mountedRef.current = false;
        };
    }, []);

    return globalState;
}

// Get state without subscription (for use outside components)
export function getMediaStoreState(): MediaStore {
    return globalState;
}

/**
 * Subscribe to mutations for stats recomputation
 */
export function subscribeToMutations(callback: () => void) {
    const listener = () => {
        callback();
    };
    listeners.add(listener);
    return () => listeners.delete(listener);
}
