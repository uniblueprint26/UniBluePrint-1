import { useState, useMemo, useId, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ChevronDown, Search } from 'lucide-react'

// ─── FAQ Data ──────────────────────────────────────────────────────────────────

const FAQ_CATEGORIES = [
  {
    category: 'General',
    items: [
      {
        q: 'What is UniBlueprint?',
        a: 'UniBlueprint is an all-in-one platform for young people across Ireland, whatever pathway you are on. It gives you access to professional career support through Foundation Blueprint, expert coaching and strategy through Elevation Blueprint, exclusive lifestyle deals through Lifestyle Blueprint, campus community features through Campus Connect, and cross-Ireland networking through Course Connect. Everything in one place — built for the full range of Irish youth experiences.',
      },
      {
        q: 'Who is UniBlueprint for?',
        a: 'UniBlueprint is for young people across Ireland on every pathway: university, college, apprenticeship, PLC, 5th and 6th year, and those already in work. Whether you are applying for college, starting an apprenticeship, building your career, or looking for deals near your campus — UniBlueprint has something for you.',
      },
      {
        q: 'Is UniBlueprint free?',
        a: 'Yes — UniBlueprint has a genuinely useful free tier. Foundation Blueprint at Standard pricing, Campus Connect, Course Connect, the Budgeting Tool, and all Mental Health & Wellbeing resources are free for every user. Pro subscription unlocks same-day delivery, Premium tiers, and the full Lifestyle Blueprint.',
      },
      {
        q: 'Where is UniBlueprint available?',
        a: 'UniBlueprint is live across Ireland. Campus Connect features are available at specific Irish universities and colleges — we are expanding throughout September 2026. Course Connect and all career services are available to every user regardless of location.',
      },
      {
        q: 'How do I get started?',
        a: 'Download the UniBlueprint app, create a free account in under two minutes, and you are ready. No credit card required. No subscription needed to get started.',
      },
    ],
  },
  {
    category: 'Pricing & Subscription',
    items: [
      {
        q: 'What does Pro cost?',
        a: 'Pro costs €6.99 per month or €49.99 per year. During the September 2026 trial period all services are available at 50% off. After 30 September standard pricing applies.',
      },
      {
        q: 'What does Pro include?',
        a: 'Pro includes same-day delivery on Foundation Blueprint Premium services, access to all Elevation Blueprint services, the full Lifestyle Blueprint with exclusive partner deals, priority support, and all free tier features.',
      },
      {
        q: 'How do I subscribe to Pro?',
        a: 'Subscriptions are managed through the UniBlueprint website — not through the App Store or Google Play. When you choose to upgrade in the app you will be directed to the website to complete your subscription.',
      },
      {
        q: 'Can I cancel Pro?',
        a: 'Yes — you can cancel your Pro subscription at any time. Monthly subscribers retain Pro access until the end of the current billing period. Annual subscribers are entitled to a refund within 14 days of purchase if they have not used the service. See our Refund Policy for full details.',
      },
      {
        q: 'What is the September trial?',
        a: 'The September 2026 trial gives every UniBlueprint user access to all services at 50% off standard pricing throughout September. The trial applies automatically — no code needed. Trial pricing ends on 30 September 2026 at midnight. Standard pricing applies from 1 October 2026.',
      },
    ],
  },
  {
    category: 'Foundation Blueprint',
    items: [
      {
        q: 'What is a Campus Handler?',
        a: 'A Campus Handler is a trained reviewer on your campus who checks every Foundation Blueprint output before it reaches you. They verify the quality, accuracy, and relevance of the AI-generated foundation against a structured checklist. You never receive a raw AI output — a real person has reviewed it first.',
      },
      {
        q: 'How long does Foundation Blueprint take?',
        a: 'Standard tier is delivered within 48 hours of submission. Premium tier is delivered the same day. Submissions made after 11pm on Saturday night are delivered by end of day Monday on the Premium tier.',
      },
      {
        q: 'What do I need to submit?',
        a: 'Each service has a short input form in the app. You fill in the relevant information and submit. The more detail you provide the stronger the output. There is a minimum content threshold — very thin inputs are flagged before they enter the queue.',
      },
      {
        q: 'Can I request revisions?',
        a: 'Yes. If you are not satisfied with your output contact support through the app. Campus Handlers review outputs against a quality checklist before delivery so revision requests are uncommon — but we will always work with you to get it right.',
      },
      {
        q: 'Is my information kept confidential?',
        a: 'Yes. All information you submit is treated as confidential. Campus Handlers see only the information needed to complete your specific ticket. Your data is stored securely in compliance with GDPR. See our Privacy Policy for full details.',
      },
    ],
  },
  {
    category: 'Elevation Blueprint',
    items: [
      {
        q: 'What is a Uni Coach?',
        a: 'A Uni Coach is a verified specialist who delivers Elevation Blueprint services. They have relevant professional experience or expertise in their specialism — personal branding, mentorship, pitch coaching, portfolio, or postgrad support. They work with you directly over an engagement.',
      },
      {
        q: 'How does Mentorship Matching work?',
        a: 'Matching is always free. You fill in a profile with your field, career goals, and what you need guidance on. A Uni Coach identifies the best match from the UniBlueprint mentorship network and confirms it with you before booking. You pay only for the session itself.',
      },
      {
        q: 'How is Elevation Blueprint different from Foundation Blueprint?',
        a: 'Foundation Blueprint is career document and preparation support — CVs, cover letters, interview prep — reviewed by Campus Handlers and delivered in a defined turnaround. Elevation Blueprint is expert coaching and strategy delivered by specialist Uni Coaches over defined engagements. Both are valuable at different stages of your career journey.',
      },
    ],
  },
  {
    category: 'Lifestyle Blueprint',
    items: [
      {
        q: 'Is Mental Health & Wellbeing really always free?',
        a: 'Yes. Always. Mental Health & Wellbeing on UniBlueprint is permanently free for every user — free tier, Pro subscriber, or not yet signed up. There is no paywall, no subscription required, and no exceptions.',
      },
      {
        q: 'Which deals are available near me?',
        a: 'Lifestyle Blueprint partner deals are available nationwide with some campus-specific deals. When you open the Lifestyle Blueprint deals are filtered by relevance to your campus and location. New partners are added regularly throughout September 2026.',
      },
      {
        q: 'How do I redeem a deal?',
        a: 'Each deal card in the app shows the redemption method — show your UniBlueprint Pro badge in person, use a unique code, or follow the partner link. Instructions are shown on each deal card.',
      },
    ],
  },
  {
    category: 'Campus Connect',
    items: [
      {
        q: 'Is Campus Connect free?',
        a: 'Yes. Campus Connect is free for all UniBlueprint users — no Pro subscription required.',
      },
      {
        q: 'Can I self-promote on Campus Connect?',
        a: 'No. Campus Connect is a community space — not an advertising board. Posts promoting businesses, services, or external opportunities will be removed. Use the Advertisement Board instead — it is the dedicated space for listings and opportunities.',
      },
      {
        q: 'Is Campus Connect moderated?',
        a: 'Yes. Campus Connect has community guidelines and automated moderation. Posts are checked before going live for new accounts. Three flags from different users within 24 hours auto-hides a post for Operations review.',
      },
    ],
  },
  {
    category: 'Course Connect',
    items: [
      {
        q: 'Is Course Connect free?',
        a: 'Yes. Course Connect is free for all UniBlueprint users.',
      },
      {
        q: 'Who can I connect with on Course Connect?',
        a: 'Any UniBlueprint user who has made their profile public. You can search by university, course, year, skills, and what they are open to — collaboration, networking, or mentorship. Course Connect covers every Irish university and college.',
      },
    ],
  },
  {
    category: 'Handlers & Coaches',
    items: [
      {
        q: 'How do I become a Campus Handler?',
        a: 'You must be currently enrolled at an Irish university or college. Apply at uniblueprint.com/join. Applications for September 2026 are open now.',
      },
      {
        q: 'How much do Campus Handlers earn?',
        a: 'Handlers earn per completed ticket. Exact rates are confirmed during onboarding. Active Handlers also receive free Pro access for the duration of their active status.',
      },
      {
        q: 'How do I become a Uni Coach?',
        a: 'Apply at uniblueprint.com/join. You need relevant professional experience or expertise in one or more Elevation Blueprint service areas. Applications are reviewed by the UniBlueprint team.',
      },
    ],
  },
  {
    category: 'Technical',
    items: [
      {
        q: 'What devices does UniBlueprint work on?',
        a: 'UniBlueprint is available on iOS and Android. The website works on all modern browsers on desktop and mobile.',
      },
      {
        q: 'I am having trouble with my account — what do I do?',
        a: 'Contact support through the app or via the contact form at uniblueprint.com/contact. We typically respond within 2 business days.',
      },
      {
        q: 'I subscribed on the website but my app is not showing Pro — what do I do?',
        a: 'Sign out and sign back in to the app. Your Pro status should update immediately. If not contact support with your email address and we will resolve it within 24 hours.',
      },
    ],
  },
  {
    category: 'September Trial',
    items: [
      {
        q: 'What exactly is the September trial?',
        a: 'Every UniBlueprint service is available at 50% off standard pricing throughout September 2026. The discount is applied automatically — no code needed. It applies to all Foundation Blueprint and Elevation Blueprint services and to the Pro subscription itself.',
      },
      {
        q: 'When does the September trial end?',
        a: 'The trial ends on 30 September 2026 at midnight Irish time. Standard pricing applies from 1 October 2026.',
      },
      {
        q: 'Does the September trial apply to Pro?',
        a: 'Yes. Pro is available at 50% off during September. After 30 September standard pricing of €6.99 per month or €49.99 per year applies.',
      },
      {
        q: 'Do I need a code?',
        a: 'No. The discount is applied automatically to every service and subscription during September 2026. Just sign up and use the platform.',
      },
    ],
  },
]

