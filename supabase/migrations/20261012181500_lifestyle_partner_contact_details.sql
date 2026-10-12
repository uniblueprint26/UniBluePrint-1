-- GDPR fix: Lifestyle Blueprint partners' real personal contact details
-- (email, phone, Instagram/TikTok handles, business websites) were
-- hardcoded directly in app/src/data/lifestylePartners.js's PARTNERS array,
-- and duplicated again in app/src/data/adBoardAds.js's CURATED_ADS for the
-- 2 of those partners also featured on the Ad Board (Nyz3ditz, The Nail
-- Nurse) — both shipped straight into the JS bundle on every build. Same
-- issue as coach_contact_details (20261012111500_coach_contact_details),
-- same fix, applied to the Lifestyle Blueprint / Ad Board side of it
-- (task #94).
--
-- partners.partner_slug already exists (added in
-- 20260811090000_gdpr_coach_enquiries_connections for the Founder Portal's
-- logo-upload flow) and already matches each partner's `id` string in
-- lifestylePartners.js / adBoardAds.js 1:1 — reused here as the identity
-- key, the same loose link coach_slug already gives coach_contact_details,
-- rather than adding a second slug column of our own.
--
-- Access is restricted the same way as coach_contact_details: no blanket
-- authenticated-read policy on this table. Every real "contact this
-- partner" path in the app reads through the get_lifestyle_partner_contact()
-- RPC below instead of querying this table directly — that RPC is also
-- where the Lifestyle Blueprint browse/claim split (part 2 of this
-- migration) is actually enforced.

create table if not exists public.lifestyle_partner_contact_details (
  partner_slug      text primary key references public.partners(partner_slug) on delete cascade,
  email             text,
  phone             text,
  instagram_handle  text,
  tiktok_handle     text,
  website_url       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.lifestyle_partner_contact_details enable row level security;

-- No blanket authenticated-read policy here on purpose — see header comment.
create policy "partner_manage_own_contact_details"
  on public.lifestyle_partner_contact_details for all to authenticated
  using (
    exists (
      select 1 from public.partner_users pu
      join public.partners p on p.id = pu.partner_id
      where p.partner_slug = lifestyle_partner_contact_details.partner_slug
        and pu.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.partner_users pu
      join public.partners p on p.id = pu.partner_id
      where p.partner_slug = lifestyle_partner_contact_details.partner_slug
        and pu.user_id = auth.uid()
    )
  );

create policy "founder_operations_manage_lifestyle_partner_contact_details"
  on public.lifestyle_partner_contact_details for all to authenticated
  using (public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'operations'))
  with check (public.has_role(auth.uid(), 'founder') or public.has_role(auth.uid(), 'operations'));

create or replace function public.touch_lifestyle_partner_contact_details_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists lifestyle_partner_contact_details_touch_updated_at on public.lifestyle_partner_contact_details;
create trigger lifestyle_partner_contact_details_touch_updated_at
  before update on public.lifestyle_partner_contact_details
  for each row execute function public.touch_lifestyle_partner_contact_details_updated_at();

-- ── Seed: upsert a `partners` row (unclaimed — no partner_users link yet,
-- same shape coach_profiles rows get for coaches who aren't yet registered
-- platform users) for every real Lifestyle Blueprint partner that has
-- contact info on file, keyed by the same `id` string their app listing
-- already uses as `partner_slug`. `type` mirrors each partner's filterKey
-- from lifestylePartners.js — none of these are 'mental-health' (the
-- Lifestyle Blueprint has no live Mental Health partners yet), so every
-- one of them is Pro-gated by get_lifestyle_partner_contact() below, per
-- the browse/claim split in part 2 of this migration.
insert into public.partners (name, type, partner_slug) values
  ('MPFitness',           'fitness',  'mpfitness'),
  ('Nyz3ditz',            'services', 'nyz3ditz'),
  ('The Nail Nurse',      'beauty',   'nailnurse'),
  ('LEVA Impact',         'services', 'leva'),
  ('Henry Sisters Co',    'services', 'henrysisters'),
  ('Camila Aruk',         'fitness',  'camila'),
  ('Saiemsent',           'fashion',  'saiemsent'),
  ('Elect',               'fashion',  'elect'),
  ('Eabakeditt',          'food',     'eabakeditt'),
  ('ilashedbydiya',       'beauty',   'ilashedbydiya'),
  ('Roomy.ie',            'services', 'roomy'),
  ('Royalty Productions', 'services', 'royaltyproductions'),
  ('Vees Lash Studio',    'beauty',   'veeslash'),
  ('CutbyIre',            'beauty',   'cutbyire'),
  ('Poiema Dexigns',      'services', 'poiemadexigns'),
  ('Made By Kelan',       'services', 'kelan'),
  ('Clara''s Beauty Room','beauty',   'claras'),
  ('Lashes By Steph',     'beauty',   'lashessteph'),
  ('Coded69 Studios',     'services', 'coded69studios'),
  ('Z Vision Apparel',    'fashion',  'zvisionapparel')
on conflict (partner_slug) do nothing;

insert into public.lifestyle_partner_contact_details
  (partner_slug, email, phone, instagram_handle, tiktok_handle, website_url)
values
  ('mpfitness',          'milanpirfitness@gmail.com',    '0857633757',     'milanpir_fitness',   null,                null),
  ('nyz3ditz',           null,                           '+353857272875',  'Nyz3ditz',           null,                null),
  ('nailnurse',          null,                           null,             'theenailnurse__',    null,                null),
  ('leva',               'levaalex13@gmail.com',         '0899662635',     'leva.impact',         'leva.media',       'https://alexleva.myportfolio.com/home-page'),
  ('henrysisters',       'henrysistersco@gmail.com',     null,             'henrysistersco',      null,                null),
  ('camila',             'camila.coachfitness@gmail.com','0838602227',     'camilaaruk.coach',    null,                null),
  ('saiemsent',          null,                           null,             'saiemsent',           'saiemsent',        'https://saiemsent.ie'),
  ('elect',              'electgodschosen@gmail.com',    null,             'elect_co',            'elect_co',         null),
  ('eabakeditt',         'lizawakz@yahoo.com',           '0899485617',     'eabakeditt',          'eabakedittt',      null),
  ('ilashedbydiya',      'ilashedbydiya@gmail.com',      '0899428910',     'ilashedbydiya',       'ilashedbydiya',    null),
  ('roomy',              'admin@roomy.ie',               '+353899809654', 'Roomy.ie',             null,               'https://roomy.ie'),
  ('royaltyproductions', 'chidoziemenyoazu1@gmail.com',  '085 185 2451',  'royalty.productions1', null,               null),
  ('veeslash',           'vickylukau123@gmail.com',      '+3530852758798',null,                   null,               null),
  ('cutbyire',           null,                           null,            'cutbyire',             null,               null),
  ('poiemadexigns',      'oedesignns@gmail.com',         '+353834801235', 'poiema_dexigns',       null,               'https://www.olaoluwaesho.com/'),
  ('kelan',              'kelanhenry1@gmail.com',        '0830416835',    'made_by_kelan',        null,               null),
  ('claras',             null,                           null,            'claras_beauty_room',   null,               null),
  ('lashessteph',        null,                           null,            'lashedbystephhx',      null,               null),
  ('coded69studios',     'info@coded69studios.com',      '0897011898',    'coded69studios',       null,               'https://www.coded69studios.com'),
  ('zvisionapparel',     'zvisionapparel@gmail.com',     '+353877021874', 'zvision.apparel',      null,               null)
on conflict (partner_slug) do update set
  email            = excluded.email,
  phone            = excluded.phone,
  instagram_handle = excluded.instagram_handle,
  tiktok_handle    = excluded.tiktok_handle,
  website_url      = excluded.website_url;

-- ── Lifestyle Blueprint browse/claim split (founder decision, Oct 2026) ────
-- docs/business/subscription-pricing-model.md's Free tier says Free users
-- can "Browse Lifestyle Blueprint — see all deals, all categories, all
-- partners. Can only claim Mental Health deals without Pro" — but
-- deals_pro_only_non_mental_health (20260810120100_portals_operations_schema)
-- blocked a Free user from even SELECTing a non-Mental-Health deal row, so
-- there was nothing left to browse. There's no separate "claim" table to
-- gate instead of browsing, so the founder's fix is: open deals SELECT to
-- every authenticated user regardless of category (browsing is free for
-- everyone), and move the real Pro gate onto get_lifestyle_partner_contact()
-- above — a Free user can now see a deal's title/description/pricing, but
-- actually reading the partner's contact info needed to redeem it still
-- requires Pro (or a Mental Health partner, or Founder/Operations, or the
-- partner's own linked business account).
drop policy if exists "deals_mental_health_always_free" on public.deals;
drop policy if exists "deals_pro_only_non_mental_health" on public.deals;

create policy "deals_active_visible_to_all" on public.deals
  for select to authenticated
  using (active = true);

-- ── get_lifestyle_partner_contact(): the one real read path for this
-- table, and the actual enforcement point for the browse/claim split above.
-- SECURITY DEFINER so it can read lifestyle_partner_contact_details despite
-- that table's restrictive RLS, but it never hands back a row the caller
-- isn't entitled to — it decides access itself, the same Pro/mental-health/
-- Founder-Operations rule applied inline below, before touching the table.
--
-- A caller without access gets requires_pro = true and every contact field
-- null (not an error, not a bare empty result) so the UI can show a real
-- "Upgrade to Pro" prompt. An unknown partner_slug returns no rows at all,
-- distinct from "known partner, nothing on file" (which returns one row of
-- nulls with requires_pro = false) — the two look identical as a 0-row
-- result otherwise.
create or replace function public.get_lifestyle_partner_contact(_partner_slug text)
returns table (
  email             text,
  phone             text,
  instagram_handle  text,
  tiktok_handle     text,
  website_url       text,
  requires_pro      boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  _partner_id        uuid;
  _is_mental_health  boolean;
  _has_access        boolean;
begin
  select p.id, (p.type = 'mental-health')
    into _partner_id, _is_mental_health
  from public.partners p
  where p.partner_slug = _partner_slug;

  if _partner_id is null then
    return; -- unknown slug — nothing to return
  end if;

  _has_access :=
    coalesce(_is_mental_health, false)
    or public.user_has_active_pro(auth.uid())
    or public.has_role(auth.uid(), 'founder')
    or public.has_role(auth.uid(), 'operations')
    or exists (
      select 1 from public.partner_users pu
      where pu.partner_id = _partner_id and pu.user_id = auth.uid()
    );

  if not _has_access then
    return query select null::text, null::text, null::text, null::text, null::text, true;
    return;
  end if;

  return query
    select cd.email, cd.phone, cd.instagram_handle, cd.tiktok_handle, cd.website_url, false
    from public.lifestyle_partner_contact_details cd
    where cd.partner_slug = _partner_slug;

  if not found then
    -- Known, accessible partner with no contact row on file (e.g. Energie,
    -- JMC Fitness, Whip Wizardz — genuinely nothing to give out).
    return query select null::text, null::text, null::text, null::text, null::text, false;
  end if;
end;
$$;

revoke all on function public.get_lifestyle_partner_contact(text) from public;
grant execute on function public.get_lifestyle_partner_contact(text) to authenticated;
