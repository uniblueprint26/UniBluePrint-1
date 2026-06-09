-- Give every user a welcome notification (on signup, + backfill existing users).

create or replace function public.handle_new_profile_notification()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, category, title, message)
  values (new.id, 'welcome', 'Welcome to UniBluePrint',
          'Your Blueprint is ready. Explore your dashboard to get started.');
  return new;
end; $$;

drop trigger if exists on_profile_created_notification on public.profiles;
create trigger on_profile_created_notification
  after insert on public.profiles
  for each row execute function public.handle_new_profile_notification();

-- Backfill existing users (idempotent).
insert into public.notifications (user_id, category, title, message)
select p.id, 'welcome', 'Welcome to UniBluePrint',
       'Your Blueprint is ready. Explore your dashboard to get started.'
from public.profiles p
where not exists (
  select 1 from public.notifications n where n.user_id = p.id and n.category = 'welcome'
);
