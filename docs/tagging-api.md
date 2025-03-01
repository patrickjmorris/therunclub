# Content Tagging API

This document describes the API for tagging content in The Run Club application.

## Overview

The tagging API allows you to generate AI-powered tags for content items (videos, podcasts, episodes) that have been created or updated within a specified time period. The API uses OpenAI's models to analyze content titles, descriptions, and content text to generate relevant running and athletics-related tags.

## Authentication

All requests to the tagging API require authentication using one of the following methods:

1. API Key: Include the `x-api-key` header with your API key.
2. Cron Secret: Include the `Authorization` header with the value `Bearer <CRON_SECRET>`.

## Endpoints

### GET /api/tagging

Generate tags for content items.

#### Query Parameters

| Parameter   | Type    | Default     | Description                                                  |
|-------------|---------|-------------|--------------------------------------------------------------|
| type        | string  | "all"       | Content type to tag. Options: "video", "podcast", "episode", "all" |
| hours       | number  | 24          | Look back period in hours for content to tag                 |
| batchSize   | number  | 50          | Maximum number of items to process in a single request       |
| skipTagged  | boolean | true        | Whether to skip content that already has tags                |
| forceTag    | boolean | false       | Whether to force tagging of content that already has tags    |
| model       | string  | "gpt-4o-mini" | OpenAI model to use for tag generation                   |

#### Response

```json
{
  "message": "Tagging process completed",
  "results": {
    "total": 10,
    "success": 9,
    "failed": 1
  },
  "params": {
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

### Tag all content from the last 24 hours

```bash
curl -X GET "https://therunclub.vercel.app/api/tagging" \
  -H "x-api-key: YOUR_API_KEY"
```

### Tag only videos from the last 48 hours

```bash
curl -X GET "https://therunclub.vercel.app/api/tagging?type=video&hours=48" \
  -H "x-api-key: YOUR_API_KEY"
```

### Force tag content that already has tags

```bash
curl -X GET "https://therunclub.vercel.app/api/tagging?forceTag=true" \
  -H "x-api-key: YOUR_API_KEY"
```

### Use a different model for tagging

```bash
curl -X GET "https://therunclub.vercel.app/api/tagging?model=gpt-4o" \
  -H "x-api-key: YOUR_API_KEY"
```

```bash
curl -X GET "https://therunclub.vercel.app/api/tagging?model=gpt-3.5-turbo" \
  -H "x-api-key: YOUR_API_KEY"
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

1. Retrieve content items from the database based on the specified parameters.
2. For each content item, generate tags using the OpenAI API.
3. Normalize and filter the generated tags to ensure quality and consistency.
4. Save the tags to the database.

The tag normalization process includes:
- Converting tags to lowercase
- Removing special characters
- Expanding abbreviations
- Fuzzy matching to standardize similar tags
- Scoring and prioritizing tags based on relevance
- Limiting to 3-5 high-quality tags per content item

## Scheduling

For regular tagging of new content, it's recommended to set up a cron job that calls the tagging API periodically. For example, to tag new content every hour:

```bash
0 * * * * curl -X GET "https://therunclub.vercel.app/api/tagging?hours=1" -H "Authorization: Bearer YOUR_CRON_SECRET"
```