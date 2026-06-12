# Uniblueprint — Design Reference

Complete visual identity spec for the mobile app. Match these exactly.

---

## Colours

| Token | Hex | Usage |
|---|---|---|
| Navy (Primary) | `#1E3A5F` | Headings, buttons, icons, borders, links |
| Cream (Background) | `#F5F0E8` | Page backgrounds, section fills, hover states |
| White (Card) | `#FFFFFF` | Cards, modals, inputs, navbar |
| Text Secondary | `#6B7280` | Body copy, subtitles, descriptions |
| Text Light | `#9CA3AF` | Hints, placeholders, metadata |
| Border | `rgba(30,58,95,0.12)` | Dividers, input borders (default state) |
| Success | `#16A34A` | Success states, confirmation icons |
| Error/Destructive | `#DC2626` | Error states, error banners, sign out |

### Background pattern
Pages alternate between **Cream** and **White** sections:
- Hero section → White
- Content section → Cream
- Next section → White
- etc.

---

## Typography

### Fonts
- **Headings:** `DM Serif Display` (Google Font — import from Google Fonts)
- **Body / UI:** `DM Sans` (Google Font)

```
https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap
```

### Type scale

| Element | Font | Size | Weight | Colour |
|---|---|---|---|---|
| Page hero H1 | DM Serif Display | 48px | normal | `#1E3A5F` |
| Section H2 | DM Serif Display | 36px | normal | `#1E3A5F` |
| Card heading | DM Serif Display | 22px | normal | `#1E3A5F` |
| Form card heading | DM Serif Display | 28px | normal | `#1E3A5F` |
| Body paragraph | DM Sans | 14–16px | 400 | `#6B7280` |
| Body line-height | — | — | — | 1.7–1.8 |
| Nav links | DM Sans | 14px | 500 | `#1E3A5F` |
| Button label | DM Sans | 14–15px | 600 | `#F5F0E8` |
| Label (form) | DM Sans | 14px | 500 | `#1E3A5F` |
| Input text | DM Sans | 15–16px | 400 | `#1E3A5F` |
| Hint / consent | DM Sans | 12px | 400 | `#9CA3AF` |
| Section eyebrow | DM Sans | 12px | 600 | `#6B7280` — ALL CAPS, letter-spacing 0.06em |
| Metadata / small | DM Sans | 11–13px | 400 | `#9CA3AF` |

---

## Spacing

| Token | Value | Usage |
|---|---|---|
| Section padding (desktop) | `80px 24px` | Top/bottom padding on each full-width section |
| Section padding (mobile) | `64px 24px` | Reduce on smaller screens |
| Max content width | `900–1100px` | Centred via `margin: 0 auto` |
| Card padding | `20px 24px` | Standard card inner padding |
| Card padding (large) | `36px` — `48px 40px` | Form cards, legal content |
| Card gap (grid) | `16px` | Between cards in a grid |
| Section gap | `40px` | Between section header and content |

---

## Cards

```
background:    #FFFFFF
border-radius: 12px
box-shadow:    0px 2px 12px rgba(30,58,95,0.08)

hover shadow:  0px 4px 20px rgba(30,58,95,0.14)
```

---

## Buttons

