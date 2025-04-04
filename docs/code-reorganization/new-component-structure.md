# New Component Structure

The components have been reorganized to follow a more logical structure based on domain, feature, and common patterns.

## Component Organization

```
src/
├── app/
│   ├── login/components/
│   │   └── login-form.tsx
│   ├── dashboard/components/
│   │   ├── athletes/
│   │   ├── data-table/
│   │   └── podcasts/
│   └── calculators/components/
│       ├── pace-calculator.tsx
│       ├── splits-table.tsx
│       ├── time-input-tooltip.tsx
│       ├── track-workout.tsx
│       └── training-zones.tsx
├── components/
│   ├── ui/ (shadcn UI components)
│   │   ├── alert-dialog.tsx
│   │   ├── button.tsx
│   │   ├── ... (other UI components)
│   ├── common/ (shared components)
│   │   ├── analytics.tsx
│   │   ├── command-menu.tsx
│   │   ├── container.tsx
│   │   ├── coming-soon.tsx
│   │   ├── icons.tsx
│   │   ├── infinite-scroll.tsx
│   │   ├── mode-toggle.tsx
│   │   ├── mobile-nav.tsx
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
│   │   ├── link-preview/
│   │   │   ├── link-preview.tsx
│   │   │   ├── link-preview-client-wrapper.tsx
│   │   │   ├── link-preview-error-boundary.tsx
│   │   │   └── link-preview-preloader.tsx
│   │   ├── nav/
│   │   │   ├── main-nav.tsx
│   │   │   └── user-nav.tsx
│   │   └── search/
│   │       ├── global-search.tsx
│   │       ├── search-bar.tsx
│   │       └── search-results.tsx
│   ├── athletes/ (athlete domain components)
│   │   ├── athlete-list.tsx
│   │   ├── athlete-mentions.tsx
│   │   └── athlete-references.tsx
│   ├── podcasts/ (podcast domain components)
│   │   ├── audio-provider.tsx
│   │   ├── episode-play-button.tsx
│   │   ├── listen-now-button.tsx
│   │   ├── pause-icon.tsx
│   │   ├── play-icon.tsx
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
│   └── videos/ (video domain components)
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

## Transition Guide

The components have been organized into a more logical structure, but they are maintained as copies in both locations to allow for a gradual transition. The recommended steps to complete the transition are:

1. Update imports in files to point to the new component locations
2. Test each updated import to ensure components continue to work correctly
3. Once all imports have been updated, remove the original components

## Benefits of New Structure

- **Improved Discoverability**: Components are organized by domain and purpose
- **Better Code Organization**: Related components are grouped together
- **Clearer Responsibility Boundaries**: Components are either UI primitives, domain-specific, or page-specific
- **Reduced Duplication**: Common patterns are properly shared across the application
- **Easier Maintenance**: Components are easier to find and maintain