# Podcast Ranking Feature Implementation

Add a "Top Ranked Podcasts" section to the homepage and podcasts page, sourced from the Taddy API.

## Completed Tasks

- [x] Create Task List File
- [x] Database Schema: Define `podcast_rankings` table
- [x] Database Schema: Generate and apply migration
- [x] Taddy API Service: Create `src/lib/services/taddy-service.ts`
- [x] Taddy API Service: Implement `fetchTopRunningPodcasts`
- [x] Taddy API Service: Define TypeScript types
- [x] Taddy API Service: Store credentials in environment variables (Assumed done manually)
- [x] Update Service: Create `updatePodcastRankings` function
- [x] API Endpoint: Add `podcast-rankings` content type
- [x] API Endpoint: Implement `podcast-rankings` update logic
- [x] Data Fetching: Create `getTopRankedPodcasts` function
- [x] UI Component: Create `CompactPodcastCard.tsx`
- [x] UI Component: Create `TopRankedPodcastsRow.tsx`
- [x] UI Component: Create `TopRankedPodcastsSkeleton.tsx`
- [x] Homepage Integration: Add `TopRankedPodcastsRow` to `src/app/page.tsx`
- [x] Podcasts Page Integration: Add `TopRankedPodcastsRow` to `src/app/podcasts/page.tsx`
- [x] Update Task List: Mark completed tasks

## In Progress Tasks

(None)

## Future Tasks

(None)

## Implementation Plan

**Phase 1: Backend Setup**
1. Create `tasks/PODCAST_RANKING.md`. ✅
2. Define `podcast_rankings` schema in `src/db/schema.ts` (columns: `id`, `rank`, `taddy_uuid`, `itunes_id`, `podcast_name`, `created_at`). Apply migration. ✅
3. Implement `fetchTopRunningPodcasts` in `src/lib/services/taddy-service.ts` using Taddy API credentials (env vars). ✅
4. Implement `updatePodcastRankings` to fetch from Taddy and INSERT new rows into `podcast_rankings`. ✅
5. Add `podcast-rankings` type to `src/app/api/content/route.ts` and hook up `updatePodcastRankings`. ✅

**Phase 2: Frontend Implementation**
6. Implement `getTopRankedPodcasts` to query the latest batch from `podcast_rankings`, join with `podcasts` on `itunes_id`, order by rank, limit 10. ✅
7. Create `CompactPodcastCard.tsx` for podcast display (image, name, link). ✅
8. Create `TopRankedPodcastsRow.tsx` using `HorizontalScroll` and `CompactPodcastCard`. Create `TopRankedPodcastsSkeleton`. ✅
9. Integrate `TopRankedPodcastsRow` (with Suspense) into homepage (`src/app/page.tsx`) after Global Search. ✅
10. Integrate `TopRankedPodcastsRow` (with Suspense) into podcasts page (`src/app/podcasts/page.tsx`) above Featured Podcasts. ✅
11. Update `tasks/PODCAST_RANKING.md` throughout. ✅

### Relevant Files

- tasks/PODCAST_RANKING.md - This file ✅
- src/db/schema.ts - Database table definition ✅
- src/lib/services/taddy-service.ts - Taddy API interaction ✅
- src/lib/services/podcast-service.ts - Data fetching and update logic ✅
- src/app/api/content/route.ts - API endpoint for triggering updates ✅
- src/components/podcasts/CompactPodcastCard.tsx - UI card for ranked podcasts ✅
- src/components/podcasts/TopRankedPodcastsRow.tsx - UI row component ✅
- src/components/podcasts/TopRankedPodcastsSkeleton.tsx - Loading state UI ✅
- src/app/page.tsx - Homepage integration ✅
- src/app/podcasts/page.tsx - Podcasts page integration ✅ 