# Video Mention Detection Implementation

This feature extends the athlete mention detection system to include YouTube videos, allowing us to identify when athletes are mentioned in video content and display these mentions on athlete profile pages.

## Completed Tasks

- [x] Create initial task documentation
- [x] Create processing scripts for video mentions
  - [x] Create batch processing script for video mentions (scripts/process-video-mentions.ts)
  - [x] Create individual video processing script (scripts/process-video.ts)
- [x] Update API routes
  - [x] Add video-mentions content type to API route
  - [x] Implement batch processing for videos
  - [x] Add reprocessing capability
- [x] Refactor for code reuse
  - [x] Create shared content processing logic for both podcasts and videos
  - [x] Reduce code duplication across implementations
- [x] Add UI integration
  - [x] Create/modify components to display video mentions
  - [x] Ensure proper distinction between video and podcast mentions

## Future Tasks

- [ ] Performance testing and optimization
- [ ] Add support for video transcripts if needed

## Implementation Plan

The video mention detection system automatically identifies when athletes are mentioned in video titles and descriptions. It uses the same matching algorithms as the podcast mention detection system, leveraging both exact and fuzzy matching to find athlete names, and stores these mentions in the database for display on athlete profile pages.

### Implementation Details

1. **Shared Processing Logic**:
   - Unified detection algorithm across content types (podcasts and videos)
   - Common batch processing functions with content-type-specific querying
   - Single location for feature enhancements and bug fixes

2. **Processing Logic**:
   - Uses the existing athlete detection algorithm with fuzzy matching
   - Processes video title and first 500 characters of description
   - Stores mentions with source (title or description), confidence score, and context

3. **API Integration**:
   - Added "video-mentions" as a content type to the /api/content route
   - Allows batch processing of videos, prioritizing newest first
   - Supports reprocessing of videos when needed

4. **UI Display**:
   - Shows video mentions on athlete profile pages
   - Clearly distinguishes between video and podcast mentions using tabs
   - Displays relevant content with proper UI components

### Relevant Files

- `src/lib/services/athlete-service.ts` - Core shared processing logic
- `scripts/process-video-mentions.ts` - Batch processing script for video mentions
- `scripts/process-video.ts` - Individual video processing script
- `src/app/api/content/route.ts` - API route for content updates
- `src/components/athletes/athlete-mentions.tsx` - UI component for displaying mentions
- `src/components/videos/video-card.tsx` - UI component for video display

## Usage

### Process Single Video

To process a specific video:

```bash
bun run scripts/process-video.ts <videoId>
```

### Process Batch of Videos

To process videos in batches:

```bash
bun run scripts/process-video-mentions.ts
```

Optional parameters:
- `--limit=100` - Number of videos to process (default: 100)
- `--hours=24` - Process videos updated in the last X hours (default: 24)

### Using the API

To trigger processing via the API:

```
GET /api/content?type=video-mentions
```

Optionally, you can provide these parameters:
- `minHoursSinceUpdate`: Process videos updated in the last X hours (default: 24)
- `batchSize`: Number of videos to process in one batch (default: 10)

Example:
```
GET /api/content?type=video-mentions&minHoursSinceUpdate=48&batchSize=20
``` 