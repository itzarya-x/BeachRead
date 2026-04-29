# Project Design Document: BeachRead Sanctuary

## 1. Product Overview
BeachRead is a premium, high-fidelity media tracking and archival platform designed for enthusiasts of Japanese media (Manga, Anime, Light Novels). Unlike generic trackers, BeachRead positions itself as a "Sanctuary"—a private, aesthetic space for reflection and curation.

* **Core Purpose**: To transform the functional task of media tracking into an aesthetic, ritualistic experience of "archiving memories."
* **Primary User Type**: Collectors, curators, and completionists who value visual presentation and emotional connection to their library over raw data entry.
* **Main Workflows**:
    * **Archival**: Syncing and managing a library from AniList/MAL.
    * **Reflection**: Writing "Diary" entries (notes) with emotional tags and quotes.
    * **Curation**: Organizing media into "Partitions" or "Collections."
    * **Discovery**: Exploring new titles through high-density "Projection Rooms" and "Paper Shelves."

## 2. Visual Design Analysis
Based on the provided archival themes and current UI:

* **Layout Breakdown**:
    * **Editorial Hierarchy**: Uses large, bold typography (serif and display fonts) to create a magazine-like feel.
    * **Themed Sub-systems**: The application supports radically different visual "skins" (Swiss, Cyber, Journal, Bauhaus) that alter everything from spacing to background textures.
    * **Tactile Elements**: Use of dot grids, paper textures, "sticky note" cards, and handwritten fonts to mimic analog journals.
* **UI Zones**:
    * **The Veranda (Home)**: A personalized dashboard for "Continuing the Journey."
    * **The Archive (Library)**: A high-density table or grid view for organizational protocol.
    * **The Diary (Journal)**: A chronological timeline of reflections.
* **Strengths**: Exceptionally strong brand identity; moving away from the "utility" look of MyAnimeList towards a "boutique" experience.
* **Weaknesses**: The high visual density and radical theme changes may introduce usability hurdles if layout patterns aren't strictly consistent across skins.

## 3. Current Codebase Architecture
* **Tech Stack**:
    * **Frontend**: React 19 (TypeScript), Vite, Tailwind CSS v4, Framer Motion.
    * **Backend**: Node.js Express (API Proxy), Supabase (PostgreSQL, Auth, Real-time).
    * **Integrations**: AniList GraphQL API, MyAnimeList OAuth.
* **Frontend Structure**: Feature-sliced architecture (`features/auth`, `features/library`, etc.) with a strong `shared/ui` library.
* **State Management**: React Context for Auth, TanStack Query (v5) for data fetching and persistence.
* **Theme System**: Driven by `UserPreferences` that inject `tactileClasses` (font-style, texture, atmosphere) into the root `App` component, combined with Tailwind v4 `@theme` variables.

## 4. Existing Features
* **External Provider Sync**: Bi-directional sync with AniList/MAL via OAuth.
* **Theme Switching**: Global support for different design languages (Tactile, Atmospheric).
* **Diary/Journaling**: Ability to attach notes, quotes, and emotions to specific progress markers (chapters/episodes).
* **Advanced Search**: Filtered discovery by genre, demographic, status, and format.
* **Sanctuary Analytics**: Visualized snapshots of collection size, completion rates, and genre density.
* **Collections/Partitions**: Custom user-defined lists for deep curation.

## 5. UX Analysis
* **Friction Points**: The transition between the high-fidelity "Sanctuary" pages and standard settings/admin menus can feel jarring.
* **Confusing Flows**: Sync conflicts (Archive Integrity) require a manual "Restore Balance" step which may be technical for some users.
* **Scalability**: High-density grids with large images may suffer from performance lag on lower-end devices without aggressive virtualization.
* **Onboarding**: The "Tactile" language (e.g., "Initialize Partition") is flavorful but may require a brief onboarding tool-tip to explain the literal function (Create Collection).

## 6. Design Language Recommendation
* **Spacing System**: Maintain the generous, editorial whitespace used in the "Swiss" and "Green" themes to prevent the high-density data from feeling cluttered.
* **Typography Scale**: Continue the contrast between heavy display fonts (Swiss Bold, Serif Italic) and crisp monospaced metadata.
* **Panel Behavior**: Use the `Surface` component's "Glass" and "Paper" variants to differentiate between utility panels (settings) and content panels (cards).
* **Command Surfaces**: Implement a global command palette (Kbar style) to allow power users to switch themes and partitions instantly.
* **Empty States**: Every empty state should follow the "Veranda" aesthetic—calm, atmospheric, and inviting (e.g., "The veranda is peaceful").

## 7. Engineering Recommendations
* **Theme Modularization**: Extract the CSS for major themes (Swiss, Bauhaus, Cyber) into a scoped "Theme Library" to prevent the main `index.css` from bloating.
* **Image Proxying**: The current `/api/image` proxy is a great start; consider implementing edge-caching for cover images to improve load times for large archives.
* **Virtualization**: Implement `tanstack/react-virtual` in the "The Reading Room" and "Archive" views to handle users with 1000+ entries.
* **Type Safety**: Ensure `supabaseSchema.ts` is strictly generated from the database to prevent runtime errors during domain migrations.

## 8. Roadmap Priority

### Immediate
* Fix "Archive Integrity" sync race conditions.
* Complete the mobile-responsive layouts for the custom themes (Swiss/Bauhaus).
* Implement "Quick Note" from the Home dashboard.

### Next 30 Days
* Add "Atmosphere" effects (CSS-based rain/petals).
* Expand "Curation" features to allow drag-and-drop reordering within partitions.
* Integrate character-based discovery (recommendations based on "Beloved Figures").

### Long-Term
* Public Profile "Guestbooks" or "Social Echoes."
* Native mobile wrappers (Capacitor/Tauri) for a dedicated sanctuary app.
* Advanced "Journey" visualizations (interactive timelines of a user's reading history).

## 9. Competitive Positioning
* **Comparison**:
    * **Warp/Raycast**: BeachRead mimics their high-performance, shortcut-driven navigation for power users.
    * **Notion/Journaling Apps**: Rivals their aesthetic flexibility and "analog" feel.
    * **AniList/MAL**: BeachRead acts as a "Premium Head-end" for these services, providing a vastly superior UI while using them as the source of truth.

## 10. Final Verdict
BeachRead is currently at a **Premium Prototype** level. It has successfully moved beyond a simple CRUD app into a cohesive "vibe-driven" product. Its biggest strength is the **Tactile Theme Engine**, which makes the act of checking a box feel like a creative act. The path to a "Premium Product" involves hardening the sync engine and ensuring that the radical visual styles remain accessible and performant at scale.
