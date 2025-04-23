# Social-Sharing + Dynamic Open-Graph Images

This feature adds friction-free social-sharing (Twitter/X, Facebook, LinkedIn, Threads, Reddit, Copy-link, etc.) and dynamic OG images that showcase each piece of content (podcast, episode, video, athlete) with "The Run Club" branding.

---

## Completed Tasks

- [x] Project already generates metadata objects for most pages (title, description, etc.)
- [x] Task #1: Create UI share bar component (`src/components/share-bar/ShareBar.tsx`) with Shadcn buttons, copy-to-clipboard & native share API fallback (Toasts temporarily disabled)
- [x] Task #3: Design OG template - Created reusable OG Image Template component (`src/components/og/OgImageTemplate.tsx`)
- [x] Task #4: Add global fallback images - Created dynamic routes `src/app/opengraph-image.tsx` and `src/app/twitter-image.tsx`
- [x] Task #5: Build helper `src/lib/getContent.ts` that returns `{ title, coverImage, type }` for a given slug & type, using Drizzle + Supabase
- [x] Task #6: Generate dynamic OG routes (`app/.../opengraph-image.tsx` for podcasts, episodes, videos, athletes)
- [x] Task #7: Wire `generateMetadata` in page files to reference dynamic OG routes and update image dimensions

## In-Progress Tasks

*(None currently)*

## Future Tasks

| # | Task                                                                                             | Content Type(s) | Status       |
|---|--------------------------------------------------------------------------------------------------|-----------------|--------------|
| 2 | Add share bar to `PodcastPage`, `EpisodePage`, `VideoPage`, `AthletePage` (wrap in `<Suspense>`) | all             | ⬜ (Paused)  |
| 8 | ~~Cache OG images for 24 h with `revalidatePath` and proper headers; purge when content updates~~ | all             | ✅           |
| 9 | QA with Facebook, X (Twitter) & LinkedIn debuggers; adjust text overflow rules                   | all             | ⬜ (Postponed) |
| 10| Add Jest/vitest unit tests for `getContent` + screenshot regression tests for OG templates         | all             | 🟡 (In Progress) |
| 11| ~~Update README & deployment docs with required env vars~~                                           | docs            | ✅           |

---

## Implementation Plan

1.  **Metadata Audit & Updates:** Audit performed during Task #7 setup. Updates completed in Task #7.
2.  **Share Bar Component:** Created in Task #1.
3.  **Dynamic OG Image Generation:** Template created (Task #3), Routes created (Task #6).
4.  **Performance & Caching:** Time-based revalidation added in OG routes. Path/tag-based revalidation pending (Task #8).
5.  **Testing & QA:** Pending (Task #9, #10).
6.  **Roll-out & Docs:** Pending (Task #11).

---

### Relevant Files

- `tasks/SOCIAL_SHARING_AND_OG_IMAGES.md` - This task list.
- `src/components/og/OgImageTemplate.tsx` - ✅ (Task #3) Reusable OG image component.
- `src/app/opengraph-image.tsx` - ✅ (Task #4) Global fallback
- `src/app/twitter-image.tsx` - ✅ (Task #4) Global fallback
- `src/app/podcasts/[podcast]/opengraph-image.tsx` - ✅ (Task #6) Dynamic OG generator
- `src/app/podcasts/[podcast]/[episode]/opengraph-image.tsx` - ✅ (Task #6) Dynamic OG generator
- `src/app/videos/[video]/opengraph-image.tsx` - ✅ (Task #6) Dynamic OG generator
- `src/app/athletes/[slug]/opengraph-image.tsx` - ✅ (Task #6) Dynamic OG generator
- `src/app/podcasts/[podcast]/page.tsx` - ✅ (Task #7) Updated `generateMetadata`
- `src/app/podcasts/[podcast]/[episode]/page.tsx` - ✅ (Task #7) Updated `generateMetadata`
- `src/app/videos/[video]/page.tsx` - ✅ (Task #7) Updated `generateMetadata`
- `src/app/athletes/[slug]/page.tsx` - ✅ (Task #7) Updated `generateMetadata`
- `src/components/share-bar/ShareBar.tsx` - ✅ (Task #1) Client entry point for share bar
- `src/lib/getContent.ts` - ✅ (Task #5) DRY content fetcher
- `src/lib/podcast-service.ts` - ✅ Added revalidatePath
- `scripts/metadata-audit.ts` - ⬜ One-off audit script (Not Run)
- `src/lib/getContent.test.ts` - ✅ (Task #10) Unit tests created
- `src/components/og/OgImageTemplate.test.ts` - 🟡 (Task #10) Placeholder snapshot test created
- `src/app/opengraph-image.test.ts` - 🟡 (Task #10) Placeholder snapshot test created
- `src/app/twitter-image.test.ts` - 🟡 (Task #10) Placeholder snapshot test created