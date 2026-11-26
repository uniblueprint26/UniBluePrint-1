# Explore seed content

Note, 26 November 2026: for launch, use the migration `supabase/migrations/20261125200100_seed_explore_content.sql` instead of running `explore_content_seed.sql` by hand. It carries the same researched rows except the scholarships (no screen reads them) and the six "Example:" societies (the app draws its own examples). It is safe to run more than once. Do not run both. See `docs/release/seed-and-reviewer.md`.

Seed data for the `explore_content` table (kinds: scholarships, discounts, support, societies, volunteering, freshers).

## The table

Columns: `id`, `kind`, `title`, `subtitle`, `body`, `url`, `tags text[]`, `institution`, `sort int`, `source` ('ubp' or 'student'), `status` ('published', 'pending', 'rejected'), `created_by`, `created_at`.

## How to run

1. Apply the migration that creates `explore_content` first.
2. Run `supabase/seed/explore_content_seed.sql` once in the Supabase SQL editor, or with `psql -f`.
3. The file is wrapped in a `do $$ ... $$` block. It does nothing if any row with `source = 'ubp'` already exists. To reseed, delete the old 'ubp' rows first.

Every row is `source = 'ubp'` and `status = 'published'`. `sort` runs up in steps of 10 within each kind.

## Sources and date checked

All pages were checked in November 2026. Anything that could not be opened is marked. Re-verify before launch, because dates, prices and phone numbers change.

