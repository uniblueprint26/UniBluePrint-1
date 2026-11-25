# Ireland Wrapped: page data shape

Issue 1 of the Weekly Blueprint ("Ireland 2026 by UniBlueprint, Issue 001") is a one time look back of about 100 pages. The app draws these pages from data, with no database migration.

## Where it lives

The existing table `weekly_issue_content` has one jsonb row per page_key. Add a row with `page_key = 'wrapped'`. `get_current_weekly_issue()` already returns every row as `issue.content`, so the app reads `issue.content.wrapped`.

Edit it in the app: Founder Dashboard, Weekly Blueprint editor, open the issue, "Wrapped pages (JSON)". The editor checks the JSON when you tap Save and shows what is wrong. An empty box saves an empty object, which switches Wrapped off.

If `content.wrapped` is missing or has no valid pages, the magazine looks exactly as it does for a normal issue.

## Top level

```json
{
  "cover": { "title": "Ireland 2026", "byline": "by UniBlueprint" },
  "sections": [
    { "key": "sport", "title": "Sport", "accent": "#3F6FB5" }
  ],
  "pages": [ { "section": "sport", "kind": "story" } ]
}
```

- `cover` is optional. The cover title is `cover.title`, else the issue `theme`, else "Ireland 2026". The byline defaults to "by UniBlueprint". "Issue 001" comes from the issue number.
- `sections` lists each section: `key`, `title` (shown on the contents page), `accent` (a `#RRGGBB` colour). A missing accent gets a default. Do not use gold, it is only for money. Sections appear on the contents page in the order their first page appears.
- `pages` are shown in order, after the cover and contents page and before the standard pages.

## Fields on a page

Every page: `kind` (required), `section` (a key from `sections`), `kicker`, `heading`, `body`, `source`, `sourceUrl`, `image`.

`image` is optional: `{ "url": "https://...", "credit": "Name, Wikimedia Commons", "licence": "CC BY SA 4.0" }`. The credit and licence print under the picture. Only openly licensed images. With no image the page uses a colour block with an icon. Tributes never show a picture.

Limits: heading 140 characters, body 1200, kicker 60, stat 14, at most 200 pages. Recap text 150 characters, timeline text 110, finale title 70 and text 110. Longer text is cut. Unknown kinds, pages that are not objects, and pages missing what they need are skipped.

## Kinds

| kind | Uses | Notes |
|---|---|---|
| `section` | `heading`, `kicker`, `body`, `gaeilge` | Big divider in the section colour. `gaeilge` is the optional small Irish phrase. |
| `story` | `heading`, `body` (40 to 70 words), `image`, `source` | |
| `stat` | `stat`, `statLabel`, `heading`, `body`, `source` | `stat` is the huge number, up to 14 characters. Share button. |
| `list` | `heading`, `bullets` or `items` (strings) | |
| `quote` | `body` (the quote), `heading` (who said it), `source` | |
| `collage` | `items` up to 12 tiles | Each tile is a string or `{ "text", "label" }`. |
| `tribute` | `heading`, `body`, `kicker` | Quiet, muted colours, no picture. |
| `credits` | `heading`, `body`, `bullets` | Picture credits from every page are added automatically. |
| `top10` | `heading`, `items` | Each item `{ "rank", "title", "blurb", "source" }`. Give your take and Share buttons. |
| `month` | `kicker` (the month name), `heading`, `body`, `source`, `image` | Give your take and Share buttons. For two months on one page use `items` instead, see below. |
| `quiz` | `heading`, `items` | Each item `{ "question", "options" (2 to 4), "answerIndex", "note" }`. Tap an option to see right or wrong and the note. Share button. |
| `county` | `items` | Two per page. Each `{ "county", "line", "source" }`. |
| `awards` | `heading`, `body`, `categories` | Each category `{ "key", "title", "nominees": [ { "name", "why", "source" } ] }`. Every nominee has Give your take. Vote button shows only when a route named `AwardsVoting` exists. Share button. |
| `playlist` | `heading`, `items` | Each `{ "title", "artist", "url" }`. The play button opens the url. |
| `ubp` | `heading`, `body`, `screenshot`, `cta` | A "From UBP" feature page. `screenshot` is an https URL or a bundled picture name (see below), shown inside a phone frame. With no screenshot, or one that will not load, a clean illustration block shows instead. `image` (an object with `url`) still works as an older way to give the screenshot. `cta` is `{ "label", "route" }` or `{ "label", "url" }`; the button shows only if the route exists or a url is given. |
| `moment` | `heading`, `body`, `cta.label` | "Add your moment" opens the Take composer with the tag. |
| `recap` | `heading` ("Sport in 2026"), `kicker` ("At a glance"), `items` | Scoreboard page that ends a section. Each item `{ "date", "text" }`, 6 to 9 rows (up to 12 are drawn). Dates sit in a fixed left column in the section colour. Share button. |
| `timeline` | `heading`, `kicker`, `items` | The whole year on one page. Each item `{ "date" ("January"), "text" (max 12 words), "page" }`, up to 12 rows. `page` is optional: when it is a whole number the row is tappable and jumps to that page. |
| `finale` | `heading` ("Ireland 2026 at a glance"), `kicker`, `items` | A grid of up to 12 tiles. Each item `{ "section", "title", "text", "page" }`. `section` is the small label and also picks the tile colour when it matches a section `key` or `title`. `page` is optional: the tile jumps to that page. Share button. The UBP mark and "From UBP" sit at the foot. |
| `capsule` | `heading`, `body`, `cta.label` | The button opens the route `TimeCapsule`, and is hidden if that route does not exist. |

### Page numbers (`page`)

`page` is the number shown at the top of the magazine ("12 / 94"): the cover is page 1, the contents page is page 2, the first Wrapped page is page 3, and so on. It must be a whole number from 1 to 999. A missing, wrong or out of range number means the row or tile is simply not tappable (a number past the last page jumps to the last page). Check the numbers once the page order is final.

### Two months on one `month` page

Give `items` instead of `kicker` and `heading`: `"items": [ { "kicker": "January", "heading": "...", "body": "...", "source": "Outlet", "sourceUrl": "https://..." }, { "kicker": "February", ... } ]`. Up to three are drawn, stacked, each with its own source line (linked when `sourceUrl` is set) and its own Give your take button, and one Share button for the page. An item needs `kicker` and `heading`, otherwise it is dropped. A page with a `kicker` and `heading` and no `items` is the single month page it always was.

### `ubp` screenshot names

`screenshot` is either a URL starting `https://` or one of the names in `SCREENSHOT_ASSETS` in `app/src/lib/wrapped.js` (today `ubp-logo` and `app-icon`, pictures already in the app). Anything else is ignored and the illustration shows. Bundled pictures can only change with a new app build, so use https URLs for real app screenshots.

## Share and Give your take

- Give your take opens the existing Take composer (Home stack `Composer`, `initialTab: 'thread'`) with the page title and the tag "Ireland Wrapped 2026" already in the text. Nothing new is posted by the magazine itself.
- Share outside UBP on stat, top 10, month, recap, finale and quiz pages takes a picture of the page (with the UBP mark, "From UBP" and "Ireland Wrapped 2026, uniblueprint.ie" at the foot) and opens the phone share sheet with it, using `react-native-view-shot` (and `expo-sharing` on Android, which cannot attach a file through the built in share). If the native module is missing (an older development client, or web) or the capture fails, it falls back to the short text that ends "Ireland Wrapped 2026. From UBP, uniblueprint.ie", and if the sheet cannot open the text is copied. Other pages (awards) share text only.

## Standard pages are skipped when empty

The editorial pages (campus events, student spotlight, campus guide, team, money moves, coach board, UBP board and week ahead, blueprint feature, founders note) only appear when the issue has content for them. The contents page lists only the pages that exist.

## Development sample

`app/src/dev/wrappedFixture.json` has sample pages covering every kind. Run the app in development with `EXPO_PUBLIC_WRAPPED_FIXTURE=1` to load it. It is only read under `__DEV__`.

## Example

```json
{
  "sections": [{ "key": "months", "title": "Month by month", "accent": "#C96A42" }],
  "pages": [
    { "section": "months", "kind": "section", "heading": "Month by month", "gaeilge": "A short Irish phrase, checked by a native speaker" },
    { "section": "months", "kind": "month", "kicker": "January", "heading": "Short headline", "body": "Two or three plain sentences.", "source": "Outlet name" }
  ]
}
```
