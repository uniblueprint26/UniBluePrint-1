# Priority ticketing: founder notes

Priority tickets are now real. People buy on the website (Stripe Checkout). The app only shows events and links out. Tickets are for real world events, so linking out is fine for the app stores.

Nothing here has been applied or deployed. You do these steps.

## What was built

| Part | Where |
| --- | --- |
| Tables, security rules, capacity and webhook functions | `supabase/migrations/20261119120000_priority_ticketing.sql` |
| Creates the Stripe checkout | `supabase/functions/create-priority-checkout-session/index.ts` |
| Marks orders paid, makes tickets, cancels, refunds | `supabase/functions/stripe-webhook/index.ts` (extended) |
| Website pages | `/priority`, `/priority/<slug>`, `/priority/success`, `/priority/tickets` |
| App screens | Priorities list, event detail, My tickets (links to the website for the QR code) |

The old invented events and the demo checkout screen are gone from the app.

## Go live checklist

1. Apply the migration `20261119120000_priority_ticketing.sql`.
2. Deploy: `supabase functions deploy create-priority-checkout-session` and `supabase functions deploy stripe-webhook --no-verify-jwt`.
3. In the Stripe dashboard, open the existing webhook endpoint and add the event `charge.refunded` (see the next section).
4. Make sure the secrets below are set.
5. Add your first event (see "Add an event").
6. Run one real test purchase with a cheap tier, check the ticket appears in My tickets, then refund it in Stripe and check the ticket turns Cancelled.
7. Redeploy the website (new pages and the `qrcode.react` package).

## Stripe webhook events to enable

The endpoint is the existing one: `https://ozpeofkvnpikhopkgcxc.supabase.co/functions/v1/stripe-webhook`.

Priority needs these three. The first two were already on the list. The third is new.

- `checkout.session.completed` marks the order paid and creates one ticket per quantity.
- `checkout.session.expired` frees the held tickets when someone leaves checkout.
- `charge.refunded` marks the order refunded and cancels its unused tickets. Only a full refund does this. A partial refund changes nothing and writes a warning to the function logs.

## Environment variables

Both functions use the secrets you already have. Nothing new.

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` (webhook only)
- `SITE_URL` (optional, falls back to `https://uniblueprint.ie`). Success and cancel links go to `<SITE_URL>/priority/...`.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (Supabase sets these)

## Add an event

Who can do this: anyone with the `operations` or `outreach` role. Row level security blocks everyone else.

Dashboard steps:

1. Supabase dashboard, then Table Editor, then `priority_events`, then Insert row.
2. Fill the columns. Leave `status` as `draft` while you set up. Drafts are hidden from the public.
3. Open `priority_ticket_tiers`, add one row per ticket type, with `event_id` set to the new event's `id`.
4. Check the event on `/priority/<slug>` as staff. Then change `status` to `on_sale`. It appears on the website and the app straight away.
5. When all tickets are gone, set `status` to `sold_out`. After the night, set it to `ended`.

Notes:

- `price_cents` is in cents. 1200 means 12.00 euro. The smallest allowed is 50.
- `capacity` is the number of tickets for that tier. The database stops overselling.
- `sale_starts_at` and `sale_ends_at` are optional. Use them for early bird and later releases.
- `slug` is lowercase letters, numbers and hyphens. It becomes the web address. `success` and `tickets` are not allowed.
- All events are 18+. `age_min` cannot go below 18.

Example SQL. Every value is a placeholder. Replace all of it with the real event.

```sql
-- PLACEHOLDER VALUES. Replace every one before running.
with new_event as (
  insert into public.priority_events
    (slug, title, genre, city, venue, address, starts_at, doors_at, blurb, lineup, status)
  values (
    'REPLACE-with-event-slug',
    'REPLACE with event title',
    'house',                                   -- house, afrobeats or folk
    'REPLACE city',
    'REPLACE venue name',
    'REPLACE venue address',
    '2099-01-01 22:00:00+00',                  -- REPLACE start time (UTC)
    '2099-01-01 21:00:00+00',                  -- REPLACE doors time (UTC)
    'REPLACE short description',
    array['REPLACE act one', 'REPLACE act two'],
    'draft'
  )
  returning id
)
insert into public.priority_ticket_tiers (event_id, label, price_cents, capacity, sale_starts_at, sale_ends_at, sort)
select id, t.label, t.price_cents, t.capacity, null, null, t.sort
from new_event,
  (values
    ('REPLACE tier name one', 1200, 100, 0),   -- REPLACE price in cents and capacity
    ('REPLACE tier name two', 1500, 100, 1)
  ) as t(label, price_cents, capacity, sort);
```

Times are stored in UTC. Irish time is UTC in winter and UTC plus 1 in summer. The website shows Irish time.

## Checking a ticket at the door (before a scanning tool exists)

Every ticket has a 16 character code like `A1B2-C3D4-E5F6-7890`. The website My tickets page shows it with a QR code. The QR code holds only the code.

Door staff with the `operations` or `outreach` role can use the Supabase SQL editor (signed in as that user) or any scanner app that reads the QR as text:

```sql
-- Look a ticket up. Shows status (valid, used, void), event, tier and name.
select * from public.priority_check_ticket('A1B2-C3D4-E5F6-7890');

-- Let them in. Returns ok, already_used, void or not_found. It never admits the same ticket twice.
select public.priority_mark_ticket_used('A1B2-C3D4-E5F6-7890');
```

Rules for the door:

- Only let in a ticket that returns `ok`.
- `already_used` means someone already came in with it. `void` means it was refunded.
- Check the name against the guest's account name if you are worried about a screenshot being shared. Photo ID is a venue decision.
- Do not give door staff the service role key.

A proper scanning screen is the next job. These two functions are what it will call.

## Decisions only you can make

1. **Who gets the money.** Today the money lands in the UniBlueprint Stripe account. Either UBP collects and pays Priority out (simple, but UBP holds other people's money and Finance needs a payout process and records), or Stripe Connect pays Priority directly (cleaner, but Priority needs a Connect account and onboarding). The code is built for the first. The second needs a change to the checkout function.
2. **Booking fee.** There is no booking fee now. The price on the tier is the price charged. If you want a fee, decide the amount and whether it is added on top or inside the price. Stripe's own fee comes out of what UBP receives.
3. **Refund policy.** Our current Refund Policy covers subscriptions and Blueprint services, not event tickets. Decide: no refunds, refunds until a set time before the event, or refund if the event is cancelled. Under EU consumer rules, tickets for a dated leisure event can be exempt from the 14 day cancellation right, but Legal must confirm and say so in the policy. Refunds are made in the Stripe dashboard. A full refund cancels the ticket automatically. A partial refund does not, so avoid those or cancel the ticket by hand.
4. **VAT.** UniBlueprint Limited is not VAT registered. Selling tickets may count towards the registration threshold, and the right VAT treatment depends on who is the seller (UBP or Priority) and what is sold. Get this from your accountant before the first sale. It links to decision 1.
5. **Terms for Legal to approve.** The buy button links to the existing Terms and Refund Policy. Neither says anything about event tickets. Legal needs to approve wording for: who the seller is, age 18+ and entry refusal, ID on the door, ticket transfer and resale, event changes and cancellation, and refunds.
6. **Data protection for buyer names.** The ticket check shows the buyer's account name to door staff. Decide whether Priority gets buyer names, emails, or neither (a headcount only). If Priority is a separate controller, the Privacy Policy needs a line and a data sharing agreement. State how long order and ticket records are kept. If someone deletes their account the order stays for Finance with the user removed, and their tickets stay but have no owner.
7. **Age check gap.** Buyers must have a date of birth on their account and be 18 or over. Accounts created before the date of birth field existed have none. They are told to add it, but the website has no place to edit it yet. Decide whether to add one or ask them to use the app.
8. **Who can see orders.** Staff with `operations` or `outreach` can read all orders and tickets. Confirm that is right, or narrow it.

## Behaviour to know about

- Tickets are held for 35 minutes once someone starts checkout. If they do not pay, the tickets go back on sale. A person can hold at most 3 unpaid checkouts at once.
- Limit is 6 tickets per order. Nothing stops someone placing several orders.
- If a payment arrives after the hold expired, the order is still honoured because the money was taken. That can very rarely mean one extra ticket over capacity. Check the dashboard if a night is nearly full.
- The success page waits up to about a minute for the webhook to create tickets. If the webhook is not set up, no tickets appear. Test this first.
- The app has no QR library, so the QR code is on the website. If you want it in the app, add `react-native-qrcode-svg` (it uses `react-native-svg`, already installed).