// Flat list for JSON-LD and search
const ALL_FAQS = FAQ_CATEGORIES.flatMap(c => c.items)

// ─── Sub-components ────────────────────────────────────────────────────────────

function AccordionItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const triggerId = useId()
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: '12px',
      boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
      overflow: 'hidden',
    }}>
      <button
        id={triggerId}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        data-accordion-trigger
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '16px',
          padding: '20px 24px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '15px', fontWeight: '500', color: '#1E3A5F',
        }}>
          {question}
        </span>
        <ChevronDown
          size={18} color="#6B7280" aria-hidden="true"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease' }}
        />
      </button>
      <div id={panelId} role="region" aria-labelledby={triggerId} hidden={!open}>
        <div style={{ padding: '0 24px 20px', borderTop: '1px solid rgba(30,58,95,0.08)' }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px', color: '#6B7280',
            lineHeight: 1.7, paddingTop: '16px',
          }}>
            {answer}
          </p>
        </div>
      </div>
    </div>
  )
}

function AccordionGroup({ children }) {
  const groupRef = useRef(null)
  function handleKeyDown(e) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    const triggers = Array.from(groupRef.current?.querySelectorAll('[data-accordion-trigger]') || [])
    const idx = triggers.indexOf(document.activeElement)
    if (idx === -1) return
    e.preventDefault()
    if (e.key === 'ArrowDown') triggers[(idx + 1) % triggers.length]?.focus()
    else triggers[(idx - 1 + triggers.length) % triggers.length]?.focus()
  }
  return <div ref={groupRef} onKeyDown={handleKeyDown}>{children}</div>
}

