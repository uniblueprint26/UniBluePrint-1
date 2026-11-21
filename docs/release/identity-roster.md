# Identity roster

Locked list of every coach and partner identity, checked on 21 Nov 2026 against the app, the website and the live database (read only). Display names below are the exact strings in code.

Sources: app `app/src/screens/ElevationScreen.jsx`, `app/src/data/lifestylePartners.js`, `app/src/constants/exploreCatalog.js`, `app/src/constants/partnerBrands.js`, `app/assets/coaches`, `app/assets/partners`; website `src/data/coaches.js`, `src/pages/PartnersPage.jsx`, `public/coaches`; brand kit notes for Kobo and ScoutByRohi; database tables `coach_profiles`, `partners`, `lifestyle_partner_contact_details`.

Settled by the founder: the Finance coach is **Zainab Adeyemi (Soft Life Investing)**, one id (16) in app and website, category "Investing and Finance Coach". The Budgeting investment card opens her Elevation profile.

## 1. Elevation coaches

Source of truth: app `COACHES` in `app/src/screens/ElevationScreen.jsx` (ids tie to `coach_profiles.coach_slug = coach-<id>`). Website copy: `src/data/coaches.js`. Database: `coach_profiles` holds only test or empty rows (see section 5).

| App id | App display name | Business or via | Category (app) | Location (app) | App photo file | Website name, id, category | Website photo | DB row coach-id | Mismatch |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 500+ with Eman | 500+ with Eman | Academic Grinds | Dublin | app/assets/coaches/eman/hero.jpg | Emmanuel (via 500+ with Eman), id 1, Academic Grinds | public/coaches/eman.jpg | - | no coach_profiles row |
| 2 | JMC Fitness | JMC Fitness | Sports Coaching | North Dublin | app/assets/coaches/jmc-fitness/hero.jpg | Jack (via JMC Fitness), id 2, Sports Coaching | public/coaches/jmc.jpg | - | no coach_profiles row |
| 3 | Nathan Yanzo (Nyz3ditz) | Nyz3ditz | Photography & Video | Dublin | app/assets/coaches/nathan-yanzo/hero.jpg | Nathan Yanzo (via Nyz3ditz), id 3, Photography and Video | public/coaches/nathan.jpg | coach-3 | location "Ireland" vs "Dublin" |
| 16 | Zainab Adeyemi (Soft Life Investing) | Soft Life Investing | Investing and Finance Coach | Ireland | app/assets/coaches/zainab-adeyemi/hero.jpg | Zainab Adeyemi (via Soft Life Investing), id 16, Investing and Finance Coach | public/coaches/zainab.jpg | coach-16 | none |
| 17 | Camila Aruk | - | Personal Training · Muay Thai · Yoga | Dublin 8 | app/assets/coaches/camila-aruk/hero.jpg | Camila, id 14, Personal Training · Muay Thai · Yoga | public/coaches/camila.jpg | coach-17 | web id 14 vs app id 17 |
| 6 | Emanuel Tolic | - | Personal Training | Mayo | app/assets/coaches/emanuel-tolic/hero.jpg | Emanuel T., id 6, Personal Training | public/coaches/emanuelt.jpg | coach-6 | location "Ireland" vs "Mayo" |
| 7 | Tadgh Darcy | - | Physique Development | Dublin | app/assets/coaches/tadgh-darcy/hero.jpg (+4 gallery) | Tadgh, id 7, Physique Development | public/coaches/tadgh.jpg | coach-7 | none |
| 8 | Milan Piroska (MPFitness) | MPFitness | Personal Training | Kildare | app/assets/coaches/milan-piroska/hero.jpg (+7 gallery) | Milan (via MPFitness), id 8, Personal Training | public/coaches/milan.jpg | coach-8 | location "Ireland" vs "Kildare" |
| 9 | Kevin (TrainWitKev) | TrainWitKev | Personal Training | Dublin | app/assets/coaches/kevin-trainwitkev/hero.jpg | Kevin (via TrainwitKev), id 9, Personal Training | public/coaches/kevin.jpg | - | no coach_profiles row |
| 10 | Alex Leva | LEVA Impact | Digital Marketing | Co. Mayo | app/assets/coaches/alex-leva/hero.jpg | Alex (via Leva Impact), id 10, Digital Marketing | public/coaches/alex.jpg | - | no coach_profiles row |
| 12 | Jayden Reynolds | - | Health & Fitness Coaching | County Sligo | app/assets/coaches/jayden-reynolds/hero.jpg | Jayden, id 12, Health and Fitness | public/coaches/jayden.jpg | coach-12 | none |
| 13 | Aoife Keogh | The Brave Flow Yoga | Yoga | Dublin | app/assets/coaches/aoife-keogh/hero.jpg | Aoife (via The Brave Flow Yoga), id 15, Yoga | public/coaches/aoife.jpg | coach-13 | web id 15 vs app id 13 |
| 18 | Luana Ciweck | - | Online Fitness Coaching | Co. Mayo | app/assets/coaches/luana-ciweck/hero.jpg | Luana Ciweck, id 19, Online Fitness Coaching | public/coaches/luana.jpg | coach-18 | web id 19 vs app id 18 |
| (none) | not in app | via Course Compass | Course Compass | Ireland | NONE | Stephen (via Course Compass), id 13 | public/coaches/coursecompass.jpg | - | on website only (app removed Stephen McKeown) |

