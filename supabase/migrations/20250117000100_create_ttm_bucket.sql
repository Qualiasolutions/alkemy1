-- Create TTM videos storage bucket
INSERT INTO storage.buckets (id, name, owner, public, file_size_limit, allowed_mime_types)
VALUES (
  'ttm-videos',
  'ttm-videos',
  'authenticated',
  true,
  104857600, -- 100MB
  ARRAY['video/mp4', 'video/webm', 'image/jpeg', 'image/png', 'image/webp']
);

-- Create storage policies for TTM bucket
-- Allow authenticated users to upload videos to their project folders
CREATE POLICY "Users can upload TTM videos to their project folders"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ttm-videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to read TTM videos
CREATE POLICY "Users can read TTM videos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'ttm-videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access for video URLs
CREATE POLICY "Public TTM videos are readable"
ON storage.objects
FOR SELECT
TO anon
USING (
  bucket_id = 'ttm-videos' AND
  (storage.foldername(name))[1] = 'public'
);

-- Allow users to update their own TTM videos
CREATE POLICY "Users can update their TTM videos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ttm-videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'ttm-videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own TTM videos
CREATE POLICY "Users can delete their TTM videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'ttm-videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);