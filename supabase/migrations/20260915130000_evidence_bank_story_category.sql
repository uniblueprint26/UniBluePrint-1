-- Evidence Bank: add a category to each story (Work / College / Leadership /
-- Project / Challenge / Achievement). The app's redesigned Evidence Bank
-- screen uses this to power category entry points ("start a Work story",
-- "start a Leadership story") and the category tag shown on each saved
-- story card. Existing stories (there are none in production yet — this
-- table shipped in 20260724120000 with the app's own evidence bank still in
-- an earlier form) default to 'work' so the column can be not-null from the
-- start rather than every reader having to handle a null category.

alter table public.evidence_bank_stories
  add column category text not null default 'work'
    check (category in ('work', 'college', 'leadership', 'project', 'challenge', 'achievement'));

-- Drop the default once existing rows are backfilled — new inserts always
-- supply a category explicitly (it's a required step in the add flow), the
-- default only exists to satisfy `not null` on this migration itself.
alter table public.evidence_bank_stories alter column category drop default;

create index if not exists evidence_bank_stories_category_idx
  on public.evidence_bank_stories (category);