Notes: the website shows first names plus a via line (Jack via JMC Fitness, Emmanuel via 500+ with Eman), the app shows business or full names. Treated as a deliberate public privacy choice and left alone. Trading coaches (DG Trading coach-4, Dinero Trading Group coach-15) are gone from app and website code. Their database rows still exist until migration `20261120600000` is applied.

## 2. Lifestyle partners (app `app/src/data/lifestylePartners.js`)

Source of truth: app `PARTNERS` (ids equal `partners.partner_slug` and `lifestyle_partner_contact_details.partner_slug`). Website: `src/pages/PartnersPage.jsx` (live cards plus a coming soon list). "Live" = full card, "shell" = coming soon, name masked in app.

| id | Display name | Category | County | Status | Logo file | Hero or gallery | Website name | partners row | contact row | Mismatch |
|---|---|---|---|---|---|---|---|---|---|---|
| mpfitness | MPFitness | Personal Training | Kildare | live | - | - | MPFitness | yes | yes | no logo file |
| energie | Energie Fitness | Gym Membership | Dublin | live | app/assets/partners/energie/logo.jpg | - | Energie Fitness | - | - | no partners row |
| jmc | JMC Fitness | Sports Coaching | Dublin | live | - | - | JMC Fitness | - | - | no partners row; no logo file |
| nyz3ditz | Nyz3ditz | Photography & Video | Dublin | live | - | - | Nyz3ditz | yes | yes | no logo file |
| whipwizardz | Whip Wizardz | Automotive | Louth | live | app/assets/partners/whipwizardz/logo.png | - | Whip Wizardz | - | - | no partners row |
| nailnurse | The Nail Nurse | Nail Tech · Galway | Galway | live | - | - | The Nail Nurse | yes | yes | no logo file |
| leva | LEVA Impact | Digital Marketing & Design | Mayo | live | - | - | LEVA Impact | yes | yes | no logo file |
| henrysisters | Henry Sisters Co | Creative Content Creation | Mayo | live | - | - | Henry Sisters Co | yes | yes | no logo file |
| camila | Camila Aruk | Personal Training · Muay Thai · Yoga | Dublin | live | - | - | Camila Aruk | yes | yes | no logo file |
| saiemsent | Saiemsent | Clothing | - | live | app/assets/partners/saiemsent/logo.jpg | app/assets/partners/saiemsent/hero.jpg | Saiemsent | yes | yes | none |
| elect | Elect | Clothing Brand | Dublin | live | app/assets/partners/elect/logo.png | app/assets/partners/elect/hero.jpg + 3 gallery | Elect | yes | yes | none |
| eabakeditt | Eabakeditt | Home Baking · Dublin 15 | Dublin | live | - | - | Eabakeditt | yes | yes | no logo file |
| jordanskitchen | Jordan's Kitchen | Food & Drink | - | live | app/assets/partners/jordanskitchen/logo.png | - | - | yes | yes | not on website |
| ilashedbydiya | ilashedbydiya | Lash Tech · Dundalk | Louth | live | - | - | ilashedbydiya | yes | yes | no logo file |
| roomy | Roomy.ie | Housing Platform | - | live | app/assets/partners/roomy/logo.png | - | Roomy.ie | yes | yes | none |
| royaltyproductions | Royalty Productions | Photography · Dublin | Dublin | live | - | - | Royalty Productions | yes | yes | no logo file |
| veeslash | Vees Lash Studio | Lash Tech · Galway | Galway | live | - | - | Vees Lash Studio | yes | yes | no logo file |
| cutbyire | CutbyIre | Barber · Sligo | Sligo | live | - | - | CutbyIre | yes | yes | no logo file |
| poiemadexigns | Poiema Dexigns | Web Design & Branding | Dublin | live | - | - | Poiema Dexigns | yes | yes | no logo file |
| kelan | Made By Kelan | Photography & Video · Co. Mayo | Mayo | live | - | - | Made By Kelan | yes | yes | no logo file |
| claras | Clara's Beauty Room | Nail Tech · Mayo | Mayo | live | - | - | Clara's Beauty Room | yes | yes | no logo file |
| lashessteph | Lashes By Steph | Lash Tech · Kildare | Kildare | live | - | - | Lashes By Steph | yes | yes | no logo file |
| coded69studios | Coded69 Studios | Photography, Printing & Studio Rental · Tallaght | Dublin | live | - | - | Coded69 Studios | yes | yes | no logo file |
| zvisionapparel | Z Vision Apparel | Custom Embroidery & Clothing · Co. Mayo | Mayo | live | - | app/assets/partners/zvision/hero.jpg + 4 gallery | Z Vision Apparel | yes | yes | no logo file |
| pouvoirs | Pouvoirs Gallery | Fashion | Ireland | live | app/assets/partners/pouvoirs/logo-hero.jpg | app/assets/partners/pouvoirs/logo-hero.jpg + 6 gallery | Pouvoirs Gallery | - | - | no partners row |
| dylanpower | Dylan Power | Sports Photography | Cork | live | - | - | Dylan Power | - | - | no partners row; no logo file |
| secondnature | Second Nature | Fashion/Clothing | - | live | - | app/assets/partners/second_nature/hero.jpg | - | - | - | not on website; no partners row; no logo file |
| njoy | N-joy | Food & Drink | - | live | - | app/assets/partners/njoy/hero.jpg + 2 gallery | N-joy (soon) | - | - | live in app, coming soon on website; no partners row; no logo file |
| islandsips | Island Sips | Food & Drink | - | live | - | - | Island Sips (soon) | - | - | live in app, coming soon on website; no partners row; no logo file |
| styledbybene | StyledByBene | Services · Creative Director | - | live | - | - | - | - | - | not on website; no partners row; no logo file |
| mbcuts | Manni The Barber | Barber · Dundalk | Louth | shell | - | - | Manni The Barber (soon) | - | - | none |
| mmcutz | MM Cutz | Barber · Dublin | Dublin | shell | - | - | MM Cutz (soon) | - | - | none |
| cutbyalind | Cut by Alind | Barber · Mayo | Mayo | shell | - | - | Cut by Alind (soon) | - | - | none |
| lucy | Hair by Lucy Staunton Kelly | Hair | - | shell | - | - | Hair by Lucy Staunton Kelly (soon) | - | - | none |
| angelic | Angelic Touch | Hair | - | shell | - | - | Angelic Touch (soon) | - | - | none |
| ocean1 | Ocean1 | Clothing | - | shell | - | - | Ocean1 (soon) | - | - | none |
| archangel | Archangel | Clothing Brand | Kildare | shell | - | - | Archangel (soon) | - | - | none |
| fortesce | Fortesce | Clothing | - | shell | - | - | Fortesce (soon) | - | - | none |
| streetclth | Street Clothing | Clothing | - | shell | - | - | Street Clothing (soon) | - | - | none |
| timing | Timing | Clothing | - | shell | - | - | Timing (soon) | - | - | none |
| lume | Lume | Food & Drink | - | shell | - | - | Lume (soon) | - | - | none |
| tuckin | Tuck Inn | Food & Drink | - | shell | - | - | Tuck Inn (soon) | - | - | none |
| coffeespot | The Coffee Spot | Food & Drink | - | shell | - | - | The Coffee Spot (soon) | - | - | none |
| joyoffoods | JoyofFoods | Food & Drink | - | shell | - | - | JoyofFoods (soon) | - | - | none |
| droghedafoodie | The Drogheda Foodie | Food & Drink | Louth | shell | - | - | The Drogheda Foodie (soon) | - | - | none |
| hardluck | Hardluck Club | Food & Drink | Louth | shell | - | - | Hardluck Club (soon) | - | - | none |
| purplebrunch | Purple Brunch | Food & Drink | Sligo | shell | - | - | Purple Brunch (soon) | - | - | none |
| chloehouse | Chloe May House | Lash Tech | - | shell | - | - | Chloe May House (soon) | - | - | none |
| lashlux | Lash Lux Dublin | Lash Tech | Dublin | shell | - | - | Lash Lux Dublin (soon) | - | - | none |
| dolledm | Dolled by M | Nail Tech | - | shell | - | - | Dolled by M (soon) | - | - | none |
| eveburac | Eve Burac | Nail Tech | - | shell | - | - | Eve Burac (soon) | - | - | none |
| erinburke | Erin Burke Makeup | Makeup | - | shell | - | - | Erin Burke Makeup (soon) | - | - | none |
| nicole | Nicole | Makeup | - | shell | - | - | Nicole (soon) | - | - | none |
| wzorek | Wzorek | Makeup | - | shell | - | - | Wzorek (soon) | - | - | none |
| carolynes | Carolynes Beauty Studio | Beauty Studio | Clare | shell | - | - | Carolynes Beauty Studio (soon) | - | - | none |
| kasia | Makeup By Kasia | Makeup | Galway | shell | - | - | Makeup By Kasia (soon) | - | - | none |
| pkglam | The PK Glam | Beauty | Kildare | shell | - | - | The PK Glam (soon) | - | - | none |

