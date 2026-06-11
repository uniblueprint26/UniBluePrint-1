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
        q: 'What is Uniblueprint?',
        a: 'TODO: Answer — Uniblueprint is an all-in-one platform for Irish students and young people. It provides CV support, career coaching, campus community, course collaboration, lifestyle deals, and budgeting tools in one place.',
      },
      {
        q: 'Is Uniblueprint free to use?',
        a: 'TODO: Answer — Yes. Creating an account is free. Campus Connect, Course Connect, and Mental Health resources are free for all users. Foundation and Elevation Blueprint services require a Pro subscription plus per-service fees.',
      },
      {
        q: 'When does Uniblueprint launch?',
        a: 'TODO: Answer — Uniblueprint launches at Irish universities and colleges during freshers week in September 2026.',
      },
      {
        q: 'Which universities are included at launch?',
        a: 'TODO: Answer — Uniblueprint launches across Irish universities including UCD, TCD, UCC, DCU, University of Galway, UL, Maynooth, and TUD. More campuses will be added after launch.',
      },
      {
        q: 'Do I need to be a student to use Uniblueprint?',
        a: 'TODO: Answer — Uniblueprint is designed for students and recent graduates. Some services are open to young people who have recently completed education.',
      },
    ],
  },
  {
    category: 'Pricing & Subscription',
    items: [
      {
        q: 'What does Pro cost?',
        a: 'TODO: Answer — Pro is €6.99/month or €49.99/year during the September trial. Standard prices resume from 1 October 2026: €13.98/month or €99.98/year.',
      },
      {
        q: 'What is included in the September trial?',
        a: 'TODO: Answer — During September 2026, all Foundation and Elevation Blueprint services are 50% off, and the Pro subscription is 50% off.',
      },
      {
        q: 'Can I cancel Pro at any time?',
        a: 'TODO: Answer — Yes. Cancel any time before your next billing date and your Pro access continues until the end of the billing period.',
      },
      {
        q: 'Does Pro include unlimited service use?',
        a: 'TODO: Answer — Pro unlocks access to purchase services at listed prices. Services are pay-per-use within the subscription — Pro is the access key, not an unlimited bundle.',
      },
      {
        q: 'What payment methods are accepted?',
        a: 'TODO: Answer — Card, Apple Pay, and Google Pay. Payments are processed securely via Stripe.',
      },
    ],
  },
  {
    category: 'Foundation Blueprint',
    items: [
      {
        q: 'What is the Foundation Blueprint?',
        a: 'TODO: Answer — The Foundation Blueprint is the academic and career support pillar. It includes CV optimisation, LinkedIn optimisation, cover letter assistance, application form support, interview preparation, job search support, CAO services, and scholarship support — all reviewed by trained Campus Handlers.',
      },
      {
        q: 'How long does delivery take?',
        a: 'TODO: Answer — Standard delivery is within 48 hours. Premium is same-day.',
      },
      {
        q: 'Who reviews my submission?',
        a: 'TODO: Answer — Every Foundation Blueprint output is reviewed by a trained Campus Handler before delivery. Handlers are students who have been trained and onboarded by the Uniblueprint team.',
      },
      {
        q: 'What if I am not happy with the output?',
        a: 'TODO: Answer — One revision request is included with Standard. Two with Premium. If the output does not meet our quality standard, raise it within 48 hours of delivery — see the Refund Policy for details.',
      },
      {
        q: 'Can I get a same-day turnaround?',
        a: 'TODO: Answer — Yes. Premium tier includes same-day delivery, subject to Handler availability.',
      },
    ],
  },
  {
    category: 'Elevation Blueprint',
    items: [
      {
        q: 'What is the Elevation Blueprint?',
        a: 'TODO: Answer — The Elevation Blueprint is the career coaching and professional development pillar. Services include personal branding, network assistance, portfolio building, mentorship matching, pitch coaching, and postgraduate application support — delivered by specialist Uni Coaches.',
      },
      {
        q: 'Who are Uni Coaches?',
        a: 'TODO: Answer — Uni Coaches are professionals, postgraduates, and specialists who have been vetted and onboarded by the Uniblueprint team. Each Coach brings real expertise in their area.',
      },
      {
        q: 'Is mentorship matching really free?',
        a: 'TODO: Answer — Yes. Matching you to a relevant Uni Coach is always free. Sessions with your Coach are charged at the listed service price.',
      },
      {
        q: 'How does the Elevation engagement model work?',
        a: 'TODO: Answer — Standard includes one session or deliverable engagement plus one revision. Premium includes a session plus a follow-up review or written notes, priority Coach assignment, and two revisions.',
      },
    ],
  },
  {
    category: 'Campus Connect & Course Connect',
    items: [
      {
        q: 'Is Campus Connect free?',
        a: 'TODO: Answer — Yes. Campus Connect is free for all Uniblueprint users. No Pro subscription required.',
      },
      {
        q: 'Is Course Connect free?',
        a: 'TODO: Answer — Yes. Course Connect is free for all Uniblueprint users.',
      },
      {
        q: 'How is the community moderated?',
        a: 'TODO: Answer — Campus Connect boards are moderated against community standards. Content that violates the standards is removed. Repeat violations result in account restrictions.',
      },
      {
        q: 'Can I connect with students at other universities?',
        a: 'TODO: Answer — Course Connect allows students studying the same course to connect across campuses. Campus Connect is campus-specific.',
      },
    ],
  },
  {
    category: 'Campus Handlers & Uni Coaches',
    items: [
      {
        q: 'How do I become a Campus Handler?',
        a: 'TODO: Answer — Apply via the Join Handler page. Applications are reviewed on a rolling basis. Handlers are onboarded ahead of the September 2026 launch.',
      },
      {
        q: 'How do I become a Uni Coach?',
        a: 'TODO: Answer — Apply via the Join Coach page. Applications are reviewed by the team. Coaches are vetted for expertise before being approved.',
      },
      {
        q: 'Are Campus Handlers paid?',
        a: 'TODO: Answer — Yes. Handlers are compensated per submission reviewed. Payment details are provided during the onboarding process.',
      },
      {
        q: 'Are Uni Coaches paid?',
        a: 'TODO: Answer — Yes. Coaches earn per engagement delivered. Rates are discussed during onboarding.',
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
        <title>FAQs | Uniblueprint</title>
        <meta
          name="description"
          content="Answers to the most common questions about Uniblueprint — pricing, services, Campus Handlers, Uni Coaches, and more."
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
          Everything you need to know about Uniblueprint.
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
