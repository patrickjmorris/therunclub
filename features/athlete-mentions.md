# Athlete Mention Detection System

## Overview

The athlete mention detection system automatically identifies when athletes are mentioned in podcast episodes and videos. It uses both exact and fuzzy matching to find athlete names, and stores these mentions in the database for future reference.

## Implementation Status

### Phase 1: Database Updates ✅
- [x] Create database migration for new table structure
  - [x] Rename episode_id to content_id
  - [x] Add content_type field
  - [x] Update foreign key constraints
- [x] Update Drizzle schema
- [x] Add indexes for performance
- [x] Create database triggers for updated_at

### Phase 2: Core Processing Logic 🚧
- [ ] Update athlete detection logic to use new schema
  - [ ] Review and update athlete data loading
  - [ ] Update matching algorithms if needed
  - [ ] Add validation for new schema
- [ ] Add video-specific processing
- [ ] Implement content type handling
- [ ] Add validation and error handling

### Phase 3: Processing Services ⏳
- [ ] Backfill Service
  - [ ] Update existing Bull queue processor
  - [ ] Add video support
  - [ ] Implement progress tracking
  - [ ] Add error handling and retries
- [ ] Real-time Service
  - [ ] Extend existing `/api/content` route
  - [ ] Add video support to current implementation
  - [ ] Add webhook support for new content
  - [ ] Implement rate limiting

### Phase 4: Monitoring & Maintenance ⏳
- [ ] Add logging and metrics
- [ ] Implement health checks
- [ ] Create maintenance scripts
- [ ] Add monitoring dashboard

## System Architecture

### Data Structure

We have two options for storing athlete mentions:

1. **Extend Existing Table**
   ```sql
   -- Current athlete_mentions table with added content_type
   CREATE TABLE athlete_mentions (
     id SERIAL PRIMARY KEY,
     athlete_id TEXT NOT NULL,
     content_id TEXT NOT NULL,
     content_type TEXT NOT NULL, -- 'podcast' or 'video'
     source TEXT NOT NULL,      -- 'title' or 'description'
     confidence TEXT NOT NULL,
     context TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

   Pros:
   - Single table for all mentions
   - Simpler queries for getting all mentions
   - Easier to maintain relationships
   - No NULL values to handle
   
   Cons:
   - Less strict referential integrity
   - More complex indexing

2. **Separate Tables**
   ```sql
   -- Episode mentions
   CREATE TABLE episode_athlete_mentions (
     id SERIAL PRIMARY KEY,
     athlete_id TEXT NOT NULL,
     content_id TEXT NOT NULL,
     source TEXT NOT NULL,
     confidence TEXT NOT NULL,
     context TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Video mentions
   CREATE TABLE video_athlete_mentions (
     id SERIAL PRIMARY KEY,
     athlete_id TEXT NOT NULL,
     content_id TEXT NOT NULL,
     source TEXT NOT NULL,
     confidence TEXT NOT NULL,
     context TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

   Pros:
   - Strong referential integrity
   - Simpler queries for specific content types
   - Better indexing options
   
   Cons:
   - Duplicate code for processing
   - More complex to get all mentions
   - Two tables to maintain

### Processing Strategy

We'll implement a two-phase approach:

1. **Backfill Processing**
   - Use existing Bull/Redis queue system
   - Process in batches of 100
   - Handle both episodes and videos
   - Implement progress tracking and error handling

2. **Real-time Processing**
   - Extend existing `/api/content` route
   - Add video support to current implementation
   - Use Supabase Edge Functions for background processing
   - Implement retry logic and error handling

## API Routes

### Content Processing

The existing `/api/content` route will be extended to handle both episodes and videos:

```typescript
GET /api/content?type=athlete-detection
Query Parameters:
- minHoursSinceUpdate: number (default: 24)
- batchSize: number (default: 10)
- contentType: 'podcast' | 'video' | undefined (processes both if undefined)
```

Response:
```typescript
{
  message: string;
  results: {
    processed: number;
    errors: number;
    totalContent: number;
  }
}
```

## Running the System

### Backfill Processing

```bash
# Process all unprocessed content
bun run scripts/process-athlete-mentions.ts

# Process specific content
bun run scripts/process-content.ts <content_type> <content_id>
```

### Real-time Processing

```bash
# Start the API server
bun run scripts/start-api.ts

# Start the Supabase Edge Function
supabase functions serve athlete-mentions
```

## Monitoring

1. **Queue Status**
   - Number of jobs in queue
   - Processing rate
   - Error rate
   - Processing time

2. **Database Metrics**
   - Number of mentions
   - Processing status
   - Error counts

3. **API Metrics**
   - Request rate
   - Response time
   - Error rate

## Maintenance

1. **Regular Tasks**
   - Monitor queue health
   - Check error logs
   - Verify processing status
   - Clean up old jobs

2. **Error Handling**
   - Retry failed jobs
   - Investigate errors
   - Update error handling

3. **Performance**
   - Monitor processing time
   - Optimize queries
   - Update indexes

## Next Steps

1. ✅ Review and update athlete schema integration
2. ✅ Choose database structure (extend vs separate tables)
3. ✅ Create database migrations
4. 🚧 Update core processing logic
5. ⏳ Extend existing API route
6. ⏳ Set up processing services
7. ⏳ Add monitoring and maintenance
8. ⏳ Test with real data
9. ⏳ Deploy to production 