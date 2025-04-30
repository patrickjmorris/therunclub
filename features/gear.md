**Product Requirements Document (PRD)**  
**Feature**: Running-Gear Extraction & Display  
**Version**: v1.0 – Draft  
**Prepared for**: Spot Sports Web & Mobile Platform  
**Date**: 29 April 2025 (EDT)

---

### 1 · Problem Statement
Spot Sports currently surfaces podcasts and video content but offers no structured way to showcase running gear. High-intent visitors want to know *what* athletes use and *where* to buy it. RunningWarehouse.com maintains one of the most complete public catalogs of performance gear, but there is no official API. We need a reliable, maintainable mechanism to scrape gear data, persist it, and render it in three user-facing contexts (Home, Gear, Athlete pages) while laying groundwork for additional merchants later.

---

### 2 · Goals & Success Metrics
| Goal | Metric | Target |
|------|--------|--------|
|Accurate extraction of gear objects|≥ 95 % of SKUs parsed without schema errors per run|
|Low duplicate rate|≤ 2 % duplicate `gear.slug` per weekly run|
|Timely refresh|Full site scrape ≤ 10 minutes, weekly cadence|
|User engagement|CTR on Home “Gear” row ≥ 8 % within 30 days of launch|
|Scalable to add new merchants|Adding a second site requires ≤ 1 day engineering effort (script & config)|

---

### 3 · Out of Scope (v1)
* Price tracking / historical price charts  
* Affiliate-link management  
* User-generated reviews  

---

### 4 · Solution Overview
```
┌───────────┐         ┌────────────┐        ┌──────────────┐
│ Stagehand │  JSON   │ Trigger.dev│  SQL   │ Postgres via │
│ Scraper   │ ───────►│ Job Runner │ ──────►│ Drizzle ORM  │
└───────────┘         └────────────┘        └────┬─────────┘
                                                   │
                                              Next.js 15
                                                   │
                 ┌───────────────┬────────────────┴───────────────┐
                 │Home Gear Row  │/gear page w/ filters │Athlete Gear Row│
                 └───────────────┴────────────────────────────────┘
```

---

### 5 · Detailed Requirements

#### 5.1 Data Extraction (Stagehand)
* **Framework**: [Stagehand](https://github.com/browserbase/stagehand) – chosen for hybrid “code + LLM” approach and Playwright under-the-hood reliability  ([GitHub - browserbase/stagehand: An AI web browsing framework focused on simplicity and extensibility.](https://github.com/browserbase/stagehand))
* **Entry points**:  
  * Shoes → `/mens-running-shoes.html`, `/womens-running-shoes.html`  
  * Apparel, Race Spikes, Training Tools, Fuel → corresponding category URLs
* **Per-item schema** (Zod):
  ```ts
  gear: z.object({
    name: z.string(),
    brand: z.string(),
    description: z.string().optional(),
    price: z.number(),
    rating: z.number().optional(),
    reviewCount: z.number().optional(),
    link: z.string().url(),
    image: z.string().url(),
    category: z.enum(['shoes','apparel','race_spikes','training_tools','fuel'])
  })
  ```
* **Extraction method**: `page.extract()` with a natural-language instruction, mirroring the Stagehand books example  ([Web Scraping - Browserbase Documentation](https://docs.browserbase.com/use-cases/scraping-website)).
* **Pagination**: follow “Next” links; respect 2 s delay between requests (ethical scraping best-practice)  ([Web Scraping - Browserbase Documentation](https://docs.browserbase.com/use-cases/scraping-website)).
* **Description & rating**: if not present on the listing tile, Stagehand will open the product page in a new context, extract, close, and continue.
* **Robustness**  
  * Retry up to 3 times on navigation timeouts.  
  * If anti-bot triggered (captcha), Stagehand’s advanced stealth will switch proxy region  ([Web Scraping - Browserbase Documentation](https://docs.browserbase.com/use-cases/scraping-website)).

#### 5.2 Job Orchestration
* **Local CLI** (`bun scrape:gear`) for ad-hoc runs.  
* **Scheduled run** via Trigger.dev:
  ```ts
  import { defineJob } from "@trigger.dev/sdk";
  export const weeklyGearScrape = defineJob({
    id: "weekly-runningwarehouse-scrape",
    onSchedule: "0 9 * * SUN", // Sundays 09:00 ET
    run: async (payload, ctx) => { … }
  });
  ```
  * Payload supports `{ merchant: 'runningwarehouse', category?: 'shoes' }` so we can trigger partial refreshes.
* Concurrency: single queue, concurrency = 1 (gear releases are infrequent).

#### 5.3 Database (Drizzle + Postgres)
```ts
export const gear = pgTable('gear', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').unique().notNull(),          // e.g. “brooks-adrenaline-gts-23”
  name: text('name').notNull(),
  brand: text('brand').notNull(),
  description: text('description'),
  price: numeric('price', { precision: 8, scale: 2 }).notNull(),
  rating: numeric('rating', { precision: 2, scale: 1 }),
  reviewCount: integer('review_count'),
  image: text('image').notNull(),
  link: text('link').notNull(),
  category: gearCategoryEnum('category').notNull(),
  merchant: text('merchant').default('runningwarehouse'),
  updatedAt: timestamp('updated_at').defaultNow(),
});
export const athleteGear = pgTable('athlete_gear', {
  athleteId: uuid('athlete_id').references(() => athletes.id),
  gearId: uuid('gear_id').references(() => gear.id),
  relationship: text('relationship'),  // "uses", "sponsored", etc.
});
```

#### 5.4 Backend APIs / Server Actions
| Route | Method | Purpose |
|-------|--------|---------|
|`/api/gear`|GET|Paginated list + query params `category, brand, minPrice, maxPrice, sort`|
|`/api/gear/:id`|GET|Gear detail (SSG/ISR)|
|Server Action `linkGearToAthlete(athleteId, gearId)`|POST|Internal admin UI|

#### 5.5 Frontend Components
* **`<GearRow>`** – horizontal scroll list (same layout props as `PodcastRow`).  
  * Props: `title`, `items[]`, `ctaLink`.
* **Home page** – show latest 20 items ordered by `updatedAt DESC`.  
* **`/gear` page** – filter panel (GearType pills, Brand multi-select, Price slider, Rating). Uses TanStack Table for responsiveness.  
* **Athlete profile** – `<GearRow title="Gear I Use" items={gearForAthlete} />`.

---

### 6 · Non-Functional Requirements
* **Performance**: Fetch gear rows in ≤ 150 ms (from Edge cache or Supabase CDN).  
* **Accessibility**: All images require `alt` text; use `aria-label` on filter controls.  
* **Security**: Environment variables (`BROWSERBASE_API_KEY`, `TRIGGER_SECRET_KEY`) stored in Vercel encrypted secrets.  
* **Compliance**: Respect RunningWarehouse.com robots.txt and ToS; scraping frequency = weekly.  

---

### 7 · Open Questions
1. **Category mapping** – are “Training Tools” and “Fuel” exhaustive or will more categories be added (e.g., electronics)?  We want to be able to add new categories without breaking the existing schema.
2. **Rating granularity** – RunningWarehouse exposes star rating and review count; do we also want individual review text for future sentiment analysis?  No, not for now.
3. **Affiliate strategy** – should links be wrapped with Skimlinks/Impact IDs now or in a future phase?  In a future phase.
4. **Athlete–gear relationship** – is association manual (admin UI) or inferred (e.g., via sponsor tags in bios)?  Manual.
---

### 8 · Acceptance Criteria
* Running the Trigger.dev job populates at least 1,000 current SKUs with no schema validation errors.  
* The `/gear` page lists items with functional filters and deep links to RunningWarehouse.  
* Lighthouse accessibility score on new pages ≥ 90.  
* Production job completes within the 60 s Vercel function limit **or** streams work chunks (preferred) via Trigger.dev.

---