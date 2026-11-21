-- Changes: sets file_size_limit and allowed_mime_types on the seven public image buckets and on course-connect-files. Destructive: no (existing files are kept; the limits only apply to new uploads). Undo: update storage.buckets set file_size_limit = null, allowed_mime_types = null for the same ids.
--
-- R19: only feed-clips had limits. Every other public bucket accepted any file
-- type at any size, so a free account could host anything at UBP's cost.
-- Limits match what the app already enforces client side:
--   feed-photos            10 MB  jpeg png webp   (Composer, resized to jpeg, 10 MB cap)
--   profile-pictures        5 MB  jpeg png webp   (ImageUploader 5 MB, website avatar upload)
--   ad-images               5 MB  jpeg png webp   (ImageUploader)
--   campus-board-photos     5 MB  jpeg png webp   (ImageUploader)
--   coach-photos            5 MB  jpeg png webp   (ImageUploader)
--   partner-logos           5 MB  jpeg png webp   (ImageUploader). No SVG: an SVG in a public bucket can carry script.
--   course-connect-files   15 MB  pdf jpeg png webp (FileUploader: notes and past papers)
-- Left alone: feed-clips (already 50 MB, mp4, mov, webm) and contributor-uploads
-- (private, used by the website contributor form with unknown file types).
-- If a partner logo ever needs SVG, add 'image/svg+xml' to partner-logos by hand.
-- Existing objects: profile-pictures (png), coach-photos (jpeg) already comply.
-- Public read policies that allow listing are a separate review (R19 second half).

update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'feed-photos';

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id in ('profile-pictures', 'ad-images', 'campus-board-photos', 'coach-photos', 'partner-logos');

update storage.buckets
set file_size_limit = 15728640,
    allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
where id = 'course-connect-files';