// ─── FAQsPage ──────────────────────────────────────────────────────────────────

export default function FAQsPage() {
  const [query, setQuery] = useState('')

  // Build JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: ALL_FAQS.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }

  // Filter by search query
  const filtered = useMemo(() => {
    const lower = query.toLowerCase().trim()
    if (!lower) return FAQ_CATEGORIES
    return FAQ_CATEGORIES
      .map(cat => ({
        ...cat,
        items: cat.items.filter(
          ({ q, a }) =>
            q.toLowerCase().includes(lower) || a.toLowerCase().includes(lower)
        ),
      }))
      .filter(cat => cat.items.length > 0)
  }, [query])

  const totalVisible = filtered.reduce((n, c) => n + c.items.length, 0)

  return (
    <>
      <Helmet>
        <title>FAQs | UniBlueprint</title>
        <meta
          name="description"
          content="Answers to the most common questions about UniBlueprint — pricing, services, Campus Handlers, Uni Coaches, and more."
        />
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '48px', color: '#1E3A5F' }}>
          Frequently Asked Questions
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '18px', color: '#6B7280',
          margin: '12px auto 0', maxWidth: '520px', lineHeight: 1.6,
        }}>
          Everything you need to know about UniBlueprint.
        </p>

        {/* Search */}
        <div style={{
          maxWidth: '560px', margin: '32px auto 0',
          position: 'relative',
        }}>
          <Search
            size={18} color="#9CA3AF"
            style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search FAQs..."
            aria-label="Search frequently asked questions"
            style={{
              width: '100%', height: '52px',
              border: '1.5px solid rgba(30,58,95,0.15)',
              borderRadius: '10px',
              paddingLeft: '44px', paddingRight: '16px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '15px', color: '#1E3A5F',
              background: '#FFFFFF', outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={e => { e.target.style.borderColor = '#1E3A5F'; e.target.style.boxShadow = '0 0 0 3px rgba(30,58,95,0.1)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(30,58,95,0.15)'; e.target.style.boxShadow = 'none' }}
          />
        </div>
      </section>

      {/* ── FAQ ACCORDION ─────────────────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '80px 24px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>

          {/* No results */}
          {totalVisible === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '22px', color: '#1E3A5F',
              }}>
                No FAQs match your search
              </p>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px', color: '#6B7280',
                marginTop: '8px',
              }}>
                Try a different search, or{' '}
                <Link
                  to="/contact"
                  style={{ color: '#1E3A5F', fontWeight: '600', textDecoration: 'none' }}
                >
                  contact us directly
                </Link>
                .
              </p>
            </div>
          )}

          {/* FAQ categories */}
          {filtered.map(cat => (
            <div key={cat.category} style={{ marginBottom: '48px' }}>
              <h2 style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '24px', color: '#1E3A5F',
                marginBottom: '20px',
              }}>
                {cat.category}
              </h2>
              <AccordionGroup>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {cat.items.map(({ q, a }) => (
                    <AccordionItem key={q} question={q} answer={a} />
                  ))}
                </div>
              </AccordionGroup>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section style={{ background: '#1E3A5F', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#F5F0E8' }}>
          Still have questions?
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: 'rgba(245,240,232,0.7)', marginTop: '12px' }}>
          Our team responds within 2 business days.
        </p>
        <Link
          to="/contact"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            height: '52px', padding: '0 36px',
            background: '#F5F0E8', color: '#1E3A5F',
            borderRadius: '8px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
            textDecoration: 'none', marginTop: '28px',
          }}
        >
          Contact us
        </Link>
      </section>
    </>
  )
}
