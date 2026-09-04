-- Track outbound clicks from the website to Course Compass, so Desmond has
-- real numbers to negotiate a payment arrangement with them (per click vs.
-- per signup/conversion isn't decided yet, this just logs the click itself).
-- Referral-parameter attribution (a tracking ID appended to the outbound
-- URL for Course Compass's own system to read) is deliberately NOT built
-- here, that depends on terms that aren't set yet. Revisit once Desmond has
-- an actual referral ID/format from Course Compass.
--
-- Most website visitors clicking this link are anonymous (not signed in),
-- so activity_events.user_id needs to allow null for this one event type,
-- narrowly, rather than opening anonymous insert to every event type.

alter table public.activity_events alter column user_id drop not null;

create policy "anon_insert_course_compass_click"
  on public.activity_events for insert
  to anon, authenticated
  with check (type = 'course_compass_click' and user_id is null);
