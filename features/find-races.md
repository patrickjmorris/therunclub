**Writing PRD for new feature**

Alright, Patrick's asking for a detailed product requirements document (PRD) for a new feature in a running app: a section to find nearby races. The feature will use the Run Sign Up API, Tanstack Table for listing/filtering, and Vercel geolocation for default zip codes. There's no need to persist data yet, but the component needs to show key details like title, image, location, date, and signup availability.

I’ll structure the PRD with sections like Overview, Objectives, User Stories, Functional/Non-functional Requirements, etc. I’ll ask for any clarification as needed.

Thought for a few seconds

Below is a draft Product Requirements Document for the “Find Races Near Me” feature. Let me know if any sections need more detail or if you’d like to adjust scope, priority or add other user scenarios.

---

## 1. Overview

**Feature Name:** Find Races Near Me  
**Owner:** Product Manager  
**Release Target:** Q3 2025  
**Platforms:** Web (Next.js)  
**Description:**  
Allow users to discover upcoming running events in their area by leveraging the RunSignUp Races API. Results will default to the user’s geolocated ZIP code (via Vercel geolocation), and can be browsed, sorted and filtered with a Tanstack Table. A reusable Race Card component will display key race details on both the homepage and a dedicated `/races` route.

---

## 2. Goals & Success Metrics

- **Primary Goals:**
  1. Increase time-on-site for race discovery pages by 25%.
  2. Improve race sign‑up click‑through rate by 15% (via clear listing of available events).
  3. Lay groundwork for future “saved races” / persistence features.

- **Success Metrics:**
  - # of users who view at least one race result.
  - # of filter/sort interactions per session.
  - Click‑through rate from a Race Card to RunSignUp registration URL.
  - Time to first meaningful interaction (table load + filters applied).

---

## 3. User Personas & Stories

### Personas
- **Casual Runner**: New to racing, wants a quick list of local 5Ks to sign up.
- **Competitive Runner**: Searching by distance or date to plan seasonal races.
- **Race Organizer**: Validates how his event appears in third‑party apps.

### User Stories
1. **As a casual runner**, I want races near my ZIP code to load automatically, so I don’t have to type my location.
2. **As a competitive runner**, I want to filter events by date range, distance, or race type to find the right challenge.
3. **As a casual runner**, I want to see which races are already full vs. still open so I don’t click dead links.
4. **As a user**, I want to navigate between a summary homepage widget and a full `/races` page without redundant code.

---

## 4. Functional Requirements

| ID   | Requirement                                                                                     |
|------|-------------------------------------------------------------------------------------------------|
| FR1  | On page load, call Vercel geolocation API to retrieve user’s ZIP code.                          |
| FR2  | Fetch race data from RunSignUp Races API using the ZIP and a default radius.                    |
| FR3  | Display results in a Tanstack Table supporting: pagination, sorting (date, name), and filtering.|
| FR4  | Filters to include: date range, race distance, race type (5K, 10K, half‑marathon, etc.), status.|
| FR5  | Reusable `<RaceCard>` component must accept props: title, imageUrl, location, date, isOpen.     |
| FR6  | Place `<RaceCard>` in two contexts:  
  - Homepage widget (show top 5 upcoming)  
  - `/races` full listing (all results via the table)  
| FR7  | Each card links to the race’s registration URL.                                                |
| FR8  | Handle API errors and empty states with user-friendly messaging.                                |

---

## 5. UX/UI & Component Spec

- **RaceCard Component**  
  - **Props:**  
    - `title: string`  
    - `imageUrl: string` (fallback placeholder if missing)  
    - `location: string` (city, state)  
    - `date: ISOString`  
    - `isOpen: boolean`  
    - `onClick: () => void`  
  - **Layout:**  
    - Thumbnail on left (square)  
    - Title and date stacked  
    - Location text  
    - Badge: “Open” (green) or “Full” (gray)  

- **Homepage Widget**  
  - Inline horizontally scrollable list of 5 `<RaceCard>`s.  
  - “See all races” button navigates to `/races`.

- **Races Page (`/races`)**  
  - Top bar: ZIP input (editable), “Radius” dropdown.  
  - Tanstack Table below with columns:  
    - Event (renders `title` as link)  
    - Date  
    - Distance  
    - Location  
    - Status  
  - Filters in table header, sortable columns, pagination controls in footer.

---

## 6. API & Data Flow

1. **Geolocation**:  
   - Request: `edge function` → Vercel Geolocation header → ZIP code.  
2. **Races API**:  
   - Endpoint: `https://runsignup.com/API/races/GET`  
   - Params: `zipCode`, `radiusMiles`, `page`, `perPage`  
3. **Client**:  
   - Fetch in a React Server Component or via SWR in a Client Component.  
   - Pass data to Tanstack Table and `<RaceCard>` props.

---

## 7. Technical Considerations

- **No DB Persistence**: All data fetched on‑the‑fly.  
- **Rate Limits**: Cache responses per ZIP for 5 minutes.  
- **Accessibility**: Ensure cards and table are keyboard‑navigable.  
- **Responsiveness**: Design for mobile down to 320px width.  

---

## 8. Dependencies & Risks

- **Dependencies:**
  - RunSignUp API availability and schema stability.
  - Vercel geolocation headers feature.

- **Risks:**
  - API rate limits may throttle high traffic.
  - Incomplete or missing images from API → need placeholder strategy.

---

## 9. Milestones & Timeline

| Milestone                       
|---------------------------------
| Finalize API integration design 
| Build `<RaceCard>` component    
| Implement homepage widget       
| Build `/races` page & table     
| QA, accessibility audit         
| Beta release & analytics setup  
| Public launch                   
