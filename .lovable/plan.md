

# UniBluePrint — Full Project Plan
**"The Structure Behind Your Success"**

## Phase 1: Foundation & Design System

### Design System Setup
- Colors: background white (#FFFFFF) / deep navy (#0A1628), primary deep blue (#1A3FBF), accent medium blue (#4A6FE3)
- Typography: Inter font, clean modern hierarchy
- Light/dark mode toggle with CSS variables
- Shared component library: buttons, cards, inputs, badges, modals, avatars

### Authentication & Onboarding
- Supabase Auth with email/password and social login
- Post-signup onboarding flow: select user type (university student, 5th year, 6th year, apprentice, young worker, other young person), select campus (optional), preferences
- User type stored in profiles table, changeable in settings
- Role-based access: student-facing users vs Campus Handlers vs Uni Coaches vs Operations

### Navigation & Layout
- **Bottom nav bar** (mobile-first): Home, Blueprint, Connect, Lifestyle, More
  - Blueprint → Foundation Blueprint, Elevation Blueprint
  - Connect → Campus Connect, Course Connect
  - More → Budgeting Tool, Advertisement Board
- **Top bar**: UniBluePrint logo left, profile avatar right (opens settings)
- `/portal/*` prefix for Handler/Coach portal
- `/operations/*` prefix for Operations Dashboard
- Responsive: bottom nav on mobile, sidebar on desktop

### Home Dashboard
- Hero greeting: "Welcome back, [name]" with university/field shown beneath
- Quick action bar (shortcuts to key services)
- Featured deals strip (Lifestyle Blueprint partners)
- Categories grid (pillars as cards)
- Recent activity section

---

## Phase 2: Scaffold All Pillars (Pages + Navigation)

Create all routes with placeholder content, wired into navigation:

### Foundation Blueprint (`/foundation/*`)
- Service listing page (CV, LinkedIn, Cover Letter, Application Form, Interview Prep, Job Search, CAO Support)
- Service detail + structured input form page
- Payment flow (Stripe Elements embedded — all payments via UniBluePrint company account)
- Submission tracker with five stages: **Submitted → In Queue → Assigned → In Review → Delivered** (each stage shows a timestamp)

### Elevation Blueprint (`/elevation/*`)
- Service listing (Personal Branding, Network Assistance, Portfolio, Mentorship, Pitch Coaching, Postgrad Support)
- Coach directory with profiles, specialisms, availability calendars
- Engagement page (1:1 workspace between student and coach)
- Booking + payment flow (all payments via UniBluePrint company account)

### Lifestyle Blueprint (`/lifestyle/*`)
- Partner directory with categories (gyms, driving schools, restaurants, barbers, mental health, etc.)
- Partner detail page with booking or discount code claim
- Lifestyle Wallet (saved discount codes, booking history)
- Campus-local and national partner filtering

### Campus Connect (`/campus/*`)
- Campus selector / campus-scoped view
- Boards: Project Collaboration, Problems & Solutions, Shared Notes, Shared Subscriptions, College Reviews, Carpool, Lost & Found, Campus Suggestions
- Each board as a feed with post creation, replies, voting

### Course Connect (`/connect/*`)
- Cross-Ireland student database (searchable profiles)
- Cross-Ireland project collaboration board
- Resource finder, Industry discussion boards
- Events listings, Cross-Ireland college reviews

### Standalone Features (under More tab)
- **Budgeting Tool** (`/budget`) — income inputs, spending categories, three budget modes (Spending Based, Saving Based, Balanced), daily + weekly logging, visual summaries
- **Advertisement Board** (`/ads`) — All Ireland + My Campus views, free and paid listing tiers, moderation queue

---

## Phase 3: Handler & Coach Portal (`/portal/*`)

### Shared Portal Features
- Portal login (same auth, role-based redirect)
- Portal dashboard with assigned tasks, pending reviews, earnings

### Campus Handler Portal
- Queue of student submissions (Foundation Blueprint)
- Review interface: see AI-generated output, edit, approve/reject
- Delivery confirmation
- Performance metrics

### Uni Coach Portal
- Profile management (specialisms, bio, availability calendar)
- Engagement management (active clients, session notes, deliverables)
- Booking requests and scheduling
- Earnings and engagement history

---

## Phase 4: Operations Dashboard (`/operations/*`)

### Operations Portal
- Full visibility over all platform activity
- Ticket management: all submissions, engagements, statuses
- Flagged content moderation (boards, ads, profiles)
- Partner management and payout oversight
- User message moderation
- Spot checks and compliance tools
- Refund processing
- Commission declarations and financial reporting

---

## Phase 5: Integrations & Backend

### Supabase
- Database schema: profiles, user_roles, services, submissions, engagements, partners, deals, boards, posts, budget_entries, ads, coach_profiles, handler_assignments, notifications, handler_queue, ticket_revisions, commission_declarations, partner_payouts, carpool_terms_acceptance, legal_acknowledgements, operations_flags, spot_checks, refunds
- Row-Level Security on all tables
- Realtime subscriptions for boards and engagement chat

### Stripe (Embedded Elements)
- **All payments flow through the UniBluePrint company account first** — no direct payments from students to Handlers, Coaches, or partners
- One-off payments for Foundation Blueprint services
- Engagement-based payments for Elevation Blueprint
- Paid ad tier for Advertisement Board
- Platform-managed disbursements to Handlers, Coaches, and partners

### Cloudflare R2
- File uploads for CVs, portfolios, deliverables
- Signed URL access for secure document delivery

### Settings Page — "Your Blueprint"
Settings structured as named cards in this exact order:
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

## Phase 6: Notification System

### Push Notifications
- Browser push notifications (with permission prompt)
- Mobile push via PWA or native wrapper

### In-App Notification Centre
- Bell icon in top bar with unread count
- Notification feed with read/unread states
- Link to relevant content from each notification

### Notification Preferences (per category)
- Blueprint Alerts (submission updates, deliveries)
- Budget Alerts (spending limits, weekly summaries)
- Ad Alerts (ad status, expiry)
- Connect Alerts (replies, mentions, board activity)
- Promotional Alerts (deals, partner offers)
- Security Alerts (login, password changes, suspicious activity)

---

## Phase 7: Final Polish
- End-to-end testing
- Performance optimisation
- Accessibility audit
- Launch readiness review

---

## Build Order Summary

1. Design system, auth, navigation, home dashboard
2. All page scaffolds with placeholder content
3. Foundation Blueprint (full flow: form → pay → submit → track with 5 stages)
4. Lifestyle Blueprint (partner directory, wallet, booking)
5. Campus Connect (boards, posts, campus scoping)
6. Elevation Blueprint (coach profiles, booking, engagement workspace)
7. Course Connect (student directory, cross-campus features)
8. Budgeting Tool + Advertisement Board
9. Handler & Coach Portal
10. Operations Dashboard
11. Stripe payments (company-account-first architecture), R2 file uploads
12. Notification System
13. Settings page ("Your Blueprint" with 12 named cards)
14. Final polish and launch prep
