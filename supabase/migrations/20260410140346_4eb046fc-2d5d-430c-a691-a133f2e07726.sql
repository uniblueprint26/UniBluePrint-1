-- Create enums
create type public.app_role as enum ('admin', 'moderator', 'user', 'handler', 'coach', 'operations');
create type public.submission_stage as enum ('submitted', 'in_queue', 'assigned', 'in_review', 'delivered');

-- Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  date_of_birth date,
  user_type text,
  university_or_field text,
  personal_email text,
  university_email text,
  delivery_preference text default 'primary',
  onboarding_step integer default 1,
  onboarding_completed boolean default false,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can read own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- User roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  )
$$;

create policy "Users can read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

-- Services
create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text,
  price_cents integer,
  active boolean default true,
  created_at timestamptz default now()
);
alter table public.services enable row level security;
create policy "Anyone can read active services" on public.services for select to authenticated using (active = true);

-- Submissions
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  service_id uuid references public.services(id),
  stage submission_stage default 'submitted',
  submitted_at timestamptz default now(),
  in_queue_at timestamptz,
  assigned_at timestamptz,
  in_review_at timestamptz,
  delivered_at timestamptz,
  handler_id uuid references auth.users(id),
  notes text,
  created_at timestamptz default now()
);
alter table public.submissions enable row level security;
create policy "Users can read own submissions" on public.submissions for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own submissions" on public.submissions for insert to authenticated with check (auth.uid() = user_id);

-- Engagements
create table public.engagements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  submission_id uuid references public.submissions(id),
  type text,
  status text default 'active',
  started_at timestamptz default now(),
  completed_at timestamptz,
  created_at timestamptz default now()
);
alter table public.engagements enable row level security;
create policy "Users can read own engagements" on public.engagements for select to authenticated using (auth.uid() = user_id);

-- Partners
create table public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text,
  contact_email text,
  active boolean default true,
  created_at timestamptz default now()
);
alter table public.partners enable row level security;
create policy "Authenticated can read active partners" on public.partners for select to authenticated using (active = true);

-- Deals
create table public.deals (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id),
  title text not null,
  description text,
  discount_percent integer,
  valid_until timestamptz,
  active boolean default true,
  created_at timestamptz default now()
);
alter table public.deals enable row level security;
create policy "Authenticated can read active deals" on public.deals for select to authenticated using (active = true);

-- Boards
create table public.boards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  type text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
alter table public.boards enable row level security;
create policy "Authenticated can read boards" on public.boards for select to authenticated using (true);

-- Posts
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references public.boards(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.posts enable row level security;
create policy "Authenticated can read posts" on public.posts for select to authenticated using (true);
create policy "Users can insert own posts" on public.posts for insert to authenticated with check (auth.uid() = user_id);

-- Budget entries
create table public.budget_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null,
  category text,
  amount_cents integer not null,
  description text,
  date date default current_date,
  mode text default 'balanced',
  created_at timestamptz default now()
);
alter table public.budget_entries enable row level security;
create policy "Users can manage own budget entries" on public.budget_entries for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Ads
create table public.ads (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id),
  title text not null,
  description text,
  image_url text,
  target_url text,
  active boolean default true,
  created_at timestamptz default now()
);
alter table public.ads enable row level security;
create policy "Authenticated can read active ads" on public.ads for select to authenticated using (active = true);

-- Coach profiles
create table public.coach_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  specialisation text,
  bio text,
  available boolean default true,
  created_at timestamptz default now()
);
alter table public.coach_profiles enable row level security;
create policy "Authenticated can read coach profiles" on public.coach_profiles for select to authenticated using (true);
create policy "Coaches can update own profile" on public.coach_profiles for update to authenticated using (auth.uid() = user_id);

-- Handler assignments
create table public.handler_assignments (
  id uuid primary key default gen_random_uuid(),
  handler_id uuid references auth.users(id) on delete cascade not null,
  submission_id uuid references public.submissions(id) on delete cascade not null,
  assigned_at timestamptz default now(),
  status text default 'active'
);
alter table public.handler_assignments enable row level security;
create policy "Handlers can read own assignments" on public.handler_assignments for select to authenticated using (auth.uid() = handler_id);

-- Notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category text not null,
  title text not null,
  message text,
  read boolean default false,
  created_at timestamptz default now()
);
alter table public.notifications enable row level security;
create policy "Users can read own notifications" on public.notifications for select to authenticated using (auth.uid() = user_id);
create policy "Users can update own notifications" on public.notifications for update to authenticated using (auth.uid() = user_id);