- https://www.susi.ie/how-to-apply/what-grants-are-available/ - scholarships - checked November 2026
- https://hea.ie/funding-governance-performance/funding/student-finance/student-assistance-fund/ - freshers, scholarships, support - checked November 2026
- https://hea.ie/policy/access/fund-for-students-with-disabilities/ - freshers, scholarships - checked November 2026
- https://hea.ie/funding-governance-performance/funding/student-finance/1916-bursary/ - freshers, scholarships - checked November 2026
- https://www.tcd.ie/trinityaccess/ - scholarships - checked November 2026
- https://www.dcu.ie/access - scholarships - checked November 2026
- https://www.dcu.ie/sportscholarships - scholarships - checked November 2026
- https://www.ul.ie/sportsscholarships - scholarships - checked November 2026
- https://www.tudublin.ie/study/undergraduate/scholarships/sports-scholarships/ - scholarships - checked November 2026
- https://www.ucd.ie/sport/scholarshipsinfokeydates/ucdsportscholarship - scholarships - checked November 2026 (page returned 403, details from a search summary of that page)
- https://www.maynoothuniversity.ie/study-maynooth/undergraduate-studies/scholarships/sport-scholarships - scholarships - checked November 2026 (page returned 403, details from a search summary of that page)
- https://erasmusirelandhe.ie/ - scholarships - checked November 2026
- https://hea.ie/skills-engagement/springboard/ - scholarships - checked November 2026
- https://cancer.ie/cancer-research/researchers-hub/apply-for-funding/summer-studentships - scholarships - checked November 2026
- https://www.allirelandscholarships.com/ - scholarships - checked November 2026
- https://www.thenaughtonfoundation.com/ - scholarships - checked November 2026
- https://www.svp.ie/what-we-do/education-grants.aspx - scholarships - checked November 2026
- https://www.uversity.org/the-scholarships/ - scholarships - checked November 2026
- https://creditunionplus.ie/student-apprentice-prize-draw/ - scholarships - checked November 2026
- https://www.nui.ie/what-we-do/nui-awards/inclusion-grants/the-nui-equal-educational-opportunities-scheme/ - scholarships - checked November 2026
- https://www.gov.ie/en/service/418e3f-back-to-education-allowance - freshers, scholarships - checked November 2026 (page returned 403, details from a search summary and the SUSI grants page)
- https://www.tcd.ie/academicregistry/exams/scholarship/faq/ - scholarships - checked November 2026
- https://www.ucc.ie/en/scholarships/all/alluccsch/ - scholarships - checked November 2026
- https://www.universityofgalway.ie/access/scholarshipsfunds/ - scholarships - checked November 2026
- https://hea.ie/funding-governance-performance/funding/student-finance/other-finance-bursaries-scholarships/ - scholarships - checked November 2026 (HEA list, used for NCBI, SIPTU, NISO and Irish Refugee Education Fund rows)
- https://www.dublinbus.ie/journey-information/college-transport-hub/save-with-public-transport - discounts - checked November 2026
- https://www.transportforireland.ie/fares/50-discount-for-young-adult-and-student-leap-card-holders-on-commercial-bus-operators/ - discounts, freshers - checked November 2026
- https://www.irishrail.ie/en-ie/rail-fares-and-tickets/students - discounts - checked November 2026
- https://www.luas.ie/student-tickets - discounts - checked November 2026
- https://www.myunidays.com/IE/en-IE - discounts, freshers - checked November 2026
- https://www.studentbeans.com/ie/how-it-works - discounts - checked November 2026
- https://www.isic.ie/ - discounts - checked November 2026
- https://www.spotify.com/ie/student/ - discounts - checked November 2026
- https://www.apple.com/ie/apple-music/ - discounts - checked November 2026
- https://ifi.ie/visit/ticket-prices/ - discounts, freshers - checked November 2026
- https://personalbanking.bankofireland.com/bank/current-accounts/3rd-level-current-account/ - discounts, freshers - checked November 2026
- https://www.aib.ie/our-products/current-accounts/Student-Plus-AccTerms-Cons - discounts - checked November 2026 (page returned 403, details from a search summary of AIB documents)
- https://www.pieta.ie/ - support - checked November 2026
- https://www.samaritans.org/ireland/ - support - checked November 2026
- https://spunout.ie/services/text-about-it/ - support - checked November 2026 (page returned 403, details from a search summary of SpunOut pages)
- https://jigsaw.ie/ - support - checked November 2026
- https://www.aware.ie/ - support - checked November 2026
- https://www.turn2me.ie/ - support - checked November 2026
- https://mymind.org/counselling-for-students-1 - support - checked November 2026 (not opened, details from a search summary, page is dated 2018)
- https://www.childline.ie/ - support - checked November 2026
- https://www.hse.ie/mental-health/services-support/your-mental-health-information-line/ - freshers, support - checked November 2026
- https://www.womensaid.ie/ - support - checked November 2026
- https://www.drcc.ie/ - support - checked November 2026
- https://www.belongto.org/ - support - checked November 2026
- https://www.citizensinformationboard.ie/en/services/mabs/ - freshers, support - checked November 2026
- https://www.citizensinformationboard.ie/en/services/citizensinformation/cips.html - support - checked November 2026
- https://rtb.ie/students/ - freshers, support - checked November 2026
- https://threshold.ie/ - support - checked November 2026 (page text came back empty, details from a search summary)
- https://www.ulwolves.ie/societies - societies - checked November 2026
- https://socs.universityofgalway.ie/societies/ - societies - checked November 2026
- https://www.ucc.ie/en/societies/allsocieties/ - societies - checked November 2026
- https://mulife.ie/ - societies - checked November 2026
- https://trinitysocieties.ie/societies - societies - checked November 2026
- https://dcustudentlife.ie/ - societies - checked November 2026
- https://www.volunteer.ie/ - freshers, volunteering - checked November 2026
- https://www.svp.ie/get-involved/volunteer.aspx - volunteering - checked November 2026
- https://redcross.ie/?p=14724 - volunteering - checked November 2026 (page returned 403, details from a search summary of Irish Red Cross pages)
- https://habitatireland.ie/joinus/volunteerglobally/gv_termsandconditions - volunteering - checked November 2026 (not opened, details from search summaries)
- https://www.specialolympics.ie/ - volunteering - checked November 2026
- https://www.tidytowns.ie/ - volunteering - checked November 2026
- https://cleancoasts.org/ - volunteering - checked November 2026
- https://www.concern.net/volunteer/volunteer-in-ireland - volunteering - checked November 2026
- https://www.cao.ie/ - freshers - checked November 2026
- https://www.susi.ie/ - freshers - checked November 2026
- https://www2.hse.ie/services/find-a-gp/ - freshers - checked November 2026

## Not covered

Left out because they could not be verified: Gaeltacht and Irish language bursaries, bank and employer scholarships (AIB, Bank of Ireland, Intel), the Google scholarship, apprentice pay and allowance rules, mobile network student deals, Amazon Prime Student, Microsoft and Adobe education prices, and societies at UCD, TU Dublin and Atlantic TU. Add them once someone has opened the official page.
