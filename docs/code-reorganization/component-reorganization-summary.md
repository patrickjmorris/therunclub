# Component Reorganization Summary

The components in The Run Club codebase have been reorganized following a more logical structure based on domain, feature, and common patterns.

## New Component Structure

```
src/
├── app/
│   ├── login/components/
│   │   └── login-form.tsx
│   ├── dashboard/components/
│   │   ├── athletes/
│   │   │   └── columns.tsx
│   │   ├── data-table/
│   │   │   ├── columns.tsx
│   │   │   ├── data-table-column-header.tsx
│   │   │   └── data-table.tsx
│   │   └── podcasts/
│   │       └── columns.tsx
│   └── calculators/components/
│       ├── pace-calculator.tsx
│       ├── splits-table.tsx
│       ├── time-input-tooltip.tsx
│       ├── track-workout.tsx
│       └── training-zones.tsx
├── components/
│   ├── ui/ (shadcn UI components - unchanged)
│   ├── common/
│   │   ├── about-section.tsx
│   │   ├── analytics.tsx
│   │   ├── coming-soon.tsx
│   │   ├── command-menu.tsx
│   │   ├── container.tsx
│   │   ├── formatted-date.tsx
│   │   ├── icons.tsx
│   │   ├── infinite-scroll.tsx
│   │   ├── mention-error.tsx
│   │   ├── mention-loading.tsx
│   │   ├── mobile-nav.tsx
│   │   ├── mode-toggle.tsx
│   │   ├── navigation-menu.tsx
│   │   ├── page-header.tsx
│   │   ├── providers.tsx
│   │   ├── site-header.tsx
│   │   ├── tabs-with-state.tsx
│   │   ├── tailwind-indicator.tsx
│   │   ├── theme-provider.tsx
│   │   ├── content/
│   │   │   ├── AddChannelForm.tsx
│   │   │   ├── AddContentDialog.tsx
│   │   │   ├── AddContentWrapper.tsx
│   │   │   ├── AddPodcastForm.tsx
│   │   │   └── more-content.tsx
│   │   ├── homepage/
│   │   │   ├── FeaturedSection.tsx
│   │   │   ├── PodcastSection.tsx
│   │   │   ├── TaggedContentSection.tsx
│   │   │   └── VideoSection.tsx
│   │   ├── link-preview/
│   │   │   ├── link-preview.tsx
│   │   │   ├── link-preview-client-wrapper.tsx
│   │   │   ├── link-preview-error-boundary.tsx
│   │   │   └── link-preview-preloader.tsx
│   │   ├── nav/
│   │   │   ├── main-nav.tsx
│   │   │   └── user-nav.tsx
│   │   ├── search/
│   │   │   ├── global-search.tsx
│   │   │   ├── search-bar.tsx
│   │   │   └── search-results.tsx
│   │   └── shared/
│   │       └── content-filter.tsx
│   ├── athletes/
│   │   ├── athlete-list.tsx
│   │   ├── athlete-mentions.tsx
│   │   └── athlete-references.tsx
│   ├── podcasts/
│   │   ├── audio-provider.tsx
│   │   ├── episode-play-button.tsx
│   │   ├── listen-now-button.tsx
│   │   ├── pause-icon.tsx
│   │   ├── play-icon.tsx
│   │   ├── podcast-search.tsx
│   │   ├── waveform.tsx
│   │   ├── AddPodcastDialog.tsx
│   │   ├── AddPodcastForm.tsx
│   │   ├── ColorPaletteDisplay.tsx
│   │   ├── CompactEpisodeCard.tsx
│   │   ├── DynamicEpisodeList.tsx
│   │   ├── DynamicHeader.tsx
│   │   ├── EpisodeCard.tsx
│   │   ├── EpisodeEntry.tsx
│   │   ├── FeaturedPodcastsRow.tsx
│   │   ├── PodcastGrid.tsx
│   │   ├── PodcastGridSkeleton.tsx
│   │   ├── episode-list.tsx
│   │   ├── episode-play-controls.tsx
│   │   ├── podcast-filter.tsx
│   │   └── player/
│   │       ├── AudioPlayer.tsx
│   │       ├── ExpandedPlayer.tsx
│   │       ├── ForwardButton.tsx
│   │       ├── MiniPlayer.tsx
│   │       ├── MuteButton.tsx
│   │       ├── PlayButton.tsx
│   │       ├── PlaybackRateButton.tsx
│   │       ├── RewindButton.tsx
│   │       └── Slider.tsx
│   └── videos/
│       ├── CompactVideoCard.tsx
│       ├── FeaturedChannelsRow.tsx
│       ├── error-boundary.tsx
│       ├── infinite-video-grid.tsx
│       ├── loading-ui.tsx
│       ├── use-share.ts
│       ├── video-card.tsx
│       ├── video-filter.tsx
│       ├── video-grid.tsx
│       ├── video-player.tsx
│       ├── featured-channel.tsx
│       └── featured-channel/
│           ├── featured-channel-client.tsx
│           └── index.tsx
```

## Transition Status

Components have been copied to their new locations while keeping the original files intact to ensure a smooth transition. This approach allows for:

1. Gradual updating of imports in the codebase
2. Testing each part of the application after updates
3. Removing the original files once all imports are updated

## Next Steps

1. Update imports in files to point to the new component locations
   - Follow the examples in `import-update-examples.md`
   - Start with a single feature area and update all related files

2. Test thoroughly after each area is updated

3. Once all imports are updated, remove the original component files

4. Consider standardizing all filenames to kebab-case in the future

## Benefits of New Structure

- **Improved Organization**: Components are grouped by domain and purpose
- **Better Code Cohesion**: Related components are located together
- **Clearer Responsibility Boundaries**: UI primitives, domain components, and page-specific components are separated
- **Reduced Duplication**: Common patterns are properly shared
- **Easier Maintenance**: Components are easier to find and understand