-- Handler queue
create table public.handler_queue (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references public.submissions(id) on delete cascade not null,
  priority integer default 0,
  queued_at timestamptz default now(),
  picked_at timestamptz,
  handler_id uuid references auth.users(id)
);
alter table public.handler_queue enable row level security;
create policy "Handlers can read queue" on public.handler_queue for select to authenticated using (public.has_role(auth.uid(), 'handler') or public.has_role(auth.uid(), 'operations'));

-- Ticket revisions
create table public.ticket_revisions (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references public.submissions(id) on delete cascade not null,
  revised_by uuid references auth.users(id) not null,
  revision_notes text,
  created_at timestamptz default now()
);
alter table public.ticket_revisions enable row level security;
create policy "Stakeholders can read ticket revisions" on public.ticket_revisions for select to authenticated using (
  auth.uid() = revised_by 
  or public.has_role(auth.uid(), 'handler') 
  or public.has_role(auth.uid(), 'operations')
);

-- Commission declarations
create table public.commission_declarations (
  id uuid primary key default gen_random_uuid(),
  handler_id uuid references auth.users(id) not null,
  submission_id uuid references public.submissions(id),
  amount_cents integer not null,
  status text default 'pending',
  declared_at timestamptz default now()
);
alter table public.commission_declarations enable row level security;
create policy "Handlers can read own commissions" on public.commission_declarations for select to authenticated using (auth.uid() = handler_id or public.has_role(auth.uid(), 'operations'));

-- Partner payouts
create table public.partner_payouts (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) not null,
  amount_cents integer not null,
  status text default 'pending',
  payout_date timestamptz,
  created_at timestamptz default now()
);
alter table public.partner_payouts enable row level security;
create policy "Operations can read partner payouts" on public.partner_payouts for select to authenticated using (public.has_role(auth.uid(), 'operations'));

-- Carpool terms acceptance
create table public.carpool_terms_acceptance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  accepted_at timestamptz default now(),
  version text not null
);
alter table public.carpool_terms_acceptance enable row level security;
create policy "Users can read own acceptance" on public.carpool_terms_acceptance for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own acceptance" on public.carpool_terms_acceptance for insert to authenticated with check (auth.uid() = user_id);

-- Legal acknowledgements
create table public.legal_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  document_type text not null,
  acknowledged_at timestamptz default now(),
  version text not null
);
alter table public.legal_acknowledgements enable row level security;
create policy "Users can read own acknowledgements" on public.legal_acknowledgements for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own acknowledgements" on public.legal_acknowledgements for insert to authenticated with check (auth.uid() = user_id);

-- Operations flags
create table public.operations_flags (
  id uuid primary key default gen_random_uuid(),
  flagged_by uuid references auth.users(id),
  target_type text not null,
  target_id uuid not null,
  reason text,
  status text default 'open',
  created_at timestamptz default now(),
  resolved_at timestamptz
);
alter table public.operations_flags enable row level security;
create policy "Operations can manage flags" on public.operations_flags for all to authenticated using (public.has_role(auth.uid(), 'operations')) with check (public.has_role(auth.uid(), 'operations'));

-- Spot checks
create table public.spot_checks (
  id uuid primary key default gen_random_uuid(),
  checked_by uuid references auth.users(id) not null,
  target_type text not null,
  target_id uuid not null,
  result text,
  notes text,
  checked_at timestamptz default now()
);
alter table public.spot_checks enable row level security;
create policy "Operations can manage spot checks" on public.spot_checks for all to authenticated using (public.has_role(auth.uid(), 'operations')) with check (public.has_role(auth.uid(), 'operations'));

-- Refunds
create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  submission_id uuid references public.submissions(id),
  amount_cents integer not null,
  reason text,
  status text default 'pending',
  requested_at timestamptz default now(),
  processed_at timestamptz,
  processed_by uuid references auth.users(id)
);
alter table public.refunds enable row level security;
create policy "Users can read own refunds" on public.refunds for select to authenticated using (auth.uid() = user_id);
create policy "Users can request refunds" on public.refunds for insert to authenticated with check (auth.uid() = user_id);
create policy "Operations can manage refunds" on public.refunds for select to authenticated using (public.has_role(auth.uid(), 'operations'));

-- Enable realtime on key tables
alter publication supabase_realtime add table public.boards;
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.engagements;