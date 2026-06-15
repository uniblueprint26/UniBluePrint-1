# UniBlueprint — Design Reference
### App & Web visual identity spec

> **Important — colour note:** The original plan doc referenced `#0A1628`, `#1A3FBF`, `#4A6FE3`, and Inter font. These were superseded when the website was designed and approved. **Use the values in this document.** The website is the source of truth.

---

## Brand

- **Product name:** UniBlueprint (capital U, capital B, lowercase p)
- **Tagline:** "The Structure Behind Your Success"
- **Tone:** Structured and premium. Never casual or hype. No "Hey [name], ready to level up?" — always measured, confident, purposeful.
- **Market:** Irish students — university, 5th year, 6th year, apprentice, young worker, other young person

---

## Colours

| Token | Hex | Usage |
|---|---|---|
| Navy (Primary) | `#1E3A5F` | Headings, buttons, icons, nav, borders, links |
| Cream (Background) | `#F5F0E8` | Page/section backgrounds, hover fills, mobile menu |
| White (Surface) | `#FFFFFF` | Cards, modals, inputs, navbar, alternate sections |
| Text Secondary | `#6B7280` | Body copy, subtitles, descriptions |
| Text Light | `#9CA3AF` | Hints, placeholders, metadata, consent text |
| Border | `rgba(30,58,95,0.12)` | Dividers, input borders (default state) |
| Success | `#16A34A` | Success states, confirmation icons |
| Error / Destructive | `#DC2626` | Error banners, delete actions, sign out |

### Section background pattern (web — mirror in app where appropriate)
Pages alternate White → Cream → White:
- Hero → `#FFFFFF`
- Content → `#F5F0E8`
- Next block → `#FFFFFF`
- Dark CTA → `#1E3A5F` (text: `#F5F0E8`)

---

## Typography

### Fonts
- **Headings:** `DM Serif Display` — Google Font
- **Body / UI:** `DM Sans` — Google Font

```
https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap
```

For the app use the same fonts via a font loading package, or the closest available system equivalents if bundle size is a constraint.

### Type scale

| Element | Font | Size | Weight | Colour |
|---|---|---|---|---|
| Page hero H1 | DM Serif Display | 48px | normal | `#1E3A5F` |
| Section H2 | DM Serif Display | 36px | normal | `#1E3A5F` |
| Card heading | DM Serif Display | 22px | normal | `#1E3A5F` |
| Form card heading | DM Serif Display | 28px | normal | `#1E3A5F` |
| Body paragraph | DM Sans | 14–16px | 400 | `#6B7280` |
| Body line-height | — | 1.7–1.8 | — | — |
| Nav / UI labels | DM Sans | 14px | 500 | `#1E3A5F` |
| Button label | DM Sans | 14–15px | 600 | `#F5F0E8` |
| Form label | DM Sans | 14px | 500 | `#1E3A5F` |
| Input text | DM Sans | 15–16px | 400 | `#1E3A5F` |
| Hint / consent | DM Sans | 12px | 400 | `#9CA3AF` |
| Section eyebrow | DM Sans | 12px | 600 | `#6B7280` — ALL CAPS, letter-spacing 0.06em |
| Metadata / small | DM Sans | 11–13px | 400 | `#9CA3AF` |

---

## Spacing

| Token | Value | Usage |
|---|---|---|
| Section padding (desktop) | `80px 24px` | Full-width section top/bottom |
| Section padding (mobile) | `64px 24px` | Scaled down |
| Max content width | `900–1100px` | Centred via `margin: 0 auto` |
| Card padding (standard) | `20px 24px` | Default card inner |
| Card padding (large) | `36px` / `48px 40px` | Form cards, legal content |
| Card gap (grid) | `16px` | Between cards |
| Section gap | `40px` | Header → content within a section |

---

## Cards

```
background:    #FFFFFF
border-radius: 12px
box-shadow:    0px 2px 12px rgba(30,58,95,0.08)

hover:         0px 4px 20px rgba(30,58,95,0.14)
```

---

## Buttons

### Primary (CTA / filled)
```
background:    #1E3A5F
color:         #F5F0E8
height:        52px (forms) / 48px (inline CTAs)
padding:       0 32px (inline)
border-radius: 8px
font:          DM Sans 15px 600
transition:    background 150ms
disabled:      rgba(30,58,95,0.7), cursor not-allowed
```

### Secondary / Outlined
```
background:    #FFFFFF
color:         #1E3A5F
border:        1.5px solid rgba(30,58,95,0.15)
height:        36–48px
border-radius: 8px
font:          DM Sans 14px 500
```

### Ghost / Text
```
background:    none
color:         #1E3A5F
border:        none
opacity:       0.7 on hover
```

