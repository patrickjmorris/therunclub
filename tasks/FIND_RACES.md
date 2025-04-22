# Find Races Feature Implementation

Allow users to discover upcoming running events in their area by leveraging the RunSignUp Races API. Results will default to the user's geolocated ZIP code, and can be browsed, sorted and filtered with a Tanstack Table.

This feature will be featured on the homepage as a content section and will be accessible from the main navigation menu.

## Completed Tasks

- [x] Set up basic project structure for the feature (routes, components folder).
- [x] Implement utility function to get user's ZIP code via Vercel geolocation headers. (Assuming done previously or not strictly part of this flow)
- [x] Implement utility function to fetch race data from RunSignUp API (both list `fetchRaces` and single `fetchRace`).
- [x] Implement the `/races` page route (`src/app/races/page.tsx`).
- [x] Implement the `<RaceTable>` client component using Tanstack Table (`src/app/races/components/race-list-view.tsx`).
- [x] Integrate API fetching logic into the `/races` page (server component fetch).
- [x] Display fetched race data in the `<RaceTable>`.
- [x] Implement basic table sorting (date, name, location).
- [ ] Implement table pagination.
- [x] Add basic filters to the table (text search on name, city, state).
- [x] Ensure `<RaceTable>` links (Details button) route correctly to `/races/[race_id]`.
- [x] Add basic error handling and empty state UI for API calls (in `/races` list page).
- [x] Create dynamic route `src/app/races/[race_id]/page.tsx`.
- [x] Implement data fetching for single race in `src/app/races/[race_id]/page.tsx`.
- [x] Create client component `src/app/races/[race_id]/components/RaceDetailsView.tsx`.
- [x] Implement UI for `RaceDetailsView` based on example/API data.
- [x] Implement helper functions in `src/lib/utils/event-helpers.ts`.
- [x] Add basic error/loading states to `src/app/races/[race_id]/page.tsx`.

## In Progress Tasks

- [x] Build the reusable `<RaceCard>` component with specified props (title, imageUrl, location, date, isOpen, onClick) and basic styling.
- [x] Implement the homepage widget `<UpcomingRacesWidget>` to display the top 5 races using `<RaceCard>`.
- [ ] Implement advanced table filtering (date range, distance, type, status).
- [x] Implement ZIP code input and Radius dropdown on `/races` page for custom searches.
- [ ] Add caching strategy for RunSignUp API responses (e.g., 5-minute cache per ZIP).
- [x] Implement fallback image strategy for `<RaceCard>` when `imageUrl` is missing.
- [ ] Refine styling and responsiveness for all components (mobile down to 320px).


## Future Tasks

- [ ] Implement advanced table filtering (date range, distance, type, status).
- [ ] Implement ZIP code input and Radius dropdown on `/races` page for custom searches.
- [ ] Add caching strategy for RunSignUp API responses (e.g., 5-minute cache per ZIP).
- [ ] Implement fallback image strategy for `<RaceCard>` when `imageUrl` is missing.
- [ ] Refine styling and responsiveness for all components (mobile down to 320px).

## Implementation Plan

1.  **Setup & Utilities:** Create necessary folders, utility functions for geolocation and API interaction.
2.  **Core Components:** Build the `<RaceCard>` component and the basic structure for the `/races` page and `<RaceTable>`.
3.  **API Integration:** Fetch data from the RunSignUp API and display it in the table.
4.  **Table Features:** Implement sorting, pagination, and basic filtering for the Tanstack Table.
5.  **Homepage Widget:** Create the widget to display top races on the homepage.
6.  **Advanced Features & Polish:** Implement advanced filtering, custom search inputs, caching, error handling, styling, accessibility, and analytics.

### Relevant Files

- `tasks/FIND_RACES.md` - This task list file.
- `features/find-races.md` - Product Requirements Document.
- `src/app/races/page.tsx` - Main page for the race finder feature. ✅
- `src/app/races/components/race-list-view.tsx` - Component for the race list table. ✅
- `src/app/races/[race_id]/page.tsx` - Dynamic route for single race details. ✅
- `src/app/races/[race_id]/components/RaceDetailsView.tsx` - Component to display single race details. ✅
- `src/components/races/RaceCard.tsx` - Reusable component for displaying individual race details. ✅
- `components/races/RaceFilters.tsx` - Component(s) for table filtering controls (Future Task).
- `src/components/home/UpcomingRacesWidget.tsx` - Component for the homepage race preview widget. ✅
- `src/lib/runsignup-api.ts` - Utility functions for interacting with the RunSignUp API. ✅
- `src/lib/geolocation.ts` - Utility function(s) for handling Vercel geolocation. ✅
- `src/lib/utils/event-helpers.ts` - Utility functions for formatting event data. ✅
- `src/types/runsignup.ts` - TypeScript types for the RunSignUp API response structure. ✅ 