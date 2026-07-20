-- Blueprint Contributors Programme: submissions table + private storage bucket for uploads.

create type public.contributor_submission_status as enum ('pending', 'approved', 'rejected');

create table public.contributor_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category text not null,
  title text not null,
  description text,
  subject text,
  university text,
  course text,
  module_name text,
  module_code text,
  year_group text,
  link_url text,
  file_path text,
  details jsonb default '{}'::jsonb,
  status public.contributor_submission_status default 'pending',
  review_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.contributor_submissions enable row level security;

create policy "Contributors can read own submissions" on public.contributor_submissions
  for select to authenticated using (auth.uid() = user_id);

create policy "Contributors can insert own submissions" on public.contributor_submissions
  for insert to authenticated with check (auth.uid() = user_id);

create policy "Contributors can update own pending submissions" on public.contributor_submissions
  for update to authenticated using (auth.uid() = user_id and status = 'pending')
  with check (auth.uid() = user_id);

create index contributor_submissions_user_id_idx on public.contributor_submissions (user_id);
create index contributor_submissions_category_idx on public.contributor_submissions (category);

-- Private bucket — files served via signed URLs only, one folder per contributor (uid/filename)
insert into storage.buckets (id, name, public)
values ('contributor-uploads', 'contributor-uploads', false)
on conflict (id) do nothing;

create policy "Contributors can upload own files" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'contributor-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Contributors can read own files" on storage.objects
  for select to authenticated
  using (bucket_id = 'contributor-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Contributors can delete own files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'contributor-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

alter publication supabase_realtime add table public.contributor_submissions;
