# Launch day: publish issue 1 and retire the preview

Issue 1 ("Ireland 2026 by UniBlueprint, Issue 001") goes live on 26 December 2026. Until then a temporary Preview edition is what members see.

## How the app chooses the issue

`get_current_weekly_issue()` returns the published issue with the latest `week_of`. Nothing else decides it. I read the live function on 25 November and it matches `20260829160000_weekly_blueprint.sql`. The live database had no issues at that time.

| Issue | issue_number | week_of | published |
|---|---|---|---|
| Ireland 2026 Preview | 0 | 2026-11-23 | true (shows now) |
| Ireland 2026 | 1 | 2026-12-21 | false (locked) |

So the preview shows now. The moment issue 1 is set to published, its later `week_of` wins and it takes over. Setting the preview to unpublished is tidy up, not a requirement.

Two things can break this, so check them first:
- Any other issue published with a `week_of` after 2026-11-23 will beat the preview. Any other issue published with a `week_of` after 2026-12-21 will beat issue 1.
- The seed files never change `published` on a second run, so re-running them cannot bring the preview back after you retire it.

## Before launch day (any time from 14 December)

1. Check the state. In the Supabase SQL editor:

```sql
select issue_number, week_of, theme, published,
       (select jsonb_array_length(c.content -> 'pages')
        from public.weekly_issue_content c
        where c.issue_id = wi.id and c.page_key = 'wrapped') as pages
from public.weekly_issues wi
order by week_of desc;
```

You should see issue 1 unpublished and issue 0 published.

2. Finish the pages in the Founder Dashboard, Weekly Blueprint editor, issue 1, "Wrapped pages (JSON)". Tap Save, the editor checks the JSON and tells you what is wrong. Refresh the December page on the Months pages first: it was written on 23 November and says "is already in the diary", and 1 to 5 December and 9 December will be past by 26 December.
3. Run the checker on the file, and on a copy of what is in the editor:

```
node docs/release/weekly-issue-1/validate-issue.mjs docs/release/weekly-issue-1/issue-1-locked.json
```

4. Add the awards page. It is not in the seed. Open `docs/release/weekly-issue-1/launch-day-add-awards.sql`, check the nominees, run it in the SQL editor. It is safe to run twice. Make sure the voting window flags are set, as in `awards-voting.md`:

```sql
select key, value from public.app_flags where key like 'awards_%' or key = 'capsule_open_at';
```

5. Look at issue 1 as a founder. Issue 1 is unpublished, so the normal Weekly Blueprint screen will not show it. Use the editor to read the pages. Do not publish it early as a test: publishing sends the notification to every member.

## The switch (26 December)

Run this in the Supabase SQL editor. It is one transaction, so members never see a gap.

```sql
begin;
  update public.weekly_issues set published = true  where issue_number = 1;
  update public.weekly_issues set published = false where issue_number = 0;
commit;
```

Publishing issue 1 sends every member the "The Weekly Blueprint is out" notification, with the body "Ireland 2026". That is wanted on launch day. If you want it silent, run the same block wrapped like this (switch the trigger off, run the block, switch it back on):

```sql
alter table public.weekly_issues disable trigger trg_notify_weekly_issue_published;
begin;
  update public.weekly_issues set published = true  where issue_number = 1;
  update public.weekly_issues set published = false where issue_number = 0;
commit;
alter table public.weekly_issues enable trigger trg_notify_weekly_issue_published;
```

## Check it

1. In SQL:

```sql
select issue_number, week_of, theme, jsonb_array_length(content -> 'wrapped' -> 'pages') as pages
from public.get_current_weekly_issue();
```

It must return one row, issue_number 1, theme "Ireland 2026", and the page count you expect.

2. In the app: open the Weekly Blueprint. Pull to refresh (the app can cache for a few minutes). You should see:
   - The cover "Ireland 2026, by UniBlueprint, ISSUE 001" and the snippet tiles.
   - The contents page with every section.
   - On the Months timeline, tap a row. It must jump to the matching two month page.
   - A Top 10 page, a recap page and a stacked page (Croke Park summer). Give your take opens a Take with the tag "Ireland Wrapped 2026".
   - The UBP Awards section and, from 26 December, the Vote button (it only shows when voting is open).
   - No "Preview" wording anywhere.
3. Check light and dark mode on one story page and one recap page.

## If something is wrong, roll back

```sql
begin;
  update public.weekly_issues set published = false where issue_number = 1;
  update public.weekly_issues set published = true  where issue_number = 0;
commit;
```

Members go straight back to the preview. Fix the pages in the editor and switch again. Each time an issue goes from unpublished to published the notification fires again. For the rollback and for any second switch, wrap the block in the disable trigger and enable trigger lines above to keep it quiet.

## Known app points to settle before the freeze

- The cover shows "ISSUE" plus the issue number padded to three digits, and a zero or missing number shows 001. So the Preview (issue_number 0) shows "ISSUE 001" on its cover, and the header strip of the Weekly Blueprint screen reads "ISSUE 0". The preview cover byline is "A preview by UniBlueprint". If that is not enough, the app can show "PREVIEW" when the issue number is 0.
- The recap page has no Add your memory button yet (see `section-format.md`).
