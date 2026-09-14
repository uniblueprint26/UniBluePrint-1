-- Seed the Spotlight carousel with a handful of real, genuinely good
-- current items so it's never empty out of the box — pulled from real
-- content already in the app (CAREER_SERVICES in FoundationScreen.jsx,
-- COACHES in ElevationScreen.jsx, PARTNERS in data/lifestylePartners.js,
-- and the CAMPUS_BOARDS/COURSE_BOARDS registries), not fabricated deals.
-- A founder/operations user can add more, reorder, or retire these via
-- their own writes to this table — see Task #13 notes for why there's no
-- dedicated admin screen yet.
insert into public.featured_content (content_type, ref_id, caption, priority)
values
  ('foundation_service', 'CV Optimisation',   'Start where every application starts',    0),
  ('coach',               '1',                 '500+ points, proven results',              1),
  ('lifestyle_partner',   'mpfitness',         'Founder''s pick this month',                2),
  ('campus_board',        'clubs',             'Find your people this term',                3),
  ('course_board',        'course-boards',     'Talk to your course, wherever you study',   4);
