# Component Cleanup Plan

Based on the review of our component reorganization, the following items need to be addressed:

## Directories to Remove

These directories contain original components that have been moved to new locations:

1. `/src/components/calculator/` - Components moved to `/src/app/calculators/components/`
2. `/src/components/dashboard/` - Components moved to `/src/app/dashboard/components/`
3. `/src/components/featured-channel/` - Components moved to `/src/components/videos/featured-channel/`
4. `/src/components/chat/` - Empty directory
5. `/src/components/homepage/` - Components moved to `/src/components/common/homepage/`
6. `/src/components/search/` - Components moved to `/src/components/common/search/`
7. `/src/components/shared/` - Components moved to `/src/components/common/shared/`
8. `/src/components/content/` - Components moved to `/src/components/common/content/`
9. `/src/components/nav/` - Components moved to `/src/components/common/nav/`

## Files to Check and Delete

Any remaining files in the root of `/src/components/` should be deleted, as they've been moved to appropriate subdirectories.

## Execution Plan

Execute the following steps once import updates are complete:

1. Update imports in the codebase to reference the new component locations
2. Test the application thoroughly to ensure everything works correctly
3. Remove the duplicate components using the commands below

```bash
# Remove directories with duplicate components
rm -rf src/components/calculator
rm -rf src/components/dashboard
rm -rf src/components/featured-channel 
rm -rf src/components/chat
rm -rf src/components/homepage
rm -rf src/components/search
rm -rf src/components/shared
rm -rf src/components/content
rm -rf src/components/nav

# Remove any files that remain in the root directory
rm -f src/components/*.tsx
```

## Status Summary

✅ Unused components deleted: 
- TinyWaveFormIcon.tsx
- ShowMoreButton.tsx
- TruncatedDescription.tsx

✅ All components moved to appropriate locations:
- Common components → `/src/components/common/`
- Athlete components → `/src/components/athletes/`
- Podcast components → `/src/components/podcasts/`
- Video components → `/src/components/videos/`
- Calculator components → `/src/app/calculators/components/`
- Dashboard components → `/src/app/dashboard/components/`
- Login components → `/src/app/login/components/`

⚠️ Original components and directories need to be deleted after import updates are complete

## Final Notes

This cleanup should be performed after all import references have been updated. Removing the files too early will break the application. Consider creating a git branch for this work to ensure everything functions correctly before merging the changes.