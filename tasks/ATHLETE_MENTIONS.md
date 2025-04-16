# Athlete Mentions Row Implementation

Feature to display a horizontal row of recently mentioned athletes, adaptable based on content type (podcast, video, or all). This row will be used on the homepage, podcast index, video index, and athlete index pages.

## Completed Tasks

- [x] Create Task List file
- [x] Implement `getRecentlyMentionedAthletes` data fetching function
- [x] Create `CompactAthleteCard` component
- [x] Create `AthleteMentionsRow` component + skeleton
- [x] Create `AthleteMentionsSection` component + skeleton
- [x] Integrate `AthleteMentionsSection` into Homepage (`/`)
- [x] Integrate `AthleteMentionsSection` into Podcasts Page (`/podcasts`)
- [x] Integrate `AthleteMentionsSection` into Videos Page (`/videos`)
- [x] Integrate `AthleteMentionsSection` into Athletes Page (`/athletes`)

## In Progress Tasks

*None*

## Future Tasks

- [ ] Consider adding athlete discipline/event context if available
- [ ] Explore options for different sorting/filtering (e.g., most mentioned)

## Implementation Plan

1.  **Data Fetching:** ✅ Create a service function (`getRecentlyMentionedAthletes`) in `athlete-service.ts` to fetch athletes mentioned in the last 7 days, optionally filtered by content type, ordered by recency of mention.
2.  **UI Components:** ✅
    *   `CompactAthleteCard`: Displays circular image, name, links to athlete page.
    *   `AthleteMentionsRow`: Fetches data using the service function and renders cards in a horizontal scroll view. Includes skeleton.
    *   `AthleteMentionsSection`: Provides section styling, title, and embeds the row. Includes skeleton.
3.  **Integration:** ✅ Add the section component to relevant pages using `Suspense`.

### Relevant Files

- `src/lib/services/athlete-service.ts` - ✅ Added `getRecentlyMentionedAthletes` function.
- `src/components/athletes/CompactAthleteCard.tsx` - ✅ Created component.
- `src/components/athletes/AthleteMentionsRow.tsx` - ✅ Created component + skeleton.
- `src/components/athletes/AthleteMentionsSection.tsx` - ✅ Created component + skeleton.
- `src/app/page.tsx` - ✅ Integrated section.
- `src/app/podcasts/page.tsx` - ✅ Integrated section (podcast context).
- `src/app/videos/page.tsx` - ✅ Integrated section (video context).
- `src/app/athletes/page.tsx` - ✅ Integrated section. 