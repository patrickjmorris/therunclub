# Tag Consolidation Implementation

Consolidate the large number of unique AI-generated content tags into a smaller, more manageable set of canonical tags, and implement a system for ongoing curation.

## Completed Tasks

- [ ] Plan Tag Consolidation Strategy
- [x] Create `scripts/analyze-tags.ts` to analyze tag frequency and identify consolidation candidates

## In Progress Tasks

- [ ] Manually curate initial `tag-consolidation-map.json` based on analysis
- [x] Create `scripts/consolidate-tags.ts` to merge tags based on the map
- [x] Update `/api/tagging` route to use the consolidation map for new tags
- [x] Create `tag_management` database table
- [x] Implement Admin UI for Tag Management (Server Actions for backend)
    - [x] Display canonical tags and variants
    - [x] Allow creating/editing/deleting mappings
    - [x] Implement suggestion engine for new/unmapped tags
- [ ] Refactor consolidation script and tagging API to use `tag_management` table

## Future Tasks

- [ ] Implement optional string similarity analysis in `scripts/analyze-tags.ts`
- [ ] Add dry-run and batch options to `scripts/consolidate-tags.ts`

## Implementation Plan

1.  **Analysis:** Analyze existing tags to understand frequency and identify similar tags for consolidation.
2.  **Initial Consolidation:** Create a mapping file and a script to perform the initial cleanup of existing tags in the database.
3.  **API Update:** Modify the tagging API to use the mapping, ensuring new content gets canonical tags.
4.  **Admin UI:** Build an admin interface for ongoing tag management (viewing, editing, approving mappings) using Next.js Server Actions.
5.  **Refactor:** Update scripts and APIs to use the database table managed by the admin UI instead of the initial JSON map.

### Relevant Files

- `tasks/TAG_CONSOLIDATION.md` - This task list.
- `src/app/api/tagging/route.ts` - Existing API route (✅ Updated with heuristics).
- `src/db/schema.ts` - Database schema (✅ Added `tag_management` table).
- `scripts/analyze-tags.ts` - Script to analyze tag frequency (✅ Created).
- `tag-consolidation-map.json` - Initial mapping file (✅ Created).
- `scripts/consolidate-tags.ts` - Script for bulk tag consolidation (✅ Created).
- `src/app/admin/tags/**` - Admin UI components and pages (to be created).
- `src/lib/actions/admin/tag-actions.ts` - Server Actions for admin tag management (✅ Created). 