# GDPR Field Coverage Table

This document maps every GDPR-defined field to its usage in the Yura statistics system.

## GDPR List Entry Fields

| GDPR Field | Path | Current Usage | Status | Panel/Function |
|------------|------|---------------|--------|----------------|
| `id` | `entry.id` | Entry identification | ✅ **MAPPED** | Stored as `_entryId` in DisplayMedia |
| `user_id` | `entry.user_id` | User identification | ✅ **MAPPED** | Stored as `_userId` in DisplayMedia |
| `series_id` | `entry.series_id` | Media identification | ✅ **MAPPED** | Stored as `_seriesId`, used in all stats, drill-down |
| `series_type` | `entry.series_type` | Anime/Manga filtering | ✅ **MAPPED** | Parsed to `mediaType`, used in filters and all panels |
| `status` | `entry.status` | Status distribution | ✅ **MAPPED** | Parsed to `status`, used in StatusChart, StatusBreakdown, filtering |
| `score` | `entry.score` | Score metrics | ✅ **MAPPED** | Stored as `score`, used in ScoreChart, meanScore, stdDeviation |
| `progress` | `entry.progress` | Episodes/chapters watched | ✅ **MAPPED** | Stored as `progress`, used in episodesWatched, chaptersRead |
| `progress_volume` | `entry.progress_volume` | Volumes read | ✅ **MAPPED** | Stored as `progressVolumes`, used in volumesRead (manga) |
| `priority` | `entry.priority` | Priority distribution | ✅ **MAPPED** | Stored as `priority`, used in PriorityDistributionPanel, tier filter |
| `repeat` | `entry.repeat` | Rewatch/reread analysis | ✅ **MAPPED** | Stored as `repeat`, used in RewatchPanel |
| `private` | `entry.private` | Visibility statistics | ✅ **MAPPED** | Stored as `isPrivate`, used in VisibilityPanel |
| `notes` | `entry.notes` | Notes analysis | ✅ **MAPPED** | Stored as `notes`, used in NotesAnalysisPanel (Panel R) |
| `custom_lists` | `entry.custom_lists` | Custom list usage | ✅ **MAPPED** | Parsed to `customLists[]`, used in CustomListPanel, custom list filter |
| `advanced_scores` | `entry.advanced_scores` | Advanced scoring breakdown | ✅ **MAPPED** | Parsed to `advancedScores[]`, used in AdvancedScoresPanel (Panel S) |
| `hidden_default` | `entry.hidden_default` | Hidden items tracking | ✅ **MAPPED** | Stored as `hiddenDefault`, used in HiddenItemsPanel (Panel T) |
| `started_on` | `entry.started_on` | Activity timeline | ✅ **MAPPED** | Parsed to `startedAt`, used in ActivityTimelinePanel |
| `finished_on` | `entry.finished_on` | Activity timeline | ✅ **MAPPED** | Parsed to `completedAt`, used in ActivityTimelinePanel |
| `created_at` | `entry.created_at` | Entry creation tracking | ✅ **MAPPED** | Stored as `createdAt`, used in ActivityTimelinePanel |
| `updated_at` | `entry.updated_at` | Last update tracking | ✅ **MAPPED** | Stored as `updatedAt`, used in ActivityTimelinePanel |

## GDPR User Fields

| GDPR Field | Path | Current Usage | Status | Panel/Function |
|------------|------|---------------|--------|----------------|
| `id` | `user.id` | User identification | ✅ **MAPPED** | Stored in DisplayUser (internal) |

## GDPR Favourites Array

