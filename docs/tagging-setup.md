# Content Tagging Setup Guide

This guide explains how to set up and use the AI-powered content tagging feature for The Run Club.

## Overview

The content tagging feature automatically generates relevant tags for videos, podcasts, and episodes using OpenAI's API. The system uses:

1. A `content_tags` table in the database to store tags
2. A backfill script for tagging existing content

## Setup Steps

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key

# Supabase Database URL (for applying triggers)
SUPABASE_DB_URL=postgresql://postgres:password@db.example.supabase.co:5432/postgres
```

### 2. Database Migration

Run the database migration to create the `content_tags` table:

```bash
bun run db:migrate
```

### 3. Deploy the Supabase Edge Function

Deploy the tagging trigger Edge Function to Supabase:

```bash
bun run deploy:tagging-function
```

**Important**: Before running this command, update the `TRIGGER_WEBHOOK_URL` in `scripts/deploy-tagging-function.sh` with your actual Trigger.dev webhook URL.

### 4. Apply Database Triggers

Apply the database triggers to automatically tag new content:

```bash
bun run apply:tagging-triggers
```

### 5. Backfill Existing Content

Run the backfill script to tag existing content:

```bash
bun run backfill:tags
```

### Backfilling Tags

To backfill tags for existing content in production:

```bash
# Process all untagged content
NODE_ENV=production bun run scripts/backfill-tags.ts

# Process only untagged videos
NODE_ENV=production bun run scripts/backfill-tags.ts --type video

# Process all videos, including those already tagged
NODE_ENV=production bun run scripts/backfill-tags.ts --type video --skip-tagged=false

# Process content from the last 30 days
NODE_ENV=production bun run scripts/backfill-tags.ts --days 30

# Process with a smaller batch size
NODE_ENV=production bun run scripts/backfill-tags.ts --batch-size 10

# Limit the number of items processed
NODE_ENV=production bun run scripts/backfill-tags.ts --limit 100
```