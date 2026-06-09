-- Seed sample Lifestyle partners + deals.
-- NOTE: PLACEHOLDER data for development — replace with real partner agreements before launch.

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'partners_name_key') then
    alter table public.partners add constraint partners_name_key unique (name);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'deals_partner_title_key') then
    alter table public.deals add constraint deals_partner_title_key unique (partner_id, title);
  end if;
end $$;

-- One partner per Lifestyle category (type matches LifestylePage category ids).
insert into public.partners (name, type, contact_email) values
  ('Iron Campus Gym',              'gym',           'hello@ironcampus.example'),
  ('DriveReady School of Motoring','driving',       'bookings@driveready.example'),
  ('The Daily Grind Cafe',         'food',          'orders@dailygrind.example'),
  ('FreshFade Barbers',            'barber',        'book@freshfade.example'),
  ('MindSpace Wellbeing',          'mental-health', 'support@mindspace.example'),
  ('Student Essentials',           'other',         'help@studentessentials.example')
on conflict (name) do nothing;

-- Deals per partner. Mental-health deals are free (discount_percent null).
insert into public.deals (partner_id, title, description, discount_percent)
select p.id, d.title, d.description, d.discount_percent
from (values
  ('Iron Campus Gym',               'Student Membership',     '20% off monthly membership with a valid student ID',        20),
  ('Iron Campus Gym',               'Bring-a-Friend Pass',    'Two-for-one day passes every weekend',                      50),
  ('DriveReady School of Motoring', 'First Lessons Bundle',   '15% off your first block of 5 lessons',                     15),
  ('The Daily Grind Cafe',          'Coffee & Pastry Combo',  '25% off any coffee paired with a pastry',                   25),
  ('The Daily Grind Cafe',          'Lunch Menu Deal',        '10% off the full lunch menu, weekdays',                     10),
  ('FreshFade Barbers',             'Student Cut',            '25% off any cut with a student ID',                         25),
  ('MindSpace Wellbeing',           'Free Intro Session',     'A complimentary 45-minute wellbeing session — always free', null),
  ('MindSpace Wellbeing',           'Weekly Drop-in Support', 'Free peer support sessions, no booking needed',             null),
  ('Student Essentials',            'Back-to-College Bundle', '15% off the student stationery + supplies bundle',          15)
) as d(pname, title, description, discount_percent)
join public.partners p on p.name = d.pname
on conflict (partner_id, title) do nothing;
