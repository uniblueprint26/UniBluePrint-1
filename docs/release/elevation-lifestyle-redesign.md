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
