-- ─── Storage Buckets ─────────────────────────────────────────────────────────
-- Four purpose-specific buckets. Separate buckets make per-context access
-- control and lifecycle management explicit rather than relying on path
-- conventions in one shared bucket.
--
-- All four are public (public read) — these assets are displayed to all users.
-- Write policies are scoped per bucket as described below.

insert into storage.buckets (id, name, public)
values
  ('profile-pictures', 'profile-pictures', true),
  ('coach-photos',     'coach-photos',     true),
  ('partner-logos',    'partner-logos',    true),
  ('ad-images',        'ad-images',        true)
on conflict (id) do nothing;


-- ─── profile-pictures ────────────────────────────────────────────────────────
-- Any authenticated user can manage their own files.
-- Path convention: {user_id}/avatar.jpg  (fixed path, upsert overwrites in
-- place — no orphaned files accumulate on re-upload).
-- Public read is appropriate: profile photos are visible to all app users.

create policy "profile-pictures: owner insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'profile-pictures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "profile-pictures: owner update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'profile-pictures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "profile-pictures: owner delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'profile-pictures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "profile-pictures: public read"
  on storage.objects for select to public
  using (bucket_id = 'profile-pictures');


-- ─── coach-photos ─────────────────────────────────────────────────────────────
-- Coaches are not platform users who can authenticate — admins/operations
-- upload photos on their behalf via Supabase Studio or a future admin panel.
-- No self-serve upload path is provided in the mobile app.
-- Write: admin or operations (or handler for onboarding assistance).
-- Public read is appropriate: coach photos are visible on the Elevation page.

create policy "coach-photos: admin insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'coach-photos'
    and (
      public.has_role(auth.uid(), 'admin')
      or public.has_role(auth.uid(), 'operations')
      or public.has_role(auth.uid(), 'handler')
    )
  );

create policy "coach-photos: admin update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'coach-photos'
    and (
      public.has_role(auth.uid(), 'admin')
      or public.has_role(auth.uid(), 'operations')
    )
  );

create policy "coach-photos: admin delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'coach-photos'
    and (
      public.has_role(auth.uid(), 'admin')
      or public.has_role(auth.uid(), 'operations')
    )
  );

create policy "coach-photos: public read"
  on storage.objects for select to public
  using (bucket_id = 'coach-photos');


-- ─── partner-logos ────────────────────────────────────────────────────────────
-- Partners are not platform users — admins/operations upload logos on their
-- behalf. No self-serve upload path in the mobile app.
-- Write: admin or operations only (stricter than coach-photos: partners are
-- brand assets, not personal photos — handler involvement not needed).
-- Public read is appropriate: logos are shown on the Lifestyle page.

create policy "partner-logos: admin insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'partner-logos'
    and (
      public.has_role(auth.uid(), 'admin')
      or public.has_role(auth.uid(), 'operations')
    )
  );

create policy "partner-logos: admin update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'partner-logos'
    and (
      public.has_role(auth.uid(), 'admin')
      or public.has_role(auth.uid(), 'operations')
    )
  );

create policy "partner-logos: admin delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'partner-logos'
    and (
      public.has_role(auth.uid(), 'admin')
      or public.has_role(auth.uid(), 'operations')
    )
  );

create policy "partner-logos: public read"
  on storage.objects for select to public
  using (bucket_id = 'partner-logos');


-- ─── ad-images ────────────────────────────────────────────────────────────────
-- Ad submitters can upload an image alongside their ad.
-- Path convention: {user_id}/{timestamp}.jpg
-- The first path segment must equal auth.uid() — enforced by both policy and
-- the ImageUploader component's storagePath prop (set by the parent screen).
-- Public read is appropriate: approved ads are visible to all app users.
-- No update policy: ad images are write-once per submission.

create policy "ad-images: owner insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'ad-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "ad-images: owner delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'ad-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "ad-images: public read"
  on storage.objects for select to public
  using (bucket_id = 'ad-images');


-- ─── Schema additions ─────────────────────────────────────────────────────────

-- profiles: avatar_url already exists (initial migration). No change needed.

-- partners: add logo_url for admin-uploaded logos via partner-logos bucket
alter table public.partners
  add column if not exists logo_url text;

-- coach_profiles: add photo_url for admin-uploaded photos via coach-photos bucket
alter table public.coach_profiles
  add column if not exists photo_url text;

-- ads: several additions
--   user_id  — tracks who submitted the ad; used for RLS and "my ads" queries
--   boards   — destination boards (was missing from original schema, insert was silently failing)
--   status   — workflow stage (pending_review → approved / rejected)
--   image_url already exists (initial migration)
--   target_url already exists (initial migration); insert was incorrectly using 'link'
alter table public.ads
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists boards  text[],
  add column if not exists status  text default 'pending_review';

-- RLS: allow authenticated users to submit ads
-- (no INSERT policy existed — all inserts were silently failing due to RLS)
create policy "ads: authenticated submit"
  on public.ads for insert to authenticated
  with check (auth.uid() = user_id);

-- RLS: allow users to read their own submissions regardless of active flag
-- (existing policy "Authenticated can read active ads" only shows active=true;
-- submitters couldn't see their own pending ads)
create policy "ads: read own submissions"
  on public.ads for select to authenticated
  using (auth.uid() = user_id);
