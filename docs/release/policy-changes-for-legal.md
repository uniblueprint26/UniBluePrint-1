# Terms and Privacy changes for Legal to confirm (27 November 2026)

Files: `src/pages/legal/TermsPage.jsx` and `src/pages/legal/PrivacyPage.jsx`. Nothing here is a final legal opinion. Legal should read each change and approve or reword before the site goes live and before the store forms are submitted.

## Terms of Service

| Section | Change | Why |
| --- | --- | --- |
| 3 Eligibility | Removed the line limiting the audience to third level and recent graduates. Now says students, apprentices and workers, no one group | Matches the product. Course Connect is nationwide and not tied to college |
| 5.5 (new) | Pro is free for every account until 31 January 2027. No payment details taken. We tell people before it ends | Matches the live flag `pro_free_until` |
| 5.6 (new) | Paid plans and services are bought on uniblueprint.ie. The iOS and Android apps do not sell anything. Some services open on a later date | Matches native with no prices. Legal to confirm the wording is acceptable to Apple and Google |
| 8 intro | Campus Connect is your own community (campus, trade or industry). Course Connect is open to everyone across Ireland | Old text said "your institution or your course" |
| 8.4 (new) | Short rules for Live, UBP Awards, Time capsule, Split the bill, Calendar, Listings and boards, Weekly Blueprint | These features were not covered. Awards wording needs Legal's eye: free to vote, one vote per category, we may remove fake votes, our decision on results is final |
| 12 | Added Expo, Sentry and Mailchimp to the third party list. Added a paragraph that partners and coaches are independent and set their own offers | Matches Privacy section 5 and the Lifestyle and Elevation screens |

## Privacy Policy

| Section | Change | Why |
| --- | --- | --- |
| 2 Data we collect | Community data now includes listings, boards, questions and answers. New "Safety data" line: reports and blocks | Moderation records exist in `content_reports` and block tables |
| 3 How we use data | New line: review reports and enforce the Community Standards | Same |
| 6 Transfers | Names Stripe, Google, Expo, Sentry and Mailchimp as providers that may process data outside the EEA, under Standard Contractual Clauses | Matches the providers listed in section 5 |

Already in the policy from the earlier update (no change needed): calendar, camera and Live, award votes, time capsule notes, Split the bill entries, push token, date of birth, location.

## Still for Legal to decide

1. **Retention for reports and blocks.** The retention table has no row for them. Legal to choose a period.
2. **Supabase region.** Section 5 says data is stored within the EU. Confirm the project region before submission.
3. **Awards rules.** If prizes or promotion are ever added, a separate promotion terms page will be needed.
4. **Placement policies and agreement** are not changed here.
5. After approval, change the "Last updated" line on both pages and align the store privacy answers.
