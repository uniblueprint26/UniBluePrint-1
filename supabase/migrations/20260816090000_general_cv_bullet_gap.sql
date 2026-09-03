-- ═══════════════════════════════════════════════════════════════════════════
-- Deepen example_library: close the general cv_bullet gap
--
-- Continuing the audit that found the 'general' bucket had zero rows for
-- linkedin_headline/linkedin_about (previous migration). Checking every
-- category's 'general' coverage against its actual generator fetch limit
-- found the same defect, worse in impact: cv_bullet — the category
-- generate-cv itself fetches, arguably the highest-traffic single generator
-- in the product — had ZERO rows in 'general'.
--
-- fetchIndustryExamples('cv_bullet', industryCtx.industry, 3) is called
-- directly with whatever resolveIndustryContext resolved, and when nothing
-- resolves that value is literally the string 'general' (industryContext.ts's
-- GENERAL constant). A student with no stated industry and no course match
-- was therefore generating a CV with zero real bullet calibration — the
-- model was writing purely from the Harvard-formula instruction in the
-- system prompt with no example of what a good bullet in ANY field actually
-- looks like, which is exactly the gap real, sourced examples exist to
-- close in the first place.
--
-- 3 rows, matching the fetch limit exactly (the same standard applied to
-- the linkedin_headline/about fix). Platform-authored, transferable
-- regardless of field, same bar as the existing general cover_letter_opener
-- rows — concrete and measured, not vague filler.
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.example_library (category, industry, competency_tag, excerpt, why_it_works, source_name, source_url, provenance) values

('cv_bullet', 'general', 'process_improvement',
 'Rebuilt a college society''s event sign-up process after the existing paper-sheet system lost roughly a third of interested members between sign-up and attendance; switching to a digital form with an automatic reminder raised turnout across the next three events.',
 'A specific, measured process fix works as a CV bullet regardless of field, which is exactly what the general fallback needs to demonstrate real competence with no industry-specific credential to lean on.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'general', 'delivery_under_constraint',
 'Delivered a 6-person final-year capstone project on schedule after two team members withdrew with three weeks remaining, by rescoping the build around what could realistically still be finished rather than the original plan.',
 'A real delivery story under a genuine, named constraint (two members lost, fixed deadline) is legible to any reviewer regardless of industry, unlike a generic "worked well under pressure" claim.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored'),

('cv_bullet', 'general', 'initiative',
 'Identified that a recurring group-project bottleneck was inconsistent file-naming and version control rather than workload, and introduced a shared naming convention and single source folder that the group kept using for the remaining two modules.',
 'Diagnosing the actual cause of a recurring problem (versioning, not effort) rather than assuming the obvious explanation is transferable evidence of judgement in any field, which is exactly what a fully unresolved industry fallback most needs to carry.',
 'UniBlueprint — platform-authored exemplar', 'https://uniblueprint.ie/', 'platform_authored');
