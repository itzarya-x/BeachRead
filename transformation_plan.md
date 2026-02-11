# Implementation Plan - Yura Frontend Transformation

This plan outlines the steps to transform Yura from a system dashboard into a content-first media discovery platform.

## Phase 1: Design System & Tokens Upgrade
- [ ] Refine `src/index.css` tokens for a more premium, editorial feel (Tasks 10, 11).
- [ ] Implement color behavior: dark neutral base with primary blue for active/important actions only.
- [ ] Update typography: Big bold headers, clean readable metadata.

## Phase 2: Navigation & Layout
- [ ] Rewrite `src/components/layout/AppSidebar.tsx` (Task 1).
    - [ ] Rename sections: Home, Continue, Anime, Manga, Tier Lists, Stats, Activity.
    - [ ] Use friendly labels, thin icons.
    - [ ] Active item: glow + pill background.
- [ ] Implement Mobile Priority navigation (Task 12).
- [ ] Add Floating Quick Add Button (Task 13).

## Phase 3: Media components Redesign
- [ ] Redesign Poster Card (Task 4).
    - [ ] Tall ratio, hover scale, soft shadow.
    - [ ] Progress bar and rating badge.
    - [ ] Hover states with quick actions.
- [ ] Add Micro Interactions (Task 5): Hover lift, click ripple, add bounce.

## Phase 4: Home Page Transformation (Discovery Engine)
- [ ] Create `CinematicHero` component (Task 3).
- [ ] Rewrite Home page (`src/pages/Index.tsx` or similar) (Task 2).
    - [ ] Add horizontal scroll sections: Continue, Recently Updated, Favorites, Trending, etc.
    - [ ] Remove diagnostic dashboard elements.
- [ ] Implement Smart Context/Empty States (Task 6).
- [ ] Reduce Visible Complexity: Hide advanced tools (Task 8, 15).

## Phase 5: Details Page & Stats World
- [ ] Redesign `src/pages/MediaDetail.tsx` for Cinematic Mode (Task 7).
- [ ] Separate Stats into their own "serious space" (Task 14).

## Phase 6: Polish & Scanning
- [ ] Ensure scanning is easy: strong headings, generous spacing (Task 9).
- [ ] Final visual audit against "Product feels human" goal.
