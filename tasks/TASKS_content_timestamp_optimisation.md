# Content API Timestamp Optimization

Ensure content update processes (tagging, athlete detection) target the correct content based on creation time (`createdAt` or `pubDate`) for performance, while general updates use `updatedAt`.

## Completed Tasks

- [x] Create this task list file.
- [x] Modify `src/app/api/tagging/route.ts` (`getContentItems`) to use correct timestamps (`createdAt` for videos, `pubDate` for episodes, `updatedAt` for podcasts).
- [x] Modify `src/lib/services/athlete-service.ts` (`processContentBatch`) to use correct timestamps (`createdAt` for videos, `pubDate` for episodes) and `maxAgeHours`.
- [x] Modify `src/app/api/content/route.ts` (`athlete-detection` and `video-mentions`) to use correct timestamps (`createdAt` for videos, `pubDate` for episodes) and `maxAgeHours`.
- [x] Rename `minHoursSinceUpdate` parameter to `maxAgeHours` in `processContentBatch` and update calls.
- [x] Verify other update types in `content/route.ts` correctly use `updatedAt` or have appropriate logic. ✅

## In Progress Tasks

- [ ]

## Future Tasks

- [ ] Consider adding `createdAt` fields to `podcasts` and `episodes` tables for consistency if feasible.
- [ ] Add more robust error handling and logging around timestamp filtering.

## Implementation Plan

1.  **Task List Creation:** Define the scope and steps in this markdown file. ✅
2.  **Tagging API Update:** Modify `getContentItems` in `src/app/api/tagging/route.ts` to filter videos by `createdAt` and episodes by `pubDate`. Update `orderBy` clauses accordingly. Keep `updatedAt` for podcasts. ✅
3.  **Athlete Service Update:** Modify `processContentBatch` in `src/lib/services/athlete-service.ts` to filter episodes by `pubDate` and videos by `createdAt`. Rename the time filter parameter to `maxAgeHours`. ✅
4.  **Content API Update (Athlete Detection):** Modify the `athlete-detection` block in `src/app/api/content/route.ts` to filter episodes by `pubDate`. Update the `video-mentions` block to pass `maxAgeHours` to `processContentBatch`. ✅
5.  **Verification:** Review the changes and ensure other content update types remain correct. ✅
6.  **Task List Update:** Mark completed items. ✅
7.  **Reflection:** Analyze maintainability and potential next steps. ✅

### Relevant Files

-   `src/app/api/tagging/route.ts` - Handles automated content tagging. Needs timestamp updates in `getContentItems`. ✅
-   `src/lib/services/athlete-service.ts` - Contains `processContentBatch` used for athlete detection. Needs timestamp and parameter updates. ✅
-   `src/app/api/content/route.ts` - Handles various content updates including athlete detection. Needs timestamp updates in `athlete-detection` logic and parameter renaming in `video-mentions` call. ✅
-   `tasks/TASKS_content_timestamp_optimisation.md` - This tracking file. ✅ 