# Athlete Mention Detection

This document explains how the athlete mention detection system works and how to run the associated scripts.

## Overview

The athlete mention detection system automatically identifies when athletes are mentioned in episode titles and content. It uses both exact and fuzzy matching to find athlete names, and stores these mentions in the database for future reference.

## How It Works

The system processes episodes in these steps:

1. **Athlete Data Loading**: Loads all athlete names from the database
2. **Text Analysis**:
   - Performs exact matching using regular expressions
   - Performs fuzzy matching for cases where names might be slightly different
   - Extracts surrounding context for each mention
3. **Deduplication**: Removes duplicate mentions, keeping the highest confidence match
4. **Storage**: Saves mentions to the database with:
   - Source (title or description)
   - Confidence score
   - Surrounding context

## Running the Scripts

### Process All Episodes

To process all unprocessed episodes:

```bash
bun run scripts/process-athlete-mentions.ts
```

The script:
- Processes episodes in batches of 100
- Shows progress and statistics
- Can be run multiple times to process remaining episodes
- Marks episodes as processed after successful completion

### Process Single Episode

To process a specific episode:

```bash
bun run scripts/process-episode.ts <episodeId>
```

This script:
- Processes a single episode by its ID
- Provides detailed logging of the process
- Shows timing information for each step
- Reports the number of matches found in title and content
- Handles errors gracefully and provides detailed error messages

Example output:
```
Processing athlete mentions for episode: abc123
Episode title: Example Episode Title
detectAthletes: 150ms
  exactMatches: 50ms
  fuzzyMatches: 100ms
processEpisode:abc123: 200ms

Processing complete!
- Title matches: 2
- Content matches: 5
```

### Output Example

When running the batch script, you'll see output like:

```
Starting athlete mention detection...
Total episodes in database: 1000

Current processing status:
- Processed: 500
- Unprocessed: 500

Found 100 episodes to process in this batch
Processed episode abc123 (Episode Title): 2 title matches, 5 content matches
...

Batch processing complete!
- Episodes processed: 100
- Errors encountered: 0

Remaining episodes to process: 400
Run the script again to process the next batch.
```

## Technical Details

### Matching Algorithm

1. **Exact Matching**:
   - Uses word boundary regex (`\b`) to find exact name matches
   - Confidence score of 1.0 for exact matches

2. **Fuzzy Matching**:
   - Uses fuzzy string matching for near-matches
   - Minimum confidence threshold of 0.8
   - Processes text in 3-word sliding windows

### Database Updates

- Uses upsert operations to avoid duplicates
- Updates existing mentions if better matches are found
- Stores context snippets (±50 characters around mention)

## Maintenance

- Monitor the processing logs for any errors
- Check processing status through database queries
- Run the script periodically to process new episodes
- Use the single episode processor for debugging or reprocessing specific episodes

## Performance Considerations

- Processes episodes in batches to manage memory usage
- Uses separate timers for exact and fuzzy matching
- Includes console timing information for performance monitoring
- Single episode processor provides detailed timing breakdowns for debugging 