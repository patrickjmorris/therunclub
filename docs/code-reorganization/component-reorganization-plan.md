# Component Reorganization Plan

## Components to Remove (Unused)
- src/components/TinyWaveFormIcon.tsx
- src/components/ShowMoreButton.tsx 
- src/components/TruncatedDescription.tsx
- src/components/chat/* (entire directory)

## Keep UI Components (No Change)
- src/components/ui/* (All shadcn components)

## Components to Move to Common
- src/components/Container.tsx -> src/components/common/Container.tsx
- src/components/analytics.tsx -> src/components/common/analytics.tsx
- src/components/mode-toggle.tsx -> src/components/common/mode-toggle.tsx
- src/components/page-header.tsx -> src/components/common/page-header.tsx
- src/components/tailwind-indicator.tsx -> src/components/common/tailwind-indicator.tsx
- src/components/icons.tsx -> src/components/common/icons.tsx
- src/components/providers.tsx -> src/components/common/providers.tsx
- src/components/theme-provider.tsx -> src/components/common/theme-provider.tsx
- src/components/infinite-scroll.tsx -> src/components/common/infinite-scroll.tsx
- src/components/TabsWithState.tsx -> src/components/common/tabs-with-state.tsx
- src/components/coming-soon.tsx -> src/components/common/coming-soon.tsx

## Components to Move to Domain-Specific Folders
### Podcast Components
- src/components/AudioProvider.tsx -> src/components/podcasts/audio-provider.tsx
- src/components/EpisodePlayButton.tsx -> src/components/podcasts/episode-play-button.tsx
- src/components/ListenNowButton.tsx -> src/components/podcasts/listen-now-button.tsx
- src/components/PauseIcon.tsx -> src/components/podcasts/pause-icon.tsx
- src/components/PlayIcon.tsx -> src/components/podcasts/play-icon.tsx
- src/components/Waveform.tsx -> src/components/podcasts/waveform.tsx
- src/components/player/* -> src/components/podcasts/player/*
- src/components/podcast-search.tsx -> src/components/podcasts/podcast-search.tsx
- src/components/podcasts/* -> src/components/podcasts/* (already correctly organized)

### Video Components
- src/components/videos/* -> src/components/videos/* (already correctly organized)
- src/components/featured-channel/* -> src/components/videos/featured-channel/*
- src/components/featured-channel.tsx -> src/components/videos/featured-channel.tsx

### Athlete Components
- src/components/athlete-list.tsx -> src/components/athletes/athlete-list.tsx
- src/components/athlete-mentions.tsx -> src/components/athletes/athlete-mentions.tsx
- src/components/athlete-references.tsx -> src/components/athletes/athlete-references.tsx

### Dashboard Components
- src/components/dashboard/* -> src/app/dashboard/components/* (move to app dir)

### Calculator Components
- src/components/calculator/* -> src/app/calculators/components/*

### Navigation Components
- src/components/navigation-menu.tsx -> src/components/common/navigation-menu.tsx
- src/components/command-menu.tsx -> src/components/common/command-menu.tsx
- src/components/mobile-nav.tsx -> src/components/common/mobile-nav.tsx
- src/components/site-header.tsx -> src/components/common/site-header.tsx
- src/components/nav/* -> src/components/common/nav/*

### Content Components
- src/components/content/* -> src/components/common/content/*

### Search Components 
- src/components/search/* -> src/components/common/search/*

### Link Preview Components
- src/components/LinkPreview*.tsx -> src/components/common/link-preview/*

### Other Components
- src/components/FormattedDate.tsx -> src/components/common/formatted-date.tsx
- src/components/login-form.tsx -> src/app/login/components/login-form.tsx