## 3. Explore partners (app `app/src/constants/exploreCatalog.js`)

| Order | Display name | What it is | Logo or mark file | Brand source | Notes |
|---|---|---|---|---|---|
| 1 | Course Compass | Course and career tools, opens Compass | drawn mark (no file) | `COURSE_COMPASS` in `partnerBrands.js` | Website lists "Stephen via Course Compass" as a coach, the app does not |
| 2 | Priority | Student events and nights out | drawn mark (no file) | `priorityTheme.js` | No brand kit file in the repo |
| 3 | Kobo | Waitlist only, not a bank, test money only | `app/assets/partners/kobo/icon-light.png` (also `icon.png`, `logo-light.png`) | `KOBO`, brand kit | Never shown as a live money service |
| 4 | ScoutByRohi | Internships and graduate schemes | `app/assets/partners/scout/logo.png` | `SCOUT`, brand kit | Name is one word, capital B and R |
| 5 | Roomy.ie | Rooms and homes | `app/assets/partners/roomy/logo.png` | `ROOMY` | Also a Lifestyle listing (id roomy) |
| 6 to 9 | Saiemsent, Elect, Jordan's Kitchen, Pouvoirs Gallery | Lifestyle partners with a logo file | see section 2 | `LIFESTYLE_STRIP_IDS` | Names match section 2 exactly |

Database: Kobo, ScoutByRohi, Course Compass and Priority have no `partners` rows. Roomy and the four Lifestyle ones above do, except Pouvoirs Gallery.

## 4. Mismatches fixed in code (unambiguous)

- Zainab Adeyemi: website id 18 changed to 16 to match the app and the database slug `coach-16`. Category "Investing & Finance Coach" changed to "Investing and Finance Coach" in both.
- Website coach filters now match the app's four categories plus Career. Jack, Nathan and Aoife moved to Fitness, Marketing and Fitness. The Sports, Creative and Yoga pills were removed.
- App: 11 coaches had no photo reference and showed an empty avatar. Their website images were copied to `app/assets/coaches/<name>/hero.jpg` and wired as `heroImage`. Five are real portraits (Emanuel Tolic, Jayden, Camila, Luana, Zainab). Six are logos or promo cards the coach supplied (Eman, JMC Fitness, Nathan, Kevin, Alex, Aoife).
- App Lifestyle: Energie Fitness and Whip Wizardz logos (already on the website) and the Roomy.ie logo (already in assets) are now referenced.
- Elevation card: swiping pictures above the coach name (hero, then gallery, dots when more than one) and a Services list taken from each coach's own data. Nothing invented.

## 5. Database findings (read only)

- `coach_profiles`: 16 rows. `coach-12, 13, 15, 16, 17, 18, 3, 4, 6, 7, 8` are empty shells (null specialisation, no photo, not verified). `coach-901, 902, 903, 999` and `ubp-screenshot-tester` are test rows. No row for coach-1, 2, 9 or 10. `coach-4` and `coach-15` are the removed trading coaches and stay until migration `20261120600000` is applied. No `photo_url` is set on any row.
- `partners`: 20 real slugs match app ids. 7 are test or placeholder rows (Example Business 1 to 3, Placeholder Partner x2, Sample Fitness Co., UniBlueprint Example Business) and 6 legacy rows without a slug (DriveReady School of Motoring, Student Essentials, Iron Campus Gym, MindSpace Wellbeing, FreshFade Barbers, The Daily Grind Cafe). No `logo_url` is set on any row.
- App live ids with no `partners` row: energie, jmc, whipwizardz, pouvoirs, dylanpower, secondnature, njoy, islandsips, styledbybene. All 29 shells also have no row.
- `lifestyle_partner_contact_details`: the same 20 real slugs plus 4 example slugs. Contact values were not read.
- Trading check: no DG Trading or Dinero in app or website source. Only old migration files mention them, plus the removal migration.

## 6. Left for the founder (ambiguous)

1. Public names: the website shows first names plus a via line (Jack via JMC Fitness, Emmanuel via 500+ with Eman, Emanuel T.), the app shows business or full names (JMC Fitness, 500+ with Eman, Emanuel Tolic). Keep as is, or make both full names?
2. Locations: the website says "Ireland" for Nathan, Emanuel T. and Milan, the app says Dublin, Mayo and Kildare. Which should be public?
3. Course Compass coach: the website still lists "Stephen via Course Compass" (id 13, category Career). The app removed Stephen McKeown. Keep on the website?
4. Website id clashes remain for Camila (web 14, app 17), Aoife (web 15, app 13), Luana (web 19, app 18) and Stephen (web 13 clashes with the app's Aoife). Website ids are used only in its own coach URLs, so renumbering could break shared links. Renumber now?
5. The website has no listing for Jordan's Kitchen, Second Nature or StyledByBene, and shows N-joy and Island Sips as coming soon while the app has them live.
6. Logo files are missing for most Lifestyle partners (marked "no logo file" above). Founder to supply or approve.
7. Images for Eman, JMC Fitness, Nathan, Kevin, Alex and Aoife are logos or promo cards, not portraits. Supply portraits if wanted.
8. Website `PartnersPage.jsx` still hardcodes some partner email and phone values in source (the app already moved these to the contact table). Move them?
9. Delete the test and placeholder rows in `coach_profiles` and `partners` before launch, and apply the trading removal migration.
