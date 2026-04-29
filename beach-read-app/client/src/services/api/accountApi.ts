import { supabase, mapSupabaseUser, isSupabaseConfigured } from '../../shared/api/supabaseClient';
import { syncPublicProfileIdentity } from '../../features/profile/api/publicProfile';
import { normalizeUsername } from '../../features/profile/utils/profileUsername';
import type { AuthContextUser } from '../../shared/types/types';

export async function uploadUserAvatar(userId: string, file: File): Promise<string> {
    if (!isSupabaseConfigured()) throw new Error('Supabase auth is not configured.');
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileExt) ? fileExt : 'jpg';
    const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

    const { error: uploadError } = await supabase!.storage
        .from('avatars')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) throw uploadError;

    const { data } = supabase!.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
}

export async function uploadUserBanner(userId: string, file: File): Promise<string> {
    if (!isSupabaseConfigured()) throw new Error('Supabase auth is not configured.');
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileExt) ? fileExt : 'jpg';
    const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

    const { error: uploadError } = await supabase!.storage
        .from('banners')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) throw uploadError;

    const { data } = supabase!.storage.from('banners').getPublicUrl(filePath);
    return data.publicUrl;
}

export async function updateUserMetadata(patch: Partial<AuthContextUser>, userEmail?: string): Promise<AuthContextUser | null> {
    if (!isSupabaseConfigured()) throw new Error('Supabase auth is not configured.');

    const metadataPatch: Record<string, any> = {};
    if (patch.displayName !== undefined) metadataPatch.name = patch.displayName || 'Beach Explorer';
    if (patch.username !== undefined) metadataPatch.username = normalizeUsername(patch.username, patch.email || userEmail || 'beachreader');
    if (patch.avatarUrl !== undefined) metadataPatch.avatar_url = patch.avatarUrl || null;
    if (patch.bannerUrl !== undefined) metadataPatch.banner_url = patch.bannerUrl || null;
    if (patch.bio !== undefined) metadataPatch.bio = patch.bio || null;
    if (patch.location !== undefined) metadataPatch.location = patch.location || null;
    if (patch.website !== undefined) metadataPatch.website = patch.website || null;
    if (patch.twitterHandle !== undefined) metadataPatch.twitter_handle = patch.twitterHandle || null;
    if (patch.isPrivate !== undefined) metadataPatch.is_private = patch.isPrivate;
    if (patch.showStats !== undefined) metadataPatch.show_stats = patch.showStats;
    if (patch.customColors !== undefined) metadataPatch.custom_colors = patch.customColors;
    if (patch.favoriteCharacters !== undefined) metadataPatch.favorite_characters = patch.favoriteCharacters;
    if (patch.favoriteMangaOrder !== undefined) metadataPatch.favorite_manga_order = patch.favoriteMangaOrder;
    if (patch.pinnedMangaIds !== undefined) metadataPatch.pinned_manga_ids = patch.pinnedMangaIds;
    if (patch.profileSections !== undefined) metadataPatch.profile_sections = patch.profileSections;
    if (patch.profilePrivacy !== undefined) metadataPatch.profile_privacy = patch.profilePrivacy;
    if (patch.featuredCollections !== undefined) metadataPatch.featured_collections = patch.featuredCollections;
    if (patch.snapshotCards !== undefined) metadataPatch.snapshot_cards = patch.snapshotCards;
    if (patch.nowReadingId !== undefined) metadataPatch.now_reading_id = patch.nowReadingId;
    if (patch.hasOnboarded !== undefined) metadataPatch.has_onboarded = patch.hasOnboarded;
    if (patch.preferences !== undefined) metadataPatch.preferences = patch.preferences;

    const { data, error: updateError } = await supabase!.auth.updateUser({
        data: metadataPatch,
    });

    if (updateError) throw updateError;

    const nextUser = mapSupabaseUser(data.user);
    if (nextUser) {
        await syncPublicProfileIdentity(nextUser);
    }
    return nextUser;
}
