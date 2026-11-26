# Foundation in review mode

Decision (founder): Foundation stays fully built in the iPhone and Android apps for store review. The envelopes, the letter paper questions, the review screen, the example library and the industry guides all stay. What goes is anything that sells. Ordering opens on the website on 26 December and production starts in January. The app never takes payment, at any time.

## What changes on iOS and Android

Everything below is driven by `useFoundationOrdering()` in `app/src/hooks/useAppFlags.js` and `NATIVE_NEUTRAL_BILLING` in `app/src/constants/platformPolicy.js`. On native, ordering is always off, whatever the remote flag says. The web build is unchanged.

| Place | On iOS and Android |
| --- | --- |
| Foundation hub, envelope letter | No tier prices, no Standard or Premium, no delivery timings, no "Ordering opens in January", no "Continue on uniblueprint.ie", no "Order another". The last step of "How it works" says answers are saved to the Blueprint. Button is "Start your answers", then "View and edit your answers" once saved. The envelope shows "Saved". The "Get in touch" email link is hidden. |
| All eight builders | The Standard or Premium delivery step is removed. The last step is "Check your answers" with a "Save to my Blueprint" button. No payment modal, no document row, no generator call, no review queue. |
| End of every builder | New saved page: "Your answers are saved to your Blueprint". Next steps: view and edit the answers, open the example library, read an industry guide, back to Foundation. |
| Example library, Industry guides | New read only screens. They read `example_library` and `industry_intelligence`. Rows UBP wrote carry "From UBP", other rows name their source. |
| Help, FAQs, Pricing, blog | Foundation help has no order, tier, timing or revision items. The FAQ answer has no timings. The Pricing plan lists no Foundation pay per service line or discount. The article "Foundation Blueprint: What It Is and How It Works" (tiers and prices) is left out. |
| Outputs empty state | "You can start your answers in Foundation now. They are saved to your Blueprint." |
| Notifications | The "Foundation ordering is open" notification is hidden in the list and does not route. |
| Output page for an expired document | No Pro wording. |

Search, Home and Explore cards only open Foundation. They carry no price (Spotlight already hid it).

Web build: while `foundation_ordering_enabled` is false it still shows "Ordering opens in January" and every builder now saves answers instead of ending on a dead end. When the flag is true it shows prices and the "Continue on uniblueprint.ie" button exactly as before.

## Where answers are stored

On the phone, in AsyncStorage, per account: `foundation_draft:<service>:<user id>` (the answers, autosaved as the member goes) and `foundation_saved:<service>:<user id>` (the time they finished). Answers reopen in the same builder. They do not sync between devices and are lost if the app is deleted. If you want them to follow the member to the website for the January order, that needs a table and a migration (not done here).

## Remote flags (`app_flags`)

| Key | Default | Effect |
| --- | --- | --- |
| `foundation_visible` | true | Foundation shows in the app. Set false to hide it entirely on iOS and Android (Home, sidebar, search, deep links go to Home). |
| `foundation_ordering_enabled` | false | Opens ordering on the WEB build only. Native ignores it. |

## Switching ordering on for 26 December and production in January

1. Before store submission: leave `foundation_visible` true and `foundation_ordering_enabled` false. Nothing else to do. If you would rather the reviewer never sees Foundation, set `foundation_visible` to false (see `store-readiness.md`, item 35).
2. 26 December, website: run `update public.app_flags set value = 'true'::jsonb, updated_at = now() where key = 'foundation_ordering_enabled';`. The web build shows prices and the order flow. The apps do not change.
3. Do not run `select public.broadcast_foundation_open();` for the whole member base as written. Its text is "Order your CV, cover letter or interview prep now" and it would reach iOS and Android phones as a push. Email the announcement instead, or change the text first so it does not tell people to order.
4. January, production: the handler pipeline and edge functions are unchanged and run on orders placed on the website. Orders show in the app under Outputs and on the hub envelope as "In progress" and "Delivered". Viewing them is fine on native.
5. To roll back: set `foundation_ordering_enabled` to false. Web returns to "Ordering opens in January".

## Store review doubts

- The letter still says a Campus Handler checks documents and a finished document arrives in Outputs. That describes the service, with no price or purchase action, but a reviewer may ask how a member gets one. The answer is the website, which the app does not mention.
- Reference Desk still opens coursecompass.ie in the browser for some third party tools (already noted in `store-readiness.md`).
- Delivered documents from website orders can be opened in the app. That is viewing something already obtained elsewhere, which is allowed.