### Primary (CTA)
```
background:    #1E3A5F
color:         #F5F0E8
height:        52px (forms) / 48px (smaller CTAs)
padding:       0 32px (inline CTAs)
border-radius: 8px
font:          DM Sans 15px 600
transition:    background 150ms
disabled:      rgba(30,58,95,0.7)
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

### Ghost / Text button
```
background:    none
color:         #1E3A5F
border:        none
opacity:       0.7 on hover
```

### Nav auth buttons
```
Sign In:  outlined — border: 1px solid #1E3A5F, height: 36px, padding: 0 20px
Sign Up:  filled   — background: #1E3A5F, color: #F5F0E8, height: 36px, padding: 0 20px
```

---

## Form inputs

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

### Textarea
Same as input but:
```
height:  auto
padding: 12px 14px
resize:  vertical
```

### Select
Same as input + `cursor: pointer`

### Checkbox
```
size:         18x18px
accent-color: #1E3A5F
label font:   DM Sans 14px, color #1E3A5F
```

### Error state
```
background: rgba(220,38,38,0.1)
border-radius: 8px
padding: 12px 16px
icon: AlertCircle, color #DC2626, size 18px
text: DM Sans 14px, color #DC2626
```

### Success state
```
icon: CheckCircle, color #16A34A, size 56px, centred
title: DM Serif Display 24px, #1E3A5F
subtitle: DM Sans 15px, #6B7280
```

---

## Navigation

### Desktop navbar
```
background:  #FFFFFF
height:      72px (min)
position:    sticky, top 0
box-shadow:  0px 1px 4px rgba(30,58,95,0.06)
padding:     0 32px
z-index:     100
```

### Mobile navbar
```
background:  #FFFFFF
height:      56px (min)
padding:     0 16px
```

### Logo
```
height: 36px (desktop) / 32px (mobile)
width:  auto
```

### Dropdown panel
```
background:    #FFFFFF
border-radius: 12px (services) / 10px (join)
box-shadow:    0px 4px 20px rgba(30,58,95,0.14)
padding:       24px (services mega) / 8px (small)
z-index:       99
```

### Dropdown links
```
padding:       10px 14px
border-radius: 8px
font:          DM Sans 14px, #1E3A5F
hover bg:      #F5F0E8
transition:    background 150ms
```

### Mobile menu
```
background:       #F5F0E8
width:            100%
position:         fixed, right slide-in
z-index:          200
primary link:     DM Serif Display 24px, #1E3A5F, padding 20px 24px
sub-link:         DM Sans 15px, #1E3A5F, opacity 0.8, padding 10px 24px 10px 32px
divider:          1px solid rgba(30,58,95,0.08)
transition:       translateX 300ms ease-out
backdrop:         rgba(0,0,0,0.3)
```

---

## Badges / Pills

### Section eyebrow label (above section headings)
```
font:             DM Sans 12px 600
color:            #6B7280
text-transform:   uppercase
letter-spacing:   0.06em
margin-bottom:    8px
```

### Service badge (e.g. "50% OFF")
```
background:    #1E3A5F
color:         #F5F0E8
font:          DM Sans 11px 600
padding:       3px 8px
border-radius: 20px
```

### Partner badge (e.g. "INTEGRATION PARTNER")
```
background:    rgba(30,58,95,0.08)
color:         #1E3A5F
font:          DM Sans 10px 700
padding:       3px 8px
border-radius: 4px
letter-spacing: 0.04em
text-transform: uppercase
```

---

## Icons

Library: **Lucide React** (`lucide-react` on npm)

Standard sizes:
- Nav icons: 16px
- Card icons: 20px
- Feature icons: 24px
- Success/error: 56px (success), 18px (error inline)

Icon containers (circular):
```
width/height:  40px (standard) / 48px (large)
border-radius: 50%
background:    #F5F0E8 on white card / #FFFFFF on cream background
icon colour:   #1E3A5F
```

---

## Shadows

| Name | Value | Usage |
|---|---|---|
| Card | `0px 2px 12px rgba(30,58,95,0.08)` | Default card |
| Card hover | `0px 4px 20px rgba(30,58,95,0.14)` | Elevated / hovered card |
| Dropdown | `0px 4px 20px rgba(30,58,95,0.14)` | Dropdowns, modals |
| Navbar | `0px 1px 4px rgba(30,58,95,0.06)` | Sticky header |

---

## Border radius

| Element | Radius |
|---|---|
| Cards | 12px |
| Buttons | 8px |
| Inputs | 8px |
| Badges | 4–6px |
| Pills | 20px (fully rounded) |
| Avatar circle | 50% |

---

## Transitions

```
Standard UI:   150ms ease
Mobile menu:   300ms ease-out (open), 250ms ease-in (close)
Chevron rotate: 200ms
Route fade-in:  150ms ease-in-out (opacity 0 → 1)
```

---

## Focus / Accessibility

```
outline:        2px solid #1E3A5F
outline-offset: 2px
border-radius:  4px
(only on :focus-visible, not :focus)
```

Minimum touch target: **44×44px** for all interactive elements.

---

## Section layout pattern

Every page follows this alternating pattern:

```
1. Hero       → background: #FFFFFF, padding: 80px 24px, text-align: center
2. Content    → background: #F5F0E8, padding: 64–80px 24px
3. Next block → background: #FFFFFF
4. CTA/dark   → background: #1E3A5F (optional dark section, text: #F5F0E8)
```

---

## Dark CTA section

Used at the bottom of most pages:
```
background:  #1E3A5F
padding:     80px 24px
text-align:  center
heading:     DM Serif Display 40px, color #F5F0E8
body:        DM Sans 16px, color rgba(245,240,232,0.7)
```

---

## Announcement banner (top of page, above navbar)

```
background:  #1E3A5F
color:       #F5F0E8
padding:     10px 16px
font:        DM Sans 13px 500
text-align:  center
```

---

## Footer

```
background:         #1E3A5F
padding:            64px 32px 32px
column heading:     DM Sans 11px 600, #F5F0E8, uppercase, letter-spacing 0.06em
column link:        DM Sans 13px, rgba(245,240,232,0.7) → #F5F0E8 on hover
bottom bar font:    DM Sans 11px, rgba(245,240,232,0.4)
social icon circle: 36×36px, border: 1px solid rgba(245,240,232,0.2), icon: rgba(245,240,232,0.7)
```

---

## Global rules

- `color-scheme: only light` — no dark mode, ever
- `-webkit-font-smoothing: antialiased` on body
- `box-sizing: border-box` on everything
- `scroll-behavior: smooth`
- `overscroll-behavior: none`
- Input / textarea / select font-size minimum: **16px** (prevents iOS Safari zoom)
- `-webkit-tap-highlight-color: transparent` on all interactive elements
