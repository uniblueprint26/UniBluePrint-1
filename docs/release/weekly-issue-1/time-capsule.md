# Note to your 2027 self (time capsule)

A member writes one private note (1 to 1000 characters). It is sealed until 1 January 2027 at 09:00 Irish time, then opens. Part of the Ireland 2026 Wrapped issue.

## Where it lives
- Screen: `app/src/screens/explore/TimeCapsuleScreen.jsx`, route `TimeCapsule` (Home stack, deep link `time-capsule`).
- Entry: a row "Note to your 2027 self" in the Milestones bundle of Explore (`app/src/constants/exploreCatalog.js`).
- Migration: `supabase/migrations/20261124100000_time_capsule_notes.sql` (not applied; the founder applies it).

## Data flow
1. Screen calls `my_time_capsule()`. It returns one row: `has_note, created_at, open_at, body, is_open, can_save, server_now`. `body` is null until `now() >= open_at`, decided on the server.
2. No note and `can_save`: the write form. The app runs `checkText` (moderation.js), then calls `save_time_capsule(p_body)`.
3. `save_time_capsule` needs a signed in member, trims the text, checks 1 to 1000 characters, refuses once the open moment has passed, runs `feed_text_is_clean` (same guard as feed posts, error `feed_text_guard: community guidelines`), then upserts the member's single row. `open_at` is set here from the flag, never by the client. A member can replace their note before it opens, but cannot read the old one.
4. Note saved and locked: sealed card with a countdown (follows `server_now`, not the phone clock) and a phone reminder.
5. Open: the note is shown and "Share a Take" opens the existing Composer with `initialTab: 'thread'` and the first 280 characters pre filled (a Take holds 280). The member edits and posts, or leaves.
6. No note and capsule closed: "The capsule has closed".

## Security
Table `time_capsule_notes` has RLS on, no policies and all grants revoked from `public, anon, authenticated`. Only the two SECURITY DEFINER RPCs (`search_path = ''`, execute granted to `authenticated` only) touch it. One note per member (`unique (user_id)`), deleted with the account (`on delete cascade`). It is private, so there is no report or block.

## Flags
- `app_flags.capsule_open_at` (JSON string, default `"2027-01-01T09:00:00Z"`, which is 09:00 Irish time because Ireland is on GMT in winter). Seeded by the migration. If missing or invalid the default applies. A note keeps the `open_at` it was saved with, so changing the flag later moves only notes saved afterwards. To open the capsule early for everyone, update the flag and re-save, or update `time_capsule_notes.open_at` in the dashboard.
- No new client flag. The row is in Explore without a switch, because it is not "coming soon" and needs no purchase.

## Local reminder
`expo-notifications` is a dependency and `app/src/lib/explore/localReminders.js` already schedules on-phone reminders (used by Goal countdown). The screen calls `scheduleReminders('time-capsule-', ...)` for the open moment whenever it loads a sealed note, and cancels it once the note is open. Limits:
- It is scheduled on that phone only. A reinstall or a new phone loses it until the member opens the screen again.
- If notifications are off, or on the web, the screen says so honestly and that the note still opens on 1 January.
- A tap on the reminder opens the app, not the screen (local reminders carry no deep link data).

## Founder to do
1. Apply the migration.
2. Check the `capsule_open_at` row in `app_flags`.
3. Decide on a push or email on 1 January for members who reinstalled (not built).
