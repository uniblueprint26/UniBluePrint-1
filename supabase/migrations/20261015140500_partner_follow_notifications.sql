-- Lifestyle Blueprint: notify followers when a followed partner posts a new
-- deal (part 2 of 3, see 20261015140000_partner_follows.sql).
--
-- How deals actually get created today: there is no partner-portal or
-- founder-portal UI that inserts into public.deals (PartnerPortalScreen.jsx
-- only reads/displays stats — grepped, no insert path exists anywhere in
-- app/src). The only things that have ever written to public.deals are
-- migration seeds (20260606140000_seed_lifestyle.sql) and, starting with
-- this change set, the lazy "create a backing deals row for this partner's
-- advertised deal" step inside generate_deal_redemption_code() (see
-- 20261015141000_deal_redemption_codes.sql). A trigger on public.deals is
-- therefore the only real hook point today, and is also the right one
-- going forward: whatever eventually inserts a real new deal (a Partner
-- Portal "Add deal" action, a Founder Portal action, a future admin tool)
-- gets this for free with no extra call to remember.
--
-- auto_created distinguishes those two kinds of insert. The redemption-code
-- RPC bootstraps a deals row for a deal the partner already advertises
-- (visible in PartnerCards.jsx today, via the static `partner.deal` string)
-- the first time ANY user taps "Show code" for that partner — that is not
-- a new deal appearing, and must not notify followers who have already
-- seen that same deal on the partner's listing. Only a row inserted with
-- auto_created = false (the default — i.e. not from that bootstrap path)
-- is treated as a real new-deal event.
alter table public.deals
  add column if not exists auto_created boolean not null default false;

create or replace function public.notify_followers_of_new_deal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _partner_name text;
  _follower     record;
begin
  if new.auto_created or new.active is distinct from true then
    return new;
  end if;

  select p.name into _partner_name from public.partners p where p.id = new.partner_id;
  if _partner_name is null then
    return new; -- unknown partner — nothing meaningful to notify about
  end if;

  for _follower in
    select pf.user_id from public.partner_follows pf where pf.partner_id = new.partner_id
  loop
    perform public.create_notification(
      _follower.user_id,
      'partner_deal',
      _partner_name || ' posted a new deal',
      new.title,
      'deal',
      new.id
    );
  end loop;

  return new;
end;
$$;

-- create or replace trigger (PG14+), not drop + create — DROP on this
-- project has repeatedly timed out against public.deals/related objects in
-- earlier migrations (see 20261012181500_lifestyle_partner_contact_details.sql's
-- own header note on DROP POLICY/DROP FUNCTION timeouts); this form was
-- confirmed to apply live without hitting that issue.
create or replace trigger trg_notify_followers_of_new_deal
  after insert on public.deals
  for each row execute function public.notify_followers_of_new_deal();
