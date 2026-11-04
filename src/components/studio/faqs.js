// Per-hub FAQ content for <FaqSection>. Same pattern as quotes.js: a pool
// keyed by hub, a getter with a safe fallback, nothing fancier -- these are
// real answers about how each hub actually works (grounded in what each hub
// page's own `sections` array and shared Studio primitives do, checked live
// against the page code before writing these), not placeholder copy.
//
// GENERAL_FAQS answer the things every hub shares (StudioShell/CommandPalette/
// QuickAddFab/RequestPanel/useStudioTheme are wired identically on all 8
// hubs) -- shown first on every hub, then the hub's own specific questions.

export const GENERAL_FAQS = [
  {
    q: 'How do I jump to a section without scrolling?',
    a: 'Use the sidebar on the left, or press Cmd+K (Mac) / Ctrl+K (Windows) anywhere on the page to open quick-jump search -- it also searches your tasks and requests, not just section names.',
  },
  {
    q: 'How do I add a task for my team without leaving this page?',
    a: 'Tap the + button in the bottom corner (Quick Add). It creates a real task on your hub\'s own task board immediately, no need to scroll down to find the task section first.',
  },
  {
    q: 'What\'s the difference between the two Requests sections some hubs have?',
    a: 'A hub-specific request (like Finance\'s Money Requests) is that team\'s own internal queue. The "Requests" section near the bottom of every hub is different: it\'s for handing a task to ANOTHER hub, or asking another hub\'s leads for access -- those go both directions between teams.',
  },
  {
    q: 'Is this real data or placeholders?',
    a: 'Real data throughout, pulled live from Supabase. If a chart or table looks empty, it\'s because that\'s genuinely true right now (e.g. no payouts recorded yet), not a bug -- the empty states say so explicitly rather than faking a number.',
  },
  {
    q: 'Can I switch to dark mode?',
    a: 'Yes -- the sun/moon icon next to your avatar in the top-right toggles it, and it remembers your choice next time you visit this hub.',
  },
]

export const FAQS = {
  finance: [
    {
      q: 'What counts as "revenue this period" in the charts up top?',
      a: 'Real, collected coach_payments and one-time payments (Foundation, coaching, board listings) for whatever range you\'ve selected, with the 24 banned demo/QA accounts already excluded -- no need to mentally subtract them yourself.',
    },
    {
      q: 'Where do I log a partner\'s negotiated rate or change their tier?',
      a: 'Tier Scorecard. It\'s the same math as Alex\'s original UBP_Partner_Commercial_Toolkit, just wired to the real partner_tier_assignments data instead of a local spreadsheet.',
    },
    {
      q: 'How do I ask for budget instead of just flagging a number looks off?',
      a: 'Money Requests, not the general Requests section lower down -- that\'s this hub\'s own queue for exactly that.',
    },
  ],
  legal: [
    {
      q: 'Where do I find a specific coach or partner\'s paperwork?',
      a: 'Individual Folders -- it\'s organized per person, separate from the main Contracts Register, which is the company-wide list view.',
    },
    {
      q: 'How do I see what\'s overdue or close to a deadline?',
      a: 'Compliance -- it surfaces anything that needs attention first, rather than you having to scan the full Contracts Register for dates.',
    },
  ],
  tech: [
    {
      q: 'Someone on another team suggested a feature -- where does that go?',
      a: 'Idea Inbox. It\'s the triage queue for ideas coming in from outside tech, separate from the QA / Test Board, which is for issues already being worked.',
    },
    {
      q: 'What does "Health Overview" actually track?',
      a: 'Platform-level signals (uptime, error patterns, that kind of thing), not individual ticket status -- that\'s what QA / Test Board is for.',
    },
  ],
  outreach: [
    {
      q: 'Where do I log a new coach or partner conversation?',
      a: 'Outreach Log -- every contact goes there so it feeds into Health Overview and the comparison charts automatically.',
    },
    {
      q: 'How is "Campaign Task Board" different from Quick Add?',
      a: 'Quick Add creates one task fast from anywhere on the page. The Campaign Task Board below is where you manage and reassign everything already in flight.',
    },
  ],
  marketing: [
    {
      q: 'Where do early access signups show up?',
      a: 'Early Access Leads -- separate from Featured Content, which is about what we\'re actively promoting, not who\'s signed up.',
    },
    {
      q: 'How do I mark something as featured on the main site?',
      a: 'Featured Content handles that directly -- changes there reflect on the public site.',
    },
  ],
  co_director: [
    {
      q: 'What am I actually looking at on this hub?',
      a: 'A rollup of all five operational hubs (Finance, Legal, Tech, Outreach, Marketing) in one place, plus Needs A Decision for anything that\'s been escalated up to you specifically.',
    },
    {
      q: 'If I spot something wrong in, say, Finance, do I fix it here?',
      a: 'No -- this hub is read-only oversight. Use Cross-Hub Requests to hand it to that team directly, or jump into their own hub via the command palette (Cmd+K) if you have access.',
    },
  ],
  founder: [
    {
      q: 'What\'s the difference between "Needs A Decision" and "Founder Priorities"?',
      a: 'Needs A Decision is things escalated up from the hubs waiting on a call from you. Founder Priorities is the reverse -- things you\'ve flagged as important for the team to see.',
    },
    {
      q: 'Can I see what everyone else sees, or is this founder-only data?',
      a: 'Company-wide visibility -- Platform, Activity and Partners & Coaches aggregate every hub\'s real numbers, not a founder-specific subset.',
    },
  ],
  handler: [
    {
      q: 'What\'s the difference between Queue and Performance?',
      a: 'Queue is what\'s waiting on you right now. Performance looks back at your own claim speed and decision quality over time -- useful for spotting your own patterns, not for working the queue itself.',
    },
    {
      q: 'Does claiming a ticket here notify the student?',
      a: 'Yes -- claiming and deciding both trigger the same real notifications a student would see on their own submission.',
    },
  ],
}

/** Hub-specific FAQ pool, falling back to an empty array for an unknown
 * hubKey (GENERAL_FAQS above still renders either way). */
export function getFaqPool(hubKey) {
  return (FAQS[hubKey] && FAQS[hubKey].length) ? FAQS[hubKey] : []
}
