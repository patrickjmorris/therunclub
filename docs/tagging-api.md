# Content Tagging API (`/api/tagging`)

Documentation for the API endpoint used to automatically tag content items.

**Base URLs:**
- Local: `http://localhost:3000/api/tagging`
- Production: `https://www.therunclub.xyz/api/tagging`

**Authorization:** All endpoints require authorization via one of the following methods:
- `x-api-key` header: `-H "x-api-key:  $UPDATE_API_KEY"`
- Cron Secret header: `-H "Authorization: Bearer YOUR_CRON_SECRET"`

**Methods:** `GET`, `POST` (interchangeable)

## Overview

The tagging API allows you to generate AI-powered tags for content items (videos, podcasts, episodes) that have been created or published within a specified time period. The API uses OpenAI's models to analyze content titles, descriptions, and content text to generate relevant running and athletics-related tags.

The timestamp used depends on the content type:
- **Videos:** `createdAt`
- **Episodes:** `pubDate`
- **Podcasts:** `updatedAt` (as `createdAt` is not available)

## Endpoints

### GET /api/tagging

Generate tags for content items based on their creation/publication date.

#### Query Parameters

| Parameter   | Type    | Default     | Description                                                               |
|-------------|---------|-------------|---------------------------------------------------------------------------|
| `type`      | string  | `"all"`       | Content type to tag. Options: `"video"`, `"podcast"`, `"episode"`, `"all"` | 
| `hours`     | number  | `24`          | Look back period in hours for content to tag (based on type-specific timestamp). |
| `batchSize` | number  | `50`          | Maximum number of items to process in a single request                    |
| `skipTagged`| boolean | `true`        | If `true`, skips content items that already have tags.                    |
| `forceTag`  | boolean | `false`       | If `true`, forces tagging even if content already has tags (overrides `skipTagged`). |
| `model`     | string  | `"gpt-4o-mini"` | OpenAI model to use for tag generation (`gpt-4o`, `gpt-3.5-turbo`, etc.). |

#### Response

```json
{
  "message": "Tagging process completed",
  "results": {
    "total": 10,  // Total items processed
    "success": 9, // Items successfully tagged
    "failed": 1   // Items that failed tagging
  },
  "params": { // The parameters used for this run
    "contentType": "video",
    "hours": 24,
    "batchSize": 50,
    "skipTagged": true,
    "forceTag": false,
    "model": "gpt-4o-mini"
  }
}
```

## Examples

### Tag all new content created/published in the last 24 hours

**Local:**
```bash
curl -X GET "http://localhost:3000/api/tagging" \
  -H "x-api-key:  $UPDATE_API_KEY"
```
**Production:**
```bash
curl -X GET "https://www.therunclub.xyz/api/tagging" \
  -H "x-api-key:  $UPDATE_API_KEY"
```

### Tag only new videos created in the last 48 hours

**Local:**
```bash
curl -X GET "http://localhost:3000/api/tagging?type=video&hours=48" \
  -H "x-api-key:  $UPDATE_API_KEY"
```
**Production:**
```bash
curl -X GET "https://www.therunclub.xyz/api/tagging?type=video&hours=48" \
  -H "x-api-key:  $UPDATE_API_KEY"
```

### Tag only new episodes published in the last 12 hours

**Local:**
```bash
curl -X GET "http://localhost:3000/api/tagging?type=episode&hours=12" \
  -H "x-api-key:  $UPDATE_API_KEY"
```
**Production:**
```bash
curl -X GET "https://www.therunclub.xyz/api/tagging?type=episode&hours=12" \
  -H "x-api-key:  $UPDATE_API_KEY"
```

### Force tag content (even if already tagged) from the last 72 hours

**Local:**
```bash
curl -X GET "http://localhost:3000/api/tagging?forceTag=true&hours=72" \
  -H "x-api-key:  $UPDATE_API_KEY"
```
**Production:**
```bash
curl -X GET "https://www.therunclub.xyz/api/tagging?forceTag=true&hours=72" \
  -H "x-api-key:  $UPDATE_API_KEY"
```

### Use a different model for tagging (e.g., gpt-4o)

**Local:**
```bash
curl -X GET "http://localhost:3000/api/tagging?model=gpt-4o" \
  -H "x-api-key:  $UPDATE_API_KEY"
```
**Production:**
```bash
curl -X GET "https://www.therunclub.xyz/api/tagging?model=gpt-4o" \
  -H "x-api-key:  $UPDATE_API_KEY"
```

## Testing

You can test the tagging API using the provided test script:

```bash
# Process all content types with default parameters
bun run scripts/test-tagging-api.ts

# Process only videos
bun run scripts/test-tagging-api.ts --type video

# Process content from the last 48 hours
bun run scripts/test-tagging-api.ts --hours 48

# Process 10 items at a time
bun run scripts/test-tagging-api.ts --batch-size 10

# Force tag content that already has tags
bun run scripts/test-tagging-api.ts --force-tag

# Use GPT-4o model for tagging
bun run scripts/test-tagging-api.ts --model gpt-4o

# Use GPT-3.5 Turbo model for tagging
bun run scripts/test-tagging-api.ts --model gpt-3.5-turbo

# Test against a Vercel preview URL
bun run scripts/test-tagging-api.ts --url https://your-preview-url.vercel.app
```

### Testing Against Vercel Preview Deployments

When testing against Vercel preview deployments, you can use the `--url` parameter to specify the preview URL:

```bash
# Test against a specific Vercel preview URL
bun run scripts/test-tagging-api.ts --url https://therunclub-git-feature-tagging-your-username.vercel.app

# Combine with other parameters
bun run scripts/test-tagging-api.ts --url https://your-preview-url.vercel.app --type video --hours 48
bun run scripts/test-tagging-api.ts --url https://therunclub-beor-mymhy5n6l-patrickjohnmorris-projects.vercel.app --type video --hours 4

```

This is particularly useful for testing changes to the tagging API in a preview environment before merging to production.

## Tag Generation Process

The tagging process follows these steps:

1.  Retrieve content items from the database based on the specified parameters (filtering by `createdAt` for videos, `pubDate` for episodes, `updatedAt` for podcasts, and respecting `skipTagged` unless `forceTag` is true).
2.  For each retrieved content item, generate tags using the specified OpenAI API model.
3.  Normalize and filter the generated tags to ensure quality and consistency.
4.  Save the tags to the database, replacing any existing tags for that content item.

The tag normalization process includes:

-   Converting tags to lowercase
-   Removing special characters
-   Expanding abbreviations
-   Fuzzy matching to standardize similar tags
-   Scoring and prioritizing tags based on relevance
-   Limiting to 3-5 high-quality tags per content item

## Scheduling

For regular tagging of new content, it's recommended to set up a cron job that calls the tagging API periodically. For example, to tag new content created/published in the last hour:

```bash
# Runs every hour at the beginning of the hour
0 * * * * curl -X GET "https://www.therunclub.xyz/api/tagging?hours=1" -H "Authorization: Bearer YOUR_CRON_SECRET"
```