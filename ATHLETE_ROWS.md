# Athlete Rows Implementation

Add themed rows of athletes (Olympic Champions, World Champions, by Country) to the main athletes page.

## Completed Tasks

- [x] Create `AthleteRow` component (`src/components/athletes/AthleteRow.tsx`)
- [x] Create `AthleteRowSkeleton` component (`src/components/athletes/AthleteRow.tsx`)

## In Progress Tasks

- [x] Remove old `AthletesList` and related logic from `AthletesPage` (`src/app/athletes/page.tsx`)
- [x] Fetch data for new rows in `AthletesPage` (`src/app/athletes/page.tsx`)
- [x] Render new `AthleteRow` components with `Suspense` in `AthletesPage` (`src/app/athletes/page.tsx`)

## Future Tasks

- [ ] Consider adding more diverse athlete rows (e.g., by discipline, rising stars)

## Implementation Plan

1.  **Phase 1:** Create the `AthleteRow` and `AthleteRowSkeleton` components.
2.  **Phase 2:** Implement or update data fetching functions (`getOlympicGoldMedalists`, `getWorldChampions`, `getAthletesByCountry`) in the athlete service, ensuring correct data format, limit, and random ordering.
3.  **Phase 3:** Integrate the new components and data fetching into the `AthletesPage`, removing the old list and adding the new rows below the "Recently Mentioned" section.

### Relevant Files

- `src/components/athletes/AthleteRow.tsx` - Component to display a themed row of athletes.
- `src/lib/services/athlete-service.ts` - Contains data fetching logic for athletes.
- `src/app/athletes/page.tsx` - The main page where athlete rows will be displayed.
- `ATHLETE_ROWS.md` - This task tracking file. 