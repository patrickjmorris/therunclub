-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_channels_fts;
DROP INDEX IF EXISTS idx_podcasts_fts;
DROP INDEX IF EXISTS idx_videos_fts;
DROP INDEX IF EXISTS idx_episodes_fts;

-- Create new full-text search indexes
-- For Channels
CREATE INDEX idx_channels_fts
ON channels
USING GIN (
  to_tsvector(
    'english',
    title || ' ' || COALESCE(substr(description, 1, 1000), '')
  )
);

-- For Podcasts
CREATE INDEX idx_podcasts_fts
ON podcasts
USING GIN (
  to_tsvector(
    'english',
    title || ' ' || COALESCE(substr(description, 1, 1000), '')
  )
);

-- For Videos
CREATE INDEX idx_videos_fts
ON videos
USING GIN (
  to_tsvector(
    'english',
    title || ' ' || COALESCE(substr(description, 1, 1000), '')
  )
);

-- For Episodes
CREATE INDEX idx_episodes_fts
ON episodes
USING GIN (
  to_tsvector(
    'english',
    title || ' ' || COALESCE(substr(content, 1, 1000), '')
  )
); 