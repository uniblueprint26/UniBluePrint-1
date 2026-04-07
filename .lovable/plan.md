

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
- Post-signup onboarding flow: select user type (university student, 5th/6th year, apprentice, young worker, other), select campus (optional), preferences
- User type stored in profiles table, changeable in settings
- Role-based access: student-facing users vs Campus Handlers vs Uni Coaches

### Navigation & Layout
- **Bottom nav bar** (mobile-first): Home, Foundation, Elevation, Lifestyle, Campus/Course
- **Top bar**: UniBluePrint logo left, profile avatar right (opens settings)
- `/portal/*` prefix with separate layout for Handler/Coach portal
- Responsive: bottom nav on mobile, sidebar on desktop

### Home Dashboard
- Hero greeting ("Hey [name], ready to level up?")
- Quick action bar (shortcuts to key services)
- Featured deals strip (Lifestyle Blueprint partners)
- Categories grid (all five pillars as cards)
- Recent activity section

---

## Phase 2: Scaffold All Pillars (Pages + Navigation)

Create all routes with placeholder content, wired into navigation:

### Foundation Blueprint (`/foundation/*`)
- Service listing page (CV, LinkedIn, Cover Letter, Application Form, Interview Prep, Job Search, CAO Support)
- Service detail + structured input form page
- Payment flow (Stripe Elements embedded)
- Submission tracker (pending → in review → approved → delivered)

### Elevation Blueprint (`/elevation/*`)
- Service listing (Personal Branding, Network Assistance, Portfolio, Mentorship, Pitch Coaching, Postgrad Support)
- Coach directory with profiles, specialisms, availability calendars
- Engagement page (1:1 workspace between student and coach)
- Booking + payment flow

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

### Standalone Features
- **Budgeting Tool** (`/budget`) — income inputs, spending categories, three budget modes (strict/moderate/flexible), daily + weekly logging, visual summaries
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

## Phase 4: Integrations & Backend

### Supabase
- Database schema: profiles, user_roles, services, submissions, engagements, partners, deals, boards, posts, budget_entries, ads, coach_profiles, handler_assignments
- Row-Level Security on all tables
- Realtime subscriptions for boards and engagement chat

### Stripe (Embedded Elements)
- One-off payments for Foundation Blueprint services
- Engagement-based payments for Elevation Blueprint
- Paid ad tier for Advertisement Board

### Cloudflare R2
- File uploads for CVs, portfolios, deliverables
- Signed URL access for secure document delivery

### Settings Page
- Profile editing (name, avatar, campus, user type)
- Notification preferences
- Dark/light mode toggle
- Account management (password, email, delete)

---

## Build Order Summary

1. Design system, auth, navigation, home dashboard
2. All page scaffolds with placeholder content
3. Foundation Blueprint (full flow: form → pay → submit → track)
4. Lifestyle Blueprint (partner directory, wallet, booking)
5. Campus Connect (boards, posts, campus scoping)
6. Elevation Blueprint (coach profiles, booking, engagement workspace)
7. Course Connect (student directory, cross-campus features)
8. Budgeting Tool + Advertisement Board
9. Handler & Coach Portal
10. Stripe payments, R2 file uploads, polish

