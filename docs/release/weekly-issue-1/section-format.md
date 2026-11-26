# Ireland 2026: the standard section format

Issue 1 is "Ireland 2026 by UniBlueprint, Issue 001". Every section follows one template, so a reader always knows what comes next and an editor always knows what to write. The full 100 page plan, by section, is in the issue planner (its `SEC` array is the page map). The data shape is in `wrapped-schema.md`. The checker is `validate-issue.mjs`.

## The template

| Part | Page kind | How many | What it holds |
|---|---|---|---|
| Divider | `section` | 1 | Section name, one to three short sentences (up to 40 words). `gaeilge` only on Culture and on Getting Ahead, and only after a native speaker has checked it. |
| Stories | `story` | 3 to 6 | One story per page. Body 40 to 70 words, one source. |
| Merged story page | `month` with `items` | as needed | Up to 3 short stories stacked on one page. Each item has its own kicker, heading, body (35 to 75 words), source and sourceUrl. Used where the plan merges pages (for example "Croke Park summer"). Pictures are not drawn on stacked pages. |
| Top 10 | `top10` | 1 where one fits | Exactly 10 items. Title, blurb of 15 words or fewer, source and sourceUrl on every item. Say plainly that the order is UBP's pick, not an official ranking. |
| Recap | `recap` | 1 | The scoreboard that ends the section. 6 to 9 rows. |
| UBP promo | `ubp` | 1 after every second section | One app feature, labelled "From UBP". Generic example content only in screenshots. |

Months is the one exception. It has a timeline (`timeline`, 12 rows, one line a month) and six two month pages (`month` with two `items`). It has no divider and no recap, as in the planner.

## Word counts and limits

| Field | Limit |
|---|---|
| Story body | 40 to 70 words |
| Stacked month or merged item body | 35 to 75 words (the app cuts at 600 characters) |
| Heading | Aim for 8 words or fewer (the app cuts at 140 characters) |
| Kicker | A date or a short label, up to 60 characters. Dates read well: "5 September". |
| Divider body | Up to 40 words |
| Top 10 blurb | 15 words or fewer |
| Recap rows | 6 to 9 rows. Each text is 14 words or fewer. Date up to 24 characters ("5 Sep", "June"). |
| Timeline row | 12 words or fewer, 12 rows |
| Stat number | Up to 14 characters |
| UBP promo body | About 30 to 50 words |

## Recap page rules

- Kind `recap`, kicker "At a glance", heading "<Section> in 2026" (for example "Sport in 2026").
- `items` is `[{ "date": "5 Sep", "text": "Katie Taylor says goodbye at Croke Park" }]`.
- Rows are in date order, one fact each, and drawn only from facts already on that section's pages. Do not add a new fact to a recap. If a date is only on another page of the issue (for example the Months pages), use it only when it is the same fact and the same source.
- If an opened article gives only the month, write the month ("Feb", "May") and not a day.
- Add a `rowSources` list (one source URL per row, same order). The app ignores it, but the editor and the checker use it.
- Add your memory: every recap ends with an "Add your memory" button. It opens the Take composer (Home stack `Composer`, `initialTab: 'thread'`) with the page heading and the tag "Ireland Wrapped 2026" already in the text, the same way Give your take works. The button is drawn by the app on every `recap` page, so it needs no field in the data. Status: the recap page in `app/src/components/wrapped/WrappedPages.jsx` has only the Share button today, so this button is an app change to build before the freeze.

## Source rules

- Every fact (score, date, number, name, ranking, quote) comes from a page the writer opened. Search snippets do not count. If it cannot be confirmed, it is dropped.
- A story has `source` (the outlet name) and `sourceUrl` (the opened page). A `month` item has both too. A Top 10 item has `source` and `sourceUrl` on each row. A list has `bulletSources`. Extra confirming pages go in `alsoSources`.
- Where two sources disagree, use the safer wording or drop the number.
- Scores are written as words ("one goal and twenty points to one goal and seventeen").
- Quotes are short phrases and attributed. Nobody is called dead unless a reputable outlet reports it, and tributes never carry a picture.
- Never rank, praise or name private individuals or minors. Nothing controversial, nothing defamatory.
- Pictures: only openly licensed (CC0, CC BY, CC BY SA, public domain), with `credit` and `licence` filled in from the file page. No agency, press or social media photos. No image is better than a doubtful one.
- UBP made content is labelled "From UBP" or "Posted by UBP".
- Today is the date of writing. Nothing after it is written as if it happened.

## Voice and the no dashes rule

Plain, short sentences. Warm, a little cheeky, proud of Ireland, never mocking anyone. Never use the word "Thread" in the app copy. A "Take" is a Take.

No dashes of any kind in reader facing text: no em dash, no en dash, and no hyphen used as a dash (no " - "). Reword with a comma or a full stop. Hyphens inside words are fine, but prefer rewording. Gold is only for money, so never pick a gold section colour.

## Checklist: add or swap a page

1. Pick the section and the page kind from the template above. Do not invent a new kind.
2. Write it in the page shape. Set `section` to the section key. Check the key is in `sections` (add `{ key, title, accent }` if the section is new, and the accent is not gold).
3. Open every source yourself. Put `source` and `sourceUrl` on the page (or on every item).
4. Check the word counts in the table above.
5. Read it aloud once. No dashes, no gushing, no "coming soon".
6. If it is a picture page, record the licence and credit, or leave `image` out.
7. Put the page in the right place in `pages`. Sections run in the order of the planner. Inside a section it is divider, stories, Top 10, recap.
8. If you changed a fact on a section's pages, change the matching recap row too (and its `rowSources`).
9. If you added, removed or moved a page before the Months pages, run `node docs/release/weekly-issue-1/validate-issue.mjs docs/release/weekly-issue-1/issue-1-locked.json --fix-timeline` so the timeline rows still jump to the right pages.
10. Run the checker without `--fix-timeline`. It must say "No problems found". It also prints pages per section against the plan.
11. Add a line to `parts/<name>-sources.md` with the facts, the URL and the date it was opened.
12. Save in the Weekly Blueprint editor ("Wrapped pages (JSON)") or in the JSON file, never both at once. The editor is the live copy once the seed has run.
13. Commit. Do not push without the founder's say so.
