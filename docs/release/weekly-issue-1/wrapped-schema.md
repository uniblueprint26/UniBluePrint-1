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

Limits: heading 140 characters, body 1200, kicker 60, stat 14, at most 200 pages. Longer text is cut. Unknown kinds, pages that are not objects, and pages missing what they need are skipped.

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
| `month` | `kicker` (the month name), `heading`, `body`, `source`, `image` | Give your take and Share buttons. |
| `quiz` | `heading`, `items` | Each item `{ "question", "options" (2 to 4), "answerIndex", "note" }`. Tap an option to see right or wrong and the note. Share button. |
| `county` | `items` | Two per page. Each `{ "county", "line", "source" }`. |
| `awards` | `heading`, `body`, `categories` | Each category `{ "key", "title", "nominees": [ { "name", "why", "source" } ] }`. Every nominee has Give your take. Vote button shows only when a route named `AwardsVoting` exists. Share button. |
| `playlist` | `heading`, `items` | Each `{ "title", "artist", "url" }`. The play button opens the url. |
| `ubp` | `heading`, `body`, `image`, `cta` | A "From UBP" feature page. `image` is the app screenshot (a phone outline shows until it is set). `cta` is `{ "label", "route" }` or `{ "label", "url" }`; the button shows only if the route exists or a url is given. |
| `moment` | `heading`, `body`, `cta.label` | "Add your moment" opens the Take composer with the tag. |
| `capsule` | `heading`, `body`, `cta.label` | The button opens the route `TimeCapsule`, and is hidden if that route does not exist. |

## Share and Give your take

- Give your take opens the existing Take composer (Home stack `Composer`, `initialTab: 'thread'`) with the page title and the tag "Ireland Wrapped 2026" already in the text. Nothing new is posted by the magazine itself.
- Share outside UBP opens the phone share sheet with short text that ends "Ireland Wrapped 2026. From UBP, uniblueprint.ie". `react-native-view-shot` is not installed, so the page is not shared as a picture. Adding it needs a native module, so it is left for after the release decision. On web the text is copied instead.

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
