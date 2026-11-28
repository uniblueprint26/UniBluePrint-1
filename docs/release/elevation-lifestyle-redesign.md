# Elevation and Lifestyle redesign

Built from the approved illustration. Everything below is in `app/` (Expo SDK 58, works in Expo Go and on web).

## What changed

**Lifestyle** is now a deal wallet.
- A vertical stack of overlapping bank card shaped cards (width to height 1.586, corners 5 percent of the width, never taller). Each card shows its top strip: logo tile with ring, name with the verified tick, the "UBP Discount" pill below the name, and the slogan.
- Brand led look: the partner's own colour, a bigger logo in a rounded tile, a faint tiled logo (or initials) pattern, one large faint watermark, a UBP chip mark and a contactless wave, and a soft sheen. Blend modes are multiply on light and mid cards, invert plus screen on dark cards, so white logo backgrounds never show as boxes.
- Order is shuffled every time the screen opens. Hearted cards are pinned first in a Favourites group.
- Header: category chips and a search box (by partner name). The Map button, "Near me" chip, the "Find partners near you. The map is coming soon." card and the 27 greyed "Coming soon" cards only show when the remote flag `coming_soon_tiles` is on. PartnerMap is untouched and unused.
- Tap a card to open it. It rises to the top and settles, the details slide in underneath. Drag it down to peel it back with a spring. With reduced motion it fades instead.
- Open card: photo swipe strip with dots (when the partner has a hero or gallery), optional blocks (`claim`, `where`, `links`, `showAtTill`, default `links` only), and View profile.
- Back of the card (flip): how to claim, QR code of the member code, optional "Today's special". Under the card: Get directions, Send to a friend, Report a problem, I used this deal. There is no Add to Apple Wallet.
- Member code: 8 digits, shown `UBP 4821 0007`, worked out on the device by hashing the user id and partner id. First open: a scratch panel (about 60 percent cleared reveals it). After that it is masked, `UBP •••• 0007`, and press and hold reveals it with a slow haptic build and a tick.
- Deals used: "I used this deal" counts a use per partner. After 3 uses a "Regular" chip shows on the card and the profile. Profile has a private "Deals used" total.
- Easter eggs (cosmetic, no prizes, one subtle hint each, shown once): scratch or hold, tilt for the hidden slogan, double tap the logo for confetti, shake to flip, tap the wave, peel by dragging down. The Profile has a private "Secrets found 3 of 6" row with badges.
- Partner Spotlight strip: built (`PartnerSpotlightStrip`, `hooks/usePartnerUpdates.js`, `data/partnerUpdates.js`). It renders nothing while there are no updates, which is today.
- Partner profile (`screens/PartnerProfileScreen.jsx`, route `PartnerProfile`): banner in the brand colour, logo avatar, name and tick, `@handle` only if the contact hook returns one, category and county, bio, Follow (only with flag `partner_follow_enabled`), Get in touch, the deal card (tap to open it in the wallet), services, opening hours, photo gallery. A menu or price list renders on web only.

**Elevation**
- Featured coach hero cards: swipe sideways, snap, neighbours peek, dots. Tall portrait (about 3 to 4.1). Milan Piroska first, others shuffled each visit. Photo, name in the display font with the tick, tagline (speciality if none). First card button "Meet Milan", others "View profile". Placed lower with room under the title.
- A small category filter row sits above the cards and filters the carousel. The old two column grid is gone because every coach is in the carousel.
- Coach profile (`screens/CoachProfileScreen.jsx`) uses the shared BrandProfile: 112 px banner, 78 px round photo, name and tick, speciality and location, service chips, tagline (no divider bar), bio, quote, extra sections, what is included, gallery grid, Book a session, Get in touch, Share. No prices on native. Native Book a session still opens the website through `NATIVE_BOOKING_LINK`, for in person coaches only (unchanged rule).

**Home Spotlight**: partner slides show the same brand card, coach slides show the same hero card with the tick. Native no longer shows a partner deal price there.

**Shared**: `components/ui/VerifiedTick.jsx` (light blue #4FC3F7, tap says "Verified by UBP", `NameWithTick` keeps the tick on the last word), `components/profile/BrandProfile.jsx`.

## Files

New: `data/partnerCards.js`, `data/partnerUpdates.js`, `components/lifestyle/wallet/*` (BankCard, CardBack, OpenCard, CodeArea, ScratchPanel, QrCode, Confetti, PartnerWallet, PartnerLinks, useCardMotion, haptics), `components/profile/BrandProfile.jsx`, `components/profile/WalletStats.jsx`, `components/ui/VerifiedTick.jsx`, `components/elevation/FeaturedCoaches.jsx`, `screens/PartnerProfileScreen.jsx`, `lib/walletStore.js`, `lib/memberCode.js`, `lib/plainCopy.js`, `lib/coachDisplay.js`, `hooks/useBrandFollow.js`, `hooks/usePartnerUpdates.js`, `hooks/useReducedMotion.js`, `constants/pillarTints.js`, `dev/CardGallery.jsx`.
Changed: `screens/LifestyleScreen.jsx`, `ElevationScreen.jsx`, `CoachProfileScreen.jsx`, `ProfileScreen.jsx`, `data/lifestylePartners.js` (verified, JMC logo), `lib/featuredContent.js`, `components/home/SpotlightCarousel.jsx`, `hooks/useAppFlags.js`, `navigation/index.jsx`, `App.jsx`, `context/AuthContext.jsx` (now also exports `AuthContext`, used by the dev gallery only).
Existing exports (PARTNERS, COACHES, SHUFFLED_LIVE_PARTNERS, MYSTERY_MAP_COUNTIES, maskComingSoonName, coachSlug) are unchanged. Fields were only added.

## Card settings (`app/src/data/partnerCards.js`)

Defaults plus per partner overrides in `PARTNER_CARD_OVERRIDES`, keyed by partner id. Fields: `brandColor`, `textColor` (auto white or near black, contrast 4.5 or better; Pouvoirs pink gets black because white is 4.44), `cardStyle` (`brand` or `mono`), `discountLabel`, `claimText`, `address`, `hours`, `openCardBlocks`, `photos`, `slogan`, `endsOn`, `todaySpecial`, `logoBg`.

- **Add a logo**: copy the file to `app/assets/partners/<id>/logo.<ext>`, then one line: `myid: { logo: require('../../assets/partners/myid/logo.png'), brandColor: '#1A73E8' }`. A partner with no logo and colour keeps its old `initBg` colour with initials.
- **Add a percentage**: `discountLabel: '15% off'`. One place, nothing else changes.
- **End date**: `endsOn: '2026-12-24'`. Shows "Ends Sunday" within 7 days, otherwise "Ends 24 Dec". Hidden when past or absent.
- **Opening hours**: `hours: 'Mon to Fri 9am to 6pm'` (shows on the profile and the `where` block).
- **Today's special**: `todaySpecial: 'Free shake with every sign up'` (shows on the back of the card).
- **Extra open card blocks**: `openCardBlocks: ['links', 'claim', 'where', 'showAtTill']`.

Brand colours set: energie #6FAE4A, whipwizardz #0A6B2F, saiemsent #0D0D0D, elect #0D0D0D, jordanskitchen #F3E3B4, roomy #54676B, zvisionapparel #14110D, pouvoirs #E2217A, plus jmc #394875 (taken from its logo).

## Placeholders still needing data

- Logos and colours for the other 18 live partners (initials on their old colour until then). The logo search found none it could confirm, so none were wired in.
- Z Vision Apparel has a colour but no logo file yet (shows ZV initials).
- Real percentages, end dates, addresses, hours and specials for every partner (none invented).
- Partner Spotlight updates (list is empty on purpose).
- Partner descriptions for Pouvoirs and a few others still say "to be confirmed".

## Dependencies added

`expo-sensors` (tilt and shake) and `qrcode-generator` (QR). `expo-haptics` was already installed. The `@xmldom/xmldom` override stays at 0.8.15.

## Migration (written, NOT applied)

`supabase/migrations/20261127100000_partner_coach_follows.sql`: table `partner_coach_follows` (user_id, target_type 'partner' or 'coach', target_id, created_at, unique), RLS so members read and write only their own rows, and `get_follow_count()` which returns a total only. After applying it, set the `app_flags` row `partner_follow_enabled` to true to show Follow.

## Dev gallery

`app/src/dev/CardGallery.jsx`, reached at `/__cards` on the web dev server only (loaded from `App.jsx` when `Platform.OS === 'web'` and `__DEV__`). Not in the native navigator and not in a release bundle. Examples: `/__cards?view=card&id=energie&side=back`, `?view=coachcard&slug=milan-piroska`, `?view=screen&name=wallet`.

## Not verified on a device

Web and a production iOS bundle were checked. These could not be tried on a phone or in Expo Go: tilt (sheen follows, far tilt shows the hidden slogan), shake to flip, haptics (scratch, hold, tick, wave, confetti), native blend modes (`mixBlendMode`, `filter`) on iOS and Android, native share sheet and maps handoff, and the drag to peel gesture with a finger. Each effect fails quietly to a plain card if a sensor or blend mode is missing. Reduced motion turns tilt, shake, confetti and flips into fades.

## Choices not in the brief

- Back of the card: the four action buttons sit under the card, not on it, so the card never gets taller than a bank card.
- Crisis support (Samaritans) is kept on Lifestyle as a slim line. The Collection stays below the wallet. The old horizontal partner rail is gone. Explore, Wellbeing and Budgeting links stay.
- Elevation keeps the Pro gate and the Find me a coach card. The category filter is kept and filters the carousel.
- Coach "Get in touch" opens the existing enquiry sheet (no coach contact details are in the app).
- Coach card photos: Eman uses the new profile photo, Nathan uses his portrait (second upload), Milan uses a brighter gallery shot because his hero is very dark, JMC shows its logo whole on its own blue. JMC's round photo is the arm mark cropped from the logo.
- Native partner bios drop sentences with euro amounts; all copy has em and en dashes replaced.
- Deep links to a partner (Home Spotlight, coach cross links) now open that card in the wallet.
- JMC Fitness is a partner as well, so it got the logo, a colour and a card.
- "Regular" chip sits under the logo tile on the stack card.


## Card detail pass

More detail on the Lifestyle partner cards and the Elevation coach cards. All of it is data driven, light and dark both work, and nothing was added to the card background art (still the baked images). No new dependencies.

### The offer table (field `discountLabel`)

| Pill text | Partners |
| --- | --- |
| 50% off joining | energie (joining fee 15 against a normal 30) |
| 10% off | elect, royaltyproductions, coded69studios |
| 10% off first booking | henrysisters |
| 10% off first appointment | ilashedbydiya |
| 1 week free trial | leva |
| Free listings | roomy |
| Up to 33% off | eabakeditt |
| UBP Deal | jordanskitchen, claras, camila, veeslash, cutbyire, nyz3ditz, mpfitness, whipwizardz, jmc, kelan, poiemadexigns |
| UBP Discount (default) | nailnurse, saiemsent, zvisionapparel, pouvoirs, islandsips, styledbybene, and any new partner |

The pill is one line. Longer offers use a smaller font, and iOS and Android also shrink it to fit, so a word is never cut. The same label shows on the stack card, open card, back of the card, till view, partner profile (header chip and the deal card) and the Home Spotlight cards. Native cards never read the partner `deal` strings (they hold euro amounts). Only `discountLabel` is used.

### The fields

All four live in `app/src/data/partnerCards.js` (partners, keyed by partner id) or `app/src/screens/ElevationScreen.jsx` (coaches).

- **`discountLabel`** (partner). The offer pill. Percentages or plain words only, never a euro amount. Change it with one line: `leva: { ..., discountLabel: '1 week free trial' }`. Leave it out for "UBP Discount".
- **`serviceChips`** (partner). Up to three short chips (about 18 characters, no euro amounts) on the open card and the partner profile. Hand set for every live partner that has services or a price list, plus elect, coded69studios, zvisionapparel and kelan. Change it with `serviceChips: ['Gel extensions', 'Gel overlay', 'BIAB']`. If you remove it, the chips are worked out from the partner `services` array, then from the `pricelist` labels with prices and words like Deposit, Joining Fee, Standard Monthly, Student Monthly and per session stripped. Islandsips, Styledbybene and Pouvoirs have no data yet, so they show no chips.
- **`about`** (partner). One short line under the card on the open card (two lines at most, about 100 characters). Only Energie has one set, because its description opens with a price. Change it with `about: 'One short sentence.'`. Without it, the first sentence of the partner `description` is used: sentences with a euro sign are dropped on native, an `(@handle)` in brackets is removed, placeholder text ("to be confirmed", "partner listing") is skipped, and a long sentence is cut on a word boundary with three dots. No `about` and no usable description shows nothing.
- **`availability`** (coach). `'taking'` shows "Taking clients" with a green dot, `'nearly_full'` shows "Nearly full" with an amber dot, remove the field to show nothing. The words always show, so the colour is never the only signal. All 12 coaches are seeded `'taking'` as a placeholder. The founder should correct each coach. It shows top left of the photo on the swipe card (and the Home Spotlight coach card) and as a chip in the coach profile header.
- **`chips`** (coach, optional). The up to three speciality chips on the swipe card. Without it they come from the coach `services` array (whole short phrases first), else the words in `category`. Hand set for 11 coaches whose service names are long (for example Eman shows LC Maths, LC Biology, LC Physics). Change it with `chips: ['Yoga', 'Meditation', 'Relaxation']`.

### Social and website icons

`components/lifestyle/wallet/PartnerLinks.jsx` now shows round 44 point buttons for Instagram, TikTok (a clean "TT" text mark, no brand artwork) and the website, each only when the link exists. The handles still come only from `usePartnerContact` (the backend RPC, Pro members only), the website from partner data. The Get in touch button stays and its list now holds Call or text and Email. The default open card blocks are unchanged (`['links']`). New file `components/lifestyle/wallet/ServiceChips.jsx` draws the chips and about line, and `components/elevation/AvailabilityBadge.jsx` draws the availability pill.

### Choices not in the brief

- Chips and the about line sit under the card (above the photos), not on the card face, so the face keeps its bank card shape and the slogan.
- The partner profile shows the partner's full `services` list when it has one, and the three chips when it does not. The profile section "UBP Discount" is now called "The offer", because the pill is no longer always "UBP Discount".
- The about line is about 100 characters, not 110, so it fits two lines on a normal phone. A very small phone may cut it with the usual tail ellipsis.
- The swipe card gradient is a little stronger and the tagline shows two lines (three when there are no chips), so the name, tagline and chips stay readable over any photo.
- Amber uses an orange amber (not the brand gold), dark pill with white text on the photo, theme colours on the profile.
- Energie also has a hand written `about` and the chips "Gym membership" and "Student rate".

### Not verified on a device

Web (Playwright, light and dark) and a production iOS bundle were checked. Not tried on an iPhone in Expo Go: the `adjustsFontSizeToFit` pill shrink on the longest offer (it is a safety net, the font is already sized by length), how the three swipe card chips wrap on a narrow phone, opening Instagram, TikTok and website links from the round buttons, and the real contact data (the screenshots used a fake test response, nothing fake is in the app). Legacy sheets (`PartnerExpandCard`, `PartnerDetailSheet` in `components/lifestyle/PartnerCards.jsx`) still read the partner `deal` string. They are not part of the wallet and were left alone, worth a separate look for native prices.
