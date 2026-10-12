# UniBlueprint — Subscription, Pricing & Handler Model

**Confidential — internal reference.** Supersedes any prior assumptions about what Pro unlocks (task #56/D2 in the engineering task tracker). The September 2026 trial-month section below is historical/out of date — ignore it for any future implementation work. Last updated 12 Oct 2026 from the founder's canonical pricing doc.

## Note — coach/partner commission split

The Stripe Connect split referenced in the old task #40 is superseded by the full Partner Tiering Framework (Access/Plus/Signature, Option A/B) — see `docs/business/partner-tiering-framework.md`. That framework covers both Elevation coaches and Lifestyle Blueprint business partners under one system.

## 1.8 iOS payment approach (task #56/D1) — decided 12 Oct 2026

Foundation and Elevation are treated differently, based on how strong the "real-world service" exemption argument actually is for each:
- **Foundation Blueprint** (AI-generated, human Handler reviews + delivers — not human-authored from scratch): hidden on iOS entirely, web-only checkout, same pattern already used for the Pro subscription on `PricingScreen.jsx`.
- **Elevation** (coaching — a genuine human-to-human service happening outside the app): external link checkout, relying on Apple's real-world-service exemption. Still worth a real compliance check before shipping, not just taken on say-so.

---

## 1.1 Free tier — permanent and always free

The free tier is not a limited version of UniBlueprint. It is a genuine, usable product that delivers real value. The tagline is the structure behind your success — and that structure must be accessible to every young person in Ireland regardless of whether they subscribe. Foundation Blueprint at Standard pricing is the core product and it is free to access for everyone.

- Full Foundation Blueprint — all services at Standard pricing
- Premium tier available to all users — free and Pro — at the relevant price for their tier
- Mental Health & Wellbeing — Lifestyle Blueprint mental health bookings always free, always accessible, never behind any paywall
- Campus Connect — all eight features
- Course Connect — all six features
- Budgeting Tool — all three modes
- Opportunity Alerts
- Browse Lifestyle Blueprint — see all deals, all categories, all partners. Can only claim Mental Health deals without Pro.
- Advertisement Board — see §1.6 below (per-ad pricing, supersedes the flat-fee description in §1.4's table)
- Output wallet storage — 6 months
- Support — 24 hour response during operating hours

**Mental Health — always free. No exceptions. No paywall. Ever.** Mental health support is not a commercial decision. It is a values decision. Every user on UniBlueprint regardless of tier has full access to Mental Health & Wellbeing partner bookings and discount codes. Stated clearly on the Mental Health section of the Lifestyle Blueprint: "Mental health support is always free on UniBlueprint. No subscription required. Ever."

## 1.2 Pro Subscription — €6.99/month

Pro is designed for the student who uses UniBlueprint regularly and wants maximum value from the platform. At €6.99/month it pays for itself after one Premium service.

- Everything in the free tier
- Elevation Blueprint — full access to all six services
- Full Lifestyle Blueprint — all bookings and discount codes across all categories
- Priority queue on Foundation Blueprint — Pro submissions go above free tier Standard submissions. Free tier submissions cannot be pushed back more than 10 positions regardless of Pro volume.
- Discounted Premium pricing — Pro subscribers pay less for Premium tier services than free tier users
- Advertisement Board — included, see §1.6
- Permanent wallet storage — all outputs stored forever (free tier: 6 months)
- Priority support — 4 hour response during operating hours (free tier: 24 hour)
- Weekly Blueprint Report — personalised Monday summary

## 1.3 Annual Plan — €49.99/year

- Full monthly price: €6.99 × 12 = €83.88. Annual: €49.99 — saving over €33, equivalent to more than 4 months free.
- Marketing line: "Less than €1 a week. Your Blueprint for the whole year."
- Annual subscribers can switch to monthly at the renewal date — one tap from My Finances.
- Annual subscribers see a dedicated subscription management screen — never the monthly billing interface.
- 14 day cooling off period from sign-up date — full refund if no Pro features used.

## 1.4 Foundation Blueprint pricing table

Standard pricing is identical for everyone — free tier and Pro. Pro subscribers receive a discount on Premium pricing. Premium is available to all users regardless of subscription status.

| Service | Standard — Everyone | Premium — Free User | Premium — Pro User |
|---|---|---|---|
| CV Optimisation | €20 | €36 | €30 |
| LinkedIn Optimisation | €20 | €36 | €30 |
| Cover Letter Assistance | €20 | €36 | €30 |
| Application Form Assistance | From €20 | From €36 | From €30 |
| Interview Prep — pack | €20 | €36 | €30 |
| Interview Prep — pack + mock | €35 | €45 | €38 |
| Job Search Support | €15 | €26 | €22 |
| CAO Personal Statement | €20 | €36 | €30 |
| Course Selection Guidance | €15 | €26 | €22 |
| Scholarship & Grants Application | €20 | €36 | €30 |
| Pitch Coaching — written feedback | €25 | €42 | €35 |
| Pitch Coaching — live session | €35 | €42 | €36 |
| Mentorship Session | €20 | €36 | €30 |
| Personal Branding | €40 | €55 | €46 |
| Network Assistance | €30 | €46 | €38 |
| Portfolio Building | €30 | €46 | €38 |
| Postgrad Support | €30 | €52 | €42 |
| Mental Health & Wellbeing | Always Free | Always Free | Always Free |

## 1.5 September Trial Month — HISTORICAL, DO NOT IMPLEMENT

September 2026 was a nationwide free-trial month at 50% of Standard/Premium pricing. This section is kept for historical record only — explicitly superseded, not live, not to be built against.

## 1.6 Advertisement Board — pricing model changed 12 Oct 2026

**Supersedes §1.4's "Ad Board paid tier €4.99/month... Included in Pro" line.** New model, per-ad rather than flat monthly subscription:
- Everyone (free and Pro): **1 free listing per month**, same as the existing free-tier benefit.
- Free tier: **€4.99 per ad** from the 2nd ad that month onward.
- Pro tier: **€1.99 per ad** from the 2nd ad that month onward.

## 1.7 Marketplace "Providing Services" listings (students offering services to other students) — new, 12 Oct 2026

- Free tier: **€2.99 per listing**
- Pro tier: **€0.99 per listing** (not free — kept consistent with Ad Board's pattern of Pro paying a steeply discounted rate rather than nothing, to avoid incentivising spam listings).
