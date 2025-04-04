# Import Update Examples

When transitioning to the new component structure, you'll need to update imports across the codebase. Here are examples of how to update import statements:

## Component Naming Convention

In this reorganization, we're adopting a consistent naming convention:
- **Files**: Use kebab-case for filenames (e.g., `container.tsx`, `page-header.tsx`)
- **Components**: Continue using PascalCase for component names as per React convention

## Common Components

**Before:**
```tsx
import { Container } from "@/components/Container"
import { ModeToggle } from "@/components/mode-toggle"
import { PageHeader } from "@/components/page-header"
import { SiteHeader } from "@/components/site-header"
```

**After:**
```tsx
import { Container } from "@/components/common/container"
import { ModeToggle } from "@/components/common/mode-toggle"
import { PageHeader } from "@/components/common/page-header"
import { SiteHeader } from "@/components/common/site-header"
```

## Podcast Components

**Before:**
```tsx
import { AudioProvider } from "@/components/AudioProvider"
import { EpisodePlayButton } from "@/components/EpisodePlayButton"
import { PodcastGrid } from "@/components/podcasts/PodcastGrid"
import { PlayButton } from "@/components/player/PlayButton"
```

**After:**
```tsx
import { AudioProvider } from "@/components/podcasts/audio-provider"
import { EpisodePlayButton } from "@/components/podcasts/episode-play-button"
import { PodcastGrid } from "@/components/podcasts/PodcastGrid" // No change needed (already correctly placed)
import { PlayButton } from "@/components/podcasts/player/PlayButton"
```

## Video Components

**Before:**
```tsx
import { VideoCard } from "@/components/videos/video-card"
import { FeaturedChannel } from "@/components/featured-channel"
import { FeaturedChannelClient } from "@/components/featured-channel/featured-channel-client"
```

**After:**
```tsx
import { VideoCard } from "@/components/videos/video-card" // No change needed (already correctly placed)
import { FeaturedChannel } from "@/components/videos/featured-channel"
import { FeaturedChannelClient } from "@/components/videos/featured-channel/featured-channel-client"
```

## Athlete Components

**Before:**
```tsx
import { AthleteList } from "@/components/athlete-list"
import { AthleteMentions } from "@/components/athlete-mentions"
```

**After:**
```tsx
import { AthleteList } from "@/components/athletes/athlete-list"
import { AthleteMentions } from "@/components/athletes/athlete-mentions"
```

## Calculator Components

**Before:**
```tsx
import { PaceCalculator } from "@/components/calculator/pace-calculator"
import { SplitsTable } from "@/components/calculator/splits-table"
```

**After:**
```tsx
import { PaceCalculator } from "@/app/calculators/components/pace-calculator"
import { SplitsTable } from "@/app/calculators/components/splits-table"
```

## Dashboard Components

**Before:**
```tsx
import { DataTable } from "@/components/dashboard/data-table/data-table"
import { columns } from "@/components/dashboard/podcasts/columns"
```

**After:**
```tsx
import { DataTable } from "@/app/dashboard/components/data-table/data-table"
import { columns } from "@/app/dashboard/components/podcasts/columns"
```

## Link Preview Components

**Before:**
```tsx
import { LinkPreview } from "@/components/LinkPreview"
import { LinkPreviewClientWrapper } from "@/components/LinkPreviewClientWrapper"
```

**After:**
```tsx
import { LinkPreview } from "@/components/common/link-preview/link-preview"
import { LinkPreviewClientWrapper } from "@/components/common/link-preview/link-preview-client-wrapper"
```

## Content & Search Components

**Before:**
```tsx
import { AddContentDialog } from "@/components/content/AddContentDialog"
import { SearchBar } from "@/components/search/search-bar"
```

**After:**
```tsx
import { AddContentDialog } from "@/components/common/content/AddContentDialog" 
import { SearchBar } from "@/components/common/search/search-bar"
```

## Implementation Strategy

1. Start with a single feature area and update all imports related to that area
2. Test thoroughly after each area is updated
3. Proceed with the next feature area
4. Once all imports are updated, remove the old component files

This incremental approach minimizes disruption while maintaining a working application throughout the transition.

## File Naming Standardization

For future development, consider standardizing all filenames to kebab-case (including those that are currently in PascalCase). This would make the codebase more consistent and is a common convention in Next.js projects.