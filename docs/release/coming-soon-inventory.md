# Coming soon inventory (app)

Every place in `app/src` that still tells the user something is "coming soon", "soon" or a placeholder. This file lists them only. Nothing here was changed. The Explore catalogue and the Kobo partner card were cleaned up separately and are not listed.

Line numbers are for the tree at the time of writing. Stores reject placeholder features, so each row needs a founder decision: remove it, build it, or hide it for launch.

## Clear "coming soon" the user can see

| # | File and line | What the user sees |
|---|---|---|
| 1 | `app/src/screens/CourseConnectScreen.jsx` 230-266 (render at 638) | Course Connect, Course Tools: six cards (Essay and Writing, Referencing, Timetable Planner, Module Tracker, Research Skills, Academic Integrity), each with a "Coming soon" pill and no action. |
| 2 | `app/src/screens/CourseConnectScreen.jsx` 636 | Line under Course Tools: "Exact tool set being confirmed." |
| 3 | `app/src/screens/CourseConnectScreen.jsx` 348-372 (render at 754) | Course Connect, cross Ireland section: four cards (Graduate Network, CAO Course Guide, Apprenticeship Connect, Industry Pathways), each marked "Coming soon". |
| 4 | `app/src/components/ui/FeatureCard.jsx` 48-50 | The "Coming Soon" pill drawn on the cards in rows 1 and 3. |
| 5 | `app/src/screens/CampusConnectScreen.jsx` 106-119 and `app/src/constants/campusBoards.js` 380-401 | Campus Connect board grid: Erasmus and Life as an International Student tiles are greyed out with a "Coming Soon" pill. Screen readers hear "coming soon". They are hidden from the Post picker (`app/src/components/campusConnect/BoardPickerModal.jsx` 19). |
| 6 | `app/src/screens/MyBlueprintScreen.jsx` 124-127, 163-181 | My Blueprint, Your tools: "Live archive" row with a "SOON" tag. Tapping opens a sheet: "Your Lives will be kept here. This is coming soon." Screen readers hear "Live archive, coming soon". |
| 7 | `app/src/screens/MyBlueprintScreen.jsx` 153-157 | The same sheet, titled "Coming soon". Only reachable from row 6 now that Kobo is gone. |
| 8 | `app/src/components/live/LiveWindowPopup.jsx` 22, 70-73 | Live popup: "Go Live" ends in a sheet titled "Live is coming soon". |
| 9 | `app/src/screens/NotificationsScreen.jsx` 258-262 | Notifications, Live prompt: sheet "Live is coming soon. Two minute captures are on their way." |
| 10 | `app/src/screens/ComposerScreen.jsx` 312-316 | Post composer, Live type: sheet "Live is coming soon. Two-minute Live captures are on their way." |
| 11 | `app/src/components/live/useLiveWindow.js` 62-77 | Logic that opens Live only if a `LiveCapture` route exists. None is registered, so rows 8 to 10 always show the sheet. |
| 12 | `app/src/screens/AdBoardBasketScreen.jsx` 79 | Ad Board, Deals basket: notice "More deals coming soon." |
| 13 | `app/src/components/ads/PartnerContactModal.jsx` 174 | Ad Board partner ads (Whip Wizardz, JMC Fitness, Energie): "Contact details coming soon", with a Message the team button. See `app/src/data/adBoardAds.js` 40. |
| 14 | `app/src/components/lifestyle/CollectionTiles.jsx` 121 | Lifestyle Collection tiles: a "Photo coming soon" tag on any partner with no product image, hero or logo. |
| 15 | `app/src/screens/LifestylePartnersScreen.jsx` 158-170, 194 and `app/src/components/lifestyle/PartnerCards.jsx` 241-262 | Lifestyle partners list: a "More Partners Joining Soon" group of locked grey cards (27 `status: 'shell'` partners in `app/src/data/lifestylePartners.js`, names masked as question marks). Tapping opens the "Coming Soon" sheet ("This partner is launching soon. Stay tuned."). |
| 16 | `app/src/components/ui/PartnerMap.jsx` 213-219, 303 | Lifestyle map: greyed pins and a card "A new partner is joining soon". |
| 17 | `app/src/components/ui/ComingSoonSheet.jsx` | The shared sheet behind rows 7 to 10 and 15. Default title "Coming Soon". |
| 18 | `app/src/screens/ElevationScreen.jsx` 297 | Elevation, one coach profile booking note: "Direct booking coming soon. Get in touch to enquire." |
| 19 | `app/src/screens/ElevationScreen.jsx` 408-437 and `app/src/screens/CoachProfileScreen.jsx` 678-680 | Elevation coach cards and profile for a coach with `shell` set: a "Coming Soon" badge and price chip. No coach has `shell` set in the data today, so this is dead code that cannot show right now. |
| 20 | `app/src/screens/WeeklyBlueprintScreen.jsx` 400 | Weekly Blueprint: the fashion page heading reads "Coming soon" when no fashion partner is live. Line 403 adds "No Lifestyle fashion partners live yet, check back soon." |

## Softer wording (empty states, not placeholders)

These are honest empty states on real screens. They say "soon" but do not promise a missing feature.

| # | File and line | What the user sees |
|---|---|---|
| 21 | `app/src/screens/WeeklyBlueprintScreen.jsx` 149 | "No live deals to show right now, check back soon." |
| 22 | `app/src/constants/exploreCatalog.js` 66 and `app/src/screens/ExploreListScreen.jsx` 42, 441 | Explore lists: "We are writing this one. Check back soon." and "If it fits, it will show up here soon." |
| 23 | `app/src/screens/CourseConnectScreen.jsx` 714 and `app/src/components/ui/MockContentBanner.jsx` 6 | "Examples shown below" banner over illustrative Recent Discussions (hard coded in `DISCUSSIONS`, 340-344). Not a "coming soon", but hard coded sample content. The banner's default title is "Coming Soon". |
| 24 | `app/src/screens/BoardDetailScreen.jsx` 1064 | Example projects note: "...will appear here and above this example set as soon as they're posted." |

## Counts

- Clear "coming soon" or SOON items: 20 (rows 1 to 20). Rows 4, 7, 11 and 17 are shared pieces of other rows, so there are 16 distinct user visible places.
- Softer empty state wording: 4 (rows 21 to 24).
- The Ad Board Tutors basket also shows hand written "Example tutors" (clearly labelled) when no real tutors exist. Not a "coming soon", but placeholder content to review.