| GDPR Field | Path | Current Usage | Status | Panel/Function |
|------------|------|---------------|--------|----------------|
| `favourites` | `favourites[]` | Favourites breakdown | ✅ **MAPPED** | FavouritesPanel (Panel M), favourites filter |
| `favourite_id` | `favourites[].favourite_id` | ID of favourited item | ✅ **MAPPED** | Used to match with media items |
| `favourite_type` | `favourites[].favourite_type` | Type (1=anime, 2=manga, 3=character, 4=staff, 5=studio) | ✅ **MAPPED** | Grouped by type in FavouritesPanel |
| `order` | `favourites[].order` | Display order | ✅ **MAPPED** | Stored for future sorting |
| `user_name` | `user.user_name` | Username/login | ✅ **MAPPED** | Stored as `userName` in DisplayUser |
| `display_name` | `user.display_name` | Display name | ✅ **MAPPED** | Stored as `displayName` in DisplayUser |
| `email` | `user.email` | Email address | ✅ **MAPPED** | Stored as `email` in DisplayUser |
| `about` | `user.about` | User bio | ✅ **MAPPED** | Stored as `about` in DisplayUser |
| `avatar_url` | `user.avatar_url` | Avatar image | ✅ **MAPPED** | Stored as `avatarUrl` in DisplayUser |
| `banner_url` | `user.banner_url` | Banner image | ✅ **MAPPED** | Stored as `bannerUrl` in DisplayUser |
| `profile_color` | `user.profile_color` | Profile theme color | ✅ **MAPPED** | Stored as `profileColor` in DisplayUser |
| `title_language` | `user.title_language` | Title display preference | ✅ **MAPPED** | Stored as `titleLanguage`, used in display logic |
| `score_type` | `user.score_type` | Score format | ✅ **MAPPED** | Stored as `scoreFormat`, used in ScoreChart formatting |
| `list_order` | `user.list_order` | List ordering preference | ✅ **MAPPED** | Stored as `listOrder` in DisplayUser |
| `forum_homepage` | `user.forum_homepage` | Forum homepage setting | ✅ **MAPPED** | Stored as `forumHomepage` in DisplayUser |
| `adult_content` | `user.adult_content` | Adult content setting | ✅ **MAPPED** | Stored as `adultContent` (boolean) in DisplayUser |
| `legacy_lists` | `user.legacy_lists` | Legacy lists setting | ✅ **MAPPED** | Stored as `legacyLists` (boolean) in DisplayUser |
| `donator` | `user.donator` | Donator status | ✅ **MAPPED** | Stored as `donator` in DisplayUser |
| `donator_badge` | `user.donator_badge` | Donator badge | ✅ **MAPPED** | Stored as `donatorBadge` in DisplayUser |
| `notifications` | `user.notifications` | Notification settings | ✅ **MAPPED** | Stored as `notifications` in DisplayUser |
| `airing_notifications` | `user.airing_notifications` | Airing notifications | ✅ **MAPPED** | Stored as `airingNotifications` (boolean) in DisplayUser |
| `privacy` | `user.privacy` | Privacy setting | ✅ **MAPPED** | Stored as `privacy` (boolean) in DisplayUser |
| `notification_options` | `user.notification_options` | Notification options | ✅ **MAPPED** | Stored as `notificationOptions` in DisplayUser |
| `mod_roles` | `user.mod_roles` | Moderator roles | ✅ **MAPPED** | Stored as `modRoles` in DisplayUser |
| `ip` | `user.ip` | IP address | ✅ **MAPPED** | Stored as `ip` in DisplayUser |
| `created_at` | `user.created_at` | Account creation date | ✅ **MAPPED** | Stored as `createdAt` in DisplayUser |
| `updated_at` | `user.updated_at` | Last update date | ✅ **MAPPED** | Stored as `updatedAt` in DisplayUser |
| `anime_watched` | `user.anime_watched` | Historical anime count | ✅ **MAPPED** | Stored as `animeWatched` in DisplayUser (reference only) |
| `chapters_read` | `user.chapters_read` | Historical chapters count | ✅ **MAPPED** | Stored as `chaptersRead` in DisplayUser (reference only) |
| `custom_lists` | `user.custom_lists` | Custom list names | ✅ **MAPPED** | Stored as `customListNames` in DisplayUser, used in CustomListPanel |
| `advanced_scores` | `user.advanced_scores` | Advanced score config | ✅ **MAPPED** | Stored as `advancedScoresActive` and `advancedScoresNames` in DisplayUser |
| `hidden_categories` | `user.hidden_categories` | Hidden categories | ✅ **MAPPED** | Stored as `hiddenCategories` in DisplayUser |
| `stats` | `user.stats` | Historical stats | ✅ **MAPPED** | Stored as `activityHistory`, `statusDistribution`, `scoreDistribution` in DisplayUser |
| `statistics` | `user.statistics` | Historical statistics JSON | ✅ **MAPPED** | Parsed and stored as `statistics` in DisplayUser (reference only) |

## Coverage Summary

- **Total GDPR Entry Fields**: 20
- **Fields Mapped to Database**: 20 (100%) ✅
- **Fields Used in Stats/UI**: 20 (100%) ✅
- **Fields with Statistics Panels**: 18 (90%)
  - All measurable fields have dedicated panels
  - `id` and `user_id` are stored but not displayed (internal tracking only)

## Action Items

1. ✅ **COMPLETED**: All GDPR entry fields mapped to DisplayMedia
2. ✅ **COMPLETED**: NotesAnalysisPanel created (Panel R)
3. ✅ **COMPLETED**: AdvancedScoresPanel created (Panel S)
4. ✅ **COMPLETED**: HiddenItemsPanel created (Panel T)
5. ✅ **COMPLETED**: Entry ID and User ID stored in database (`_entryId`, `_userId`)

## Implementation Notes

- All used fields are traceable via `MetricWithItems`
- All used fields support drill-down to contributing items
- Unused fields will be implemented with full traceability following Phase 4 requirements
