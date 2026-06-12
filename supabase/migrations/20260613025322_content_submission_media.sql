-- ============================================================================
-- Community submissions can attach up to 5 images/videos. They're uploaded
-- straight to Cloudinary from the browser (unsigned preset) — we only store
-- the resulting URLs here, so no media ever touches Supabase storage.
-- Each element: { "url": text, "kind": "image"|"video", "publicId": text }.
-- ============================================================================
alter table public.content_submissions
  add column if not exists media jsonb not null default '[]'::jsonb;

alter table public.content_submissions
  add constraint content_submissions_media_max_5
  check (jsonb_typeof(media) = 'array' and jsonb_array_length(media) <= 5);
