-- Marketing consent for the Mailchimp sync (sync-mailchimp-subscriber Edge
-- Function). Separate from account-creation/transactional consent per GDPR,
-- explicit opt-in, unchecked by default on both forms that offer it
-- (ComingSoonPage's early-access form, SignUpPage's real account form).
-- Nobody is synced to Mailchimp without this being true.

alter table public.early_access_signups
  add column if not exists marketing_consent boolean not null default false;

alter table public.profiles
  add column if not exists marketing_consent boolean not null default false;

-- handle_new_user() already sets full_name from signUp()'s options.data;
-- extend it to also read marketing_consent the same way.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, marketing_consent)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce((new.raw_user_meta_data->>'marketing_consent')::boolean, false)
  );
  return new;
end;
$$;
