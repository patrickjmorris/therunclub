## Overview
Below is a “clean-slate” audit of the project, split into (1) high-impact macro changes (architecture, infrastructure, folder layout, data-flow) and (2) smaller tactical improvements (tooling, conventions, DX, tests). I purposely keep everything grounded in the existing stack: Next 15 App Router + Drizzle + Supabase + Shadcn UI + Typescript.
────────────────────────────────────────
Macro / structural refactors
────────────────────────────────────────
A. Clearly separate “runtime surfaces”
• apps/web – public Next.js site (ISR + RSC).
• apps/admin – thin RSC dashboard for editors & moderators.
• apps/edge-worker – Vercel Edge Function wrapper for real-time webhook/websub ingestion.
• packages/db – Drizzle schema + Zod types + Supabase row helpers (shared).
• packages/core – pure business logic, parsing, enrichment, tagging, scoring, cron jobs.
• packages/ui – Shadcn + custom design-system primitives.
This mono-repo (pnpm/Bun workspaces) forces a clean domain boundary and enables isolated CI pipelines.
B. Domain-driven folders inside packages/core
core/feeds → polling & parsing RSS/Atom/YouTube feeds
core/enrich → NLP / tag extraction / athlete linking
core/clubs → club discovery, geo search
core/athletes → ranking, PRs, biographical merge
core/tools → calculators, pace charts, etc.
Each folder exposes explicit service interfaces; underlying implementation can switch (e.g., call external API or run local parser) without touching callers.
C. Event-driven ingestion pipeline
Edge Function (websub) receives PubSubHubbub pings → inserts a “feed_refresh” row.
Supabase RT triggers pg_notify → queue worker (Supabase Function) pulls job → fetches raw XML/JSON → stores in “raw_items” table.
db NOTIFY again → core/enrich worker parses, de-duplicates, tags, computes derived stats, stores in “content_items”.
web & admin apps subscribe via Supabase Realtime for low-latency updates.
Benefits: decoupled, horizontally scalable, retry logic isolated to workers.
D. Replace ad-hoc REST calls with typed server actions / tRPC router
– Public pages: prefer server components & URL params → statically generate as much as possible (ISR).
– Private/admin: a tRPC router typed off Drizzle’s inferModel, consumed by React Query on the client.
Reduces boilerplate & guarantees end-to-end types.
E. Caching and performance
• RSC + fetch cache for Supabase queries (next-cache-supabase).
• Images: use Vercel OG for dynamic share-cards; offload thumbs to Imgix or Supabase Storage.
• Use drizzle-kit prepared statements (or pgBouncer) to minimize connection churn.
• Edge Config layer for feature flags & AB tests.
F. Content modeling improvements
Separate tables: feeds, feed_items, content_items (podcasts/videos/articles), athletes, clubs, tags, mentions.
Many-to-many pivot tables (content_item_tags, content_item_athlete_mentions, athlete_club_memberships).
Computed materialized view (popular_content_last_7d) refreshed via cron for fast home-page queries.
G. Testing & CI
• Vitest + @testing-library/react for UI; zx for integration (playwright).
• Drizzle’s sqlite in-memory adapter for DAL tests.
• GitHub Actions: matrix on Node 20 & Bun 1.1; automatic drift check vs drizzle schema; Lighthouse CI for performance budgets.
H. Analytics • Observability
– Edge function logs → Vercel Observability.
– App metrics via Logflare/Supabase.
– Application tracing: OpenTelemetry + Sentry for performance tracing across RSC / server actions / edge.
────────────────────────────────────────
Smaller / tactical improvements
────────────────────────────────────────
Tighten TypeScript config: "exactOptionalPropertyTypes": true, "noPropertyAccessFromIndexSignature": true, incremental, path aliases (@/db, @/ui).
ESLint + Biome formatting, Husky pre-commit running type-check, lint, vitest, drizzle-kit diff.
Adopt nuqs for URL search-param state (sorting, filters). Keeps components server-side.
Break out long React components: keep RSC shells ➜ small 'use client' wrappers for the pieces that actually need interactivity.
Generate Supabase types via supabase gen types typescript and pipe into packages/db/generated.ts to stay 100 % aligned.
Use zact (Zod + server actions) for mutation input/output validation.
Enable Turbopack (or Vite) for faster local DX; ensure bun run dev uses native transpiler for speed.
Storybook on packages/ui with chromatic visual regression to lock UI.
PR template enforcing screenshot/video & check-list (tests, migrations, perf budget).
Accessibility sweep via eslint-plugin-jsx-a11y + Lighthouse CI budgets.
Progressive Web App manifest + service-worker for offline calculators/tools.
Graceful dep loading: dynamic import('youtube-player') only when video component mounts.
Add @uploadthing for drag-and-drop club logos / athlete photos instead of direct Supabase upload boilerplate.
Use drizzle-orm relations() to declare athlete ↔ club and content ↔ tag joins, simplifying queries.
────────────────────────────────────────
Next steps / maintainability outlook
────────────────────────────────────────
The refactor above moves us toward a strongly-typed, event-driven mono-repo with crisp domain boundaries and shared primitives. Long-term scalability improves because:
• Horizontal scaling: ingestion workers run independently of the web tier; bursty feed updates won’t impact page latency.
• Velocity: packages/ui & packages/core can evolve without redeploying the whole web app; reusable across future products (e.g., a mobile app).
• Reliability: well-defined queues + retries minimize data loss; typed contracts reduce runtime bugs.
• Onboarding: newcomers navigate a predictable folder structure and single source-of-truth Drizzle schema.
Potential future improvements:
– Switch to pgvector + embeddings for smarter “similar content” recommendations.
– Add background CRON to refresh athlete PRs from external APIs (e.g., PowerOf10).
– Introduce feature-flag driven canary releases via Vercel Edge Config.
– Explore incremental static regeneration on the Edge for high-traffic athlete pages.
This roadmap balances immediate payoffs (DX, speed, data integrity) with a foundation that will comfortably support new features—race results, live tracking, user-generated routes—without accruing structural debt.


## Next 15 App-Router surface
Below is a “deep-dive” review of the current front-end codebase, focused on the two highest-traffic folders:
• src/app (the Next 15 App-Router surface)
• src/components (all reusable UI & feature slices)
I’m writing this as a tech-lead → tech-lead review, so I’ll call out strengths, hidden land-mines, scalability issues, and concrete refactor suggestions. Where relevant I reference file paths and line numbers to keep things actionable.
────────────────────────────────────────
High-level observations
────────────────────────────────────────
✔ You are already taking advantage of RSC: most pages are server components with suspense boundaries and lightweight client wrappers ('use client').
✔ Feature slices (athletes, podcasts, videos, etc.) map 1-to-1 in both app/ and components/, which keeps mental mapping easy.
✔ Skeleton + Suspense pattern is applied consistently.
✘ Some client components are >300 lines (AudioPlayer.tsx, athlete-profile.tsx)—hurts readability and bundle size.
✘ Cross-cutting concerns (auth, Supabase fetch, caching) are sprinkled across many components rather than funneled through hooks or providers.
✘ Page/route tree is flat; could benefit from route groups and parallel routes to control layout/streaming granularity.
✘ Domain UI vs. design-system primitives are mixed in the same components/ tree.
────────────────────────────────────────
Folder-by-folder review
────────────────────────────────────────
╭─ src/app/
│ • Global layout (layout.tsx, 1–131)
│ – Solid: wraps AudioProvider, ThemeProvider, NuqsAdapter, etc.
│ – Concern: SiteHeader is a Server Component that fetches Supabase user + profile on every navigation.
│ On RSC navigations that’s fine, but client-side route transitions will trigger an extra round-trip.
│ Suggestion: move auth fetch into a single getUser() server action in layout and pass user via context.
│
│ • Root page (page.tsx, 1–95)
│ – Good use of multiple Suspense boundaries.
│ – Skeleton components live next to feature code; consider components/skeletons/* to avoid duplication.
│
│ • Dynamic segment athletes/[slug]/
│ – generateStaticParams() executes an O(n) full table scan with joins at build-time (293 lines).
│ For large athlete tables this will bloat CI times. Better pattern:
│ 1) pre-compute list of “important” slugs in a cron and store in build_params table
│ 2) have generateStaticParams do a select slug from build_params.
│ – Page component mixes UI, SEO JSON-LD, and service calls; suggest:
│ components/athletes/ProfilePageShell.tsx + lib/seo/athlete.ts
│
│ • API routes (not reviewed here) should move to /src/app/api/…/route.ts if not already.
╰─ src/components/
├─ common/
│ • site-header.tsx (1–48)
│ – Fetching Supabase here means header is blocking for any page load.
│ You already have MobileNav, MainNav, UserNav in sub-folders—great separation.
│ – Consider: keep header purely static, make UserNav a streaming client component that fetches session in parallel.
│
│ • command-menu.tsx (1–201) – good accessibility; still, 200 lines.
│ Extract:
│ KeyboardShortcuts.tsx (listener)
│ SearchResultsGroup.tsx (map results)
│
│ • navigation-menu.tsx, mobile-nav.tsx, etc. all live together—OK.
│
├─ ui/ (Shadcn copies)
│ – You’ve preserved upstream code style—good.
│ – Heads-up: duplicates (popover.tsx vs dropdown-menu.tsx) are creeping; make a README describing when to choose which.
│
├─ athletes/, races/, podcasts/, videos/
│ – Pattern:
│ Row / Card / Section / Skeleton pairs.
│ This is readable but creates lots of near-identical Skeleton code. Create createSkeleton(Component, props) HOC?
│
└─ podcasts/player/
• AudioPlayer.tsx (386 lines)
– Holds state, layout, gestures, media-session, drawer logic in one file.
– Suggestion:
player/hooks/useMediaSession.ts
player/hooks/useTimelineState.ts
PlayerChrome.tsx (desktop)
PlayerDrawer.tsx (mobile)
– Also: image preloading could happen via next/image priority attr.
────────────────────────────────────────
Technical concerns & improvement ideas
────────────────────────────────────────
RSC vs Client boundaries
• Any component that does a Supabase .auth.getUser() becomes server-only and forces streaming; sometimes that’s over-kill.
• Audit: grep -R "getUser(" src/components shows >5 occurrences in common UI. Consider a single AuthContext.
Data-fetch duplication
Example: AthleteMentionsSection calls AthleteMentionsRow which again does a fetch. If you ever reuse the row inside a different section you’ll refetch. Push data-fetch to the section level -> pass props to row.
Skeleton inflation
Each Row & Section file defines its own Skeleton JSX. Consider:
Apply to route.ts
)
Then reference it across features.
Bundle health
• 300-400 line client components + multiple Radix/Shadcn imports will balloon JS.
• Use next build --profile to find which client bundles need splitting; Audio player is probably 40 % of interactive JS.
Route groups
Adopt route groups to isolate shared layouts:
Apply to route.ts
/
Lets you stream marketing pages without loading podcast layout logic.
CSS / Tailwind
– You already import global tailwind in layout.tsx. For per-feature styles consider colocation with component and leveraging @layer components to avoid long class lists.
Testability
No evidence of React Testing Library. Pages like athletes/[slug] could have snapshot tests around the profile shell.
────────────────────────────────────────
Suggested refactor roadmap
────────────────────────────────────────
Phase 1 – Boundary cleanup
• Convert SiteHeader to static + client UserNav.
• Extract large client components into sub-components and hooks.
• Introduce AuthProvider (server in layout ⇒ context on client).
Phase 2 – Component taxonomy
• components/ui – design-system primitives only (Shadcn).
• components/shared – app-wide generic atoms (Skeleton, Flags, FormattedDate).
• components/feature/* – domain UI that fetches data.
• components/page/* – specific page shells (compose sections, no data fetch).
This lets you tree-shake unused feature code on partial routes.
Phase 3 – Data & caching
• All server components fetch via a lib/queries/* layer that returns typed DTOs (one per feature).
• Enable fetchCache: 'force-cache' on pure static queries, revalidate otherwise.
• Add x-cache: HIT/MISS header logging middleware to watch caching in prod.
Phase 4 – Testing & perf
• Unit test hooks and helpers with Vitest.
• Add Playwright spec for /athletes/[slug] happy path.
• Use next build --profile + webpack-bundle-analyzer to enforce <200 kB JS on first load.
────────────────────────────────────────
Conclusion
────────────────────────────────────────
Your current structure is already ahead of many content sites—RSC, Suspense, Shadcn, Tailwind are well integrated. The main risks are (a) bloated client bundles from over-sized components and (b) scattered data-fetch logic that can hamper caching and code re-use. Focusing on smaller client modules, clearer directory taxonomy, and a shared data/query layer will keep performance high as the feature set grows

## Drizzle and Supabase
Below are the guard-rails I recommend for deciding which “dial” to turn in any given part of the code-base. They line up with the strengths and limitations of each tool and with how you are already using them in the project.
────────────────────────────────────────
Quick decision matrix
────────────────────────────────────────
│ Drizzle ORM │ supabase-js client
─────────────────────────────────────┼─────────────┼────────────────────
Executes inside Vercel/Node │ ✅ direct │ ✅ (server client)
Executes in the browser │ ❌ │ ✅ (row-level secure)
Requires per-user RLS │ ❌ │ ✅
Needs service-role bypass │ ✅ (use conn string) │ ✅ (admin client)
Complex multi-table joins / CTEs │ ✅ FIRST │ ➖ (limited)
Bulk ingestion / ETL / cron jobs │ ✅ │ ➖
Realtime subscriptions │ ❌ │ ✅ (Supabase Realtime)
Needs typed migrations & DDL │ ✅ drizzle-kit │ ➖
Outside network (no Postgres port) │ ➖ │ ✅ (HTTP over TLS)
────────────────────────────────────────
────────────────────────────────────────
When to reach for Drizzle
────────────────────────────────────────
Backend tasks that do not depend on the current user
• ETL workers pulling YouTube RSS, race-result scrapers, tag enrichment, seed scripts.
• Server Actions that need to update many rows, run SQL functions, or wrap multiple statements in a transaction.
• Admin dashboards where only trusted staff have access (no RLS needed).
Migrations & schema ownership
Drizzle’s schema file is your single source-of-truth; drizzle-kit generates SQL that the Supabase CLI applies.
This keeps schema and types in version control while still letting Supabase host the database.
Performance-critical read paths from RSC pages
For heavy joins (athletes + clubs + mentions) you often need SQL that PostgREST can’t express efficiently.
A direct Postgres connection through Drizzle lets you use CTEs, materialized views, and EXPLAIN-tuned queries.
Service-role actions that should ignore RLS without extra network hops
Using the database URL + Drizzle is faster than calling the Supabase “admin” HTTP endpoint.
────────────────────────────────────────
When to reach for supabase-js
────────────────────────────────────────
Anything executed in the browser
Only the Supabase client can talk to the DB over HTTPS safely; Drizzle would expose credentials.
Queries that must respect Row-Level Security for the current session
The client automatically attaches the user’s JWT so SELECT/INSERT obey your RLS policies.
Auth, Storage, Realtime and other Supabase-specific services
‑ Signing in/out, magic links, OAuth flows
‑ Uploading athlete photos or club logos to Supabase Storage
‑ Realtime subscriptions for live comments, “likes”, etc.
Lightweight server code where the simplicity of PostgREST is good enough
Example: a profile page that just needs supabase.from('profiles').select('*').eq('id', user.id).
Edge Functions that cannot open a raw Postgres connection
Vercel Edge / Cloudflare Workers allow Fetch but not TCP; Supabase client works over HTTPS.
────────────────────────────────────────
Patterns that bind the two together
────────────────────────────────────────
• Single Drizzle schema → generate migration SQL → apply through Supabase.
• packages/db exports both:
Apply to refactor.md
;
• src/utils/supabase/ houses
– createClient() (browser/server) respecting cookies
– supabaseAdmin (service-role, still HTTP)
• Ingest pipeline: Edge Webhook → supabase.from('raw_items').insert (HTTP)
Trigger function in the DB kicks off a Supabase Function (or Vercel cron) that spins Drizzle to
parse, dedupe, and upsert enriched rows. This keeps the public ingress path simple and RLS-safe,
while still letting ETL run at “native SQL” speed.
────────────────────────────────────────
Typical file-by-file division
────────────────────────────────────────
Apply to refactor.md
Drizzle
────────────────────────────────────────
Key anti-patterns to avoid
────────────────────────────────────────
• Calling supabase-js from heavy server ETL loops (each HTTP call is ~3–4× slower than a direct query).
• Using Drizzle directly in a client component (would leak database credentials).
• Mixing both libraries within the same function unless there’s a clear boundary (e.g., Drizzle fetch + supabase Storage upload).
────────────────────────────────────────
TL;DR
Use Drizzle wherever you need raw SQL power, service-role privileges, or high-throughput server-side work.
Use supabase-js wherever you need auth-scoped data, browser access, Realtime, Storage, or Edge compatibility.