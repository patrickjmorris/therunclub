-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to upload athlete images
CREATE POLICY "Allow authenticated uploads to athlete-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'athlete-images' AND
    (storage.foldername(name))[1] = 'athletes'
);

-- Create policy to allow public read access to athlete images
CREATE POLICY "Allow public read access to athlete-images"
ON storage.objects
FOR SELECT
TO public
USING (
    bucket_id = 'athlete-images' AND
    (storage.foldername(name))[1] = 'athletes'
);

-- Create policy to allow authenticated users to delete their own uploads
CREATE POLICY "Allow authenticated users to delete athlete images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'athlete-images' AND
    (storage.foldername(name))[1] = 'athletes'
); 