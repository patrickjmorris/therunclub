-- Create the athlete-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name)
VALUES ('athlete-images', 'athlete-images')
ON CONFLICT (id) DO NOTHING;

-- Set public access for the bucket
UPDATE storage.buckets
SET public = true
WHERE id = 'athlete-images'; 