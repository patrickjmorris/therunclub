-- Drop any existing indexes
DROP INDEX IF EXISTS idx_athlete_mentions_athlete_episode;
DROP INDEX IF EXISTS idx_athlete_mentions_episode_athlete;
DROP INDEX IF EXISTS athlete_mentions_unique_idx;

-- Create new table
CREATE TABLE athlete_mentions_new (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id TEXT NOT NULL REFERENCES athletes(world_athletics_id) ON DELETE CASCADE,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('podcast', 'video')),
  source TEXT NOT NULL CHECK (source IN ('title', 'description')),
  confidence NUMERIC NOT NULL,
  context TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_content_reference CHECK (
    (content_type = 'podcast' AND EXISTS (SELECT 1 FROM episodes WHERE id = content_id)) OR
    (content_type = 'video' AND EXISTS (SELECT 1 FROM videos WHERE id = content_id))
  )
);

-- Create indexes
CREATE INDEX idx_athlete_mentions_athlete_content ON athlete_mentions_new (athlete_id, content_id, confidence);
CREATE INDEX idx_athlete_mentions_content_athlete ON athlete_mentions_new (content_id, athlete_id, confidence);
CREATE UNIQUE INDEX athlete_mentions_unique_idx ON athlete_mentions_new (athlete_id, content_id, content_type, source);

-- Migrate existing data
INSERT INTO athlete_mentions_new (
  id,
  athlete_id,
  content_id,
  content_type,
  source,
  confidence,
  context,
  created_at
)
SELECT 
  id,
  athlete_id,
  episode_id,
  'podcast',
  source,
  confidence,
  context,
  created_at
FROM athlete_mentions;

-- Drop old table and rename new one
DROP TABLE athlete_mentions CASCADE;
ALTER TABLE athlete_mentions_new RENAME TO athlete_mentions;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_athlete_mentions_updated_at
  BEFORE UPDATE ON athlete_mentions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 