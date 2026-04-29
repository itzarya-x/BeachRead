import type { MediaType } from '../../../shared/types/types';

export interface MangaResult {
    id: string;
    title: string;
    genres: string[];
    coverUrl: string;
    score?: number;
    popularity?: number;
    description?: string;
    format?: string;
    status?: string;
    year?: number;
    episodes?: number; // Chapters / Episodes
    mediaType?: MediaType;
}