### Nav auth buttons
```
Sign In: outlined — border 1px solid #1E3A5F, height 36px, padding 0 20px
Sign Up: filled   — background #1E3A5F, color #F5F0E8, height 36px, padding 0 20px
```

---

## Form Inputs

```
height:        48px
border:        1.5px solid rgba(30,58,95,0.2)
border-radius: 8px
padding:       0 14px
font:          DM Sans 15px
color:         #1E3A5F
background:    #FFFFFF

focus border:  #1E3A5F
focus shadow:  0 0 0 3px rgba(30,58,95,0.1)
```

**Textarea:** same but `height: auto`, `padding: 12px 14px`, `resize: vertical`

**Select:** same as input + `cursor: pointer`

**Checkbox:**
```
size:         18×18px
accent-color: #1E3A5F
label:        DM Sans 14px, #1E3A5F
```

**Error banner:**
```
background:    rgba(220,38,38,0.1)
border-radius: 8px
padding:       12px 16px
icon:          AlertCircle, #DC2626, 18px
text:          DM Sans 14px, #DC2626
```

**Success state:**
```
icon:     CheckCircle, #16A34A, 56px centred
title:    DM Serif Display 24px, #1E3A5F
subtitle: DM Sans 15px, #6B7280
```

---

## Icons

Library: **Lucide** (web uses `lucide-react`; use `lucide-react-native` for the app)

Standard sizes:
- Nav / UI: 16px
- Card feature icons: 20px
- Section / hero: 24px
- Success state: 56px
- Error inline: 18px

**Icon containers (circular):**
```
size:             40px (standard) / 48px (large)
border-radius:    50%
background:       #F5F0E8 on white card / #FFFFFF on cream bg
icon colour:      #1E3A5F
```

---

## Shadows

| Name | Value | Usage |
|---|---|---|
| Card | `0px 2px 12px rgba(30,58,95,0.08)` | Default cards |
| Card hover / elevated | `0px 4px 20px rgba(30,58,95,0.14)` | Hovered cards, dropdowns |
| Navbar | `0px 1px 4px rgba(30,58,95,0.06)` | Sticky header |

---

## Border Radius

| Element | Radius |
|---|---|
| Cards | 12px |
| Buttons | 8px |
| Inputs | 8px |
| Dropdown panels | 10–12px |
| Badges (standard) | 4–6px |
| Pills (fully rounded) | 20px |
| Avatar / circle | 50% |

---

## Badges & Pills

**Section eyebrow** (above headings):
```
font:           DM Sans 12px 600
color:          #6B7280
text-transform: uppercase
letter-spacing: 0.06em
```

**Service badge** (e.g. "50% OFF"):
```
background:    #1E3A5F
color:         #F5F0E8
font:          DM Sans 11px 600
padding:       3px 8px
border-radius: 20px
```

**Status / partner badge** (e.g. "INTEGRATION PARTNER", "IN QUEUE"):
```
background:     rgba(30,58,95,0.08)
color:          #1E3A5F
font:           DM Sans 10px 700
padding:        3px 8px
border-radius:  4px
letter-spacing: 0.04em
text-transform: uppercase
```

---

## Transitions & Animation

```
Standard UI elements:  150ms ease
Mobile menu open:      300ms ease-out (translateX)
Mobile menu close:     250ms ease-in
Chevron rotate:        200ms
Route / screen fade:   150ms ease-in-out (opacity 0 → 1)
Loading spinner:       spin 0.8s linear infinite
```

---

## Focus / Accessibility

```
outline:        2px solid #1E3A5F
outline-offset: 2px
border-radius:  4px
trigger:        :focus-visible only (not :focus)
```

Minimum touch target: **44×44px** for every interactive element.

Input `font-size` minimum: **16px** (prevents iOS Safari zoom on focus).

---

## Web Navigation

### Desktop navbar
```
background:  #FFFFFF
height:      72px min
position:    sticky top 0
box-shadow:  0px 1px 4px rgba(30,58,95,0.06)
padding:     0 32px
z-index:     100
```

### Mobile navbar
```
height:   56px min
padding:  0 16px
```

### Dropdown panel
```
background:    #FFFFFF
border-radius: 12px (mega) / 10px (small)
box-shadow:    0px 4px 20px rgba(30,58,95,0.14)
padding:       24px (mega) / 8px (compact)
```

### Dropdown links
```
padding:    10px 14px
border-r:   8px
font:       DM Sans 14px, #1E3A5F
hover bg:   #F5F0E8
transition: background 150ms
```

### Mobile menu
```
background: #F5F0E8
width:      100%
position:   fixed right, slide-in
z-index:    200
backdrop:   rgba(0,0,0,0.3), z-index 199

primary link: DM Serif Display 24px, #1E3A5F, padding 20px 24px
sub-link:     DM Sans 15px, #1E3A5F, opacity 0.8, padding 10px 24px 10px 32px
divider:      1px solid rgba(30,58,95,0.08)
```

---

## App Navigation (mobile-first)

### Bottom nav bar
Five tabs — always visible at the bottom of the app:

| Tab | Sub-sections |
|---|---|
| Home | Dashboard |
| Blueprint | Foundation Blueprint, Elevation Blueprint |
| Connect | Campus Connect, Course Connect |
| Lifestyle | Partner directory, Lifestyle Wallet |
| More | Budgeting Tool, Advertisement Board |

### Top bar
```
Left:  UniBlueprint logo
Right: Profile avatar (opens settings / account)
       + Notification bell with unread count badge
```

### Route structure
```
Student app:       /
Handler/Coach:     /portal/*
Operations:        /operations/*
```

---

## App — Home Dashboard

Elements in order:
1. **Hero greeting** — "Welcome back, [First name]" (DM Serif Display), university + field shown below (DM Sans, `#6B7280`)
2. **Quick action bar** — horizontal scroll row of shortcut chips to key services
3. **Featured deals strip** — Lifestyle Blueprint partner deals (horizontal scroll)
4. **Categories grid** — the 5 pillars as tappable cards
5. **Recent activity** — latest submission updates, new posts, notifications

Tone: never "Hey [name], ready to level up?" — always "Welcome back, [name]."

---

## App — Submission Tracker

Foundation Blueprint submissions pass through **5 stages** in order:

```
Submitted → In Queue → Assigned → In Review → Delivered
```

Each stage shows a **timestamp**. Use a stepped progress indicator (not a progress bar). Active stage: Navy fill. Completed: Navy fill with tick. Upcoming: Cream/grey.

---

## App — Settings ("Your Blueprint")

Settings page is structured as 12 named cards **in this exact order:**

1. My Identity
2. My Status
3. My Connections
4. My Alerts
5. My Privacy
6. My Security
7. My Finances
8. My Blueprint History
9. My Display
10. Blueprint Support
11. Blueprint Terms
12. My Account

---

## App — Notification Categories

| Category | Triggers |
|---|---|
| Blueprint Alerts | Submission updates, deliveries, stage changes |
| Budget Alerts | Spending limits hit, weekly summaries |
| Ad Alerts | Ad status changes, expiry warnings |
| Connect Alerts | Replies, mentions, board activity |
| Promotional Alerts | Partner deals, new offers |
| Security Alerts | Login, password changes, suspicious activity |

---

## App — User Types

Six user types (set at sign-up, editable in settings):

1. University student
2. 5th year
3. 6th year
4. Apprentice
5. Young worker
6. Other young person

User type is stored in the `profiles` table and controls which features/content are surfaced.

---

## Payment Architecture

**All payments flow through the UniBlueprint company account first — never directly from student to handler, coach, or partner.**

- Foundation Blueprint → one-off payment at submission
- Elevation Blueprint → engagement-based payment at booking
- Advertisement Board → paid tier at listing creation
- Platform manages disbursements to Handlers, Coaches, and partners after delivery

Use **Stripe Elements** (embedded, not hosted checkout).

---

## File Uploads

**Cloudflare R2** for all user-uploaded files (CVs, portfolios, deliverables).
Serve via **signed URLs** — never public direct links.

---

## Footer (web)

```
background:      #1E3A5F
padding:         64px 32px 32px
column heading:  DM Sans 11px 600, #F5F0E8, uppercase, letter-spacing 0.06em
column link:     DM Sans 13px, rgba(245,240,232,0.7) → #F5F0E8 on hover
bottom bar:      DM Sans 11px, rgba(245,240,232,0.4)
social circles:  36×36px, border 1px solid rgba(245,240,232,0.2)
```

---

## Announcement Banner (web — top of page)

```
background: #1E3A5F
color:      #F5F0E8
padding:    10px 16px
font:       DM Sans 13px 500
text-align: center
```

---

## Dark CTA Section (web — bottom of most pages)

```
background: #1E3A5F
padding:    80px 24px
heading:    DM Serif Display 40px, #F5F0E8
body:       DM Sans 16px, rgba(245,240,232,0.7)
text-align: center
```

---

## Global Rules

- **No dark mode** — `color-scheme: only light`, always
- `-webkit-font-smoothing: antialiased` on body
- `box-sizing: border-box` on everything
- `scroll-behavior: smooth`
- `overscroll-behavior: none`
- All payments via UniBlueprint company account — never direct
- Lucide icons throughout — consistent style, no mixed icon libraries
