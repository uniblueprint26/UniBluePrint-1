const DEFAULT_ORDER = ['summary', 'experience', 'education', 'projects', 'skills', 'achievements']

// Two visual themes, one DOM structure. Both are ATS-safe by construction —
// single flow-layout column, no tables, no CSS columns, contact as body text —
// because they share the exact same markup and differ only in style objects.
// If this structure ever changes, supabase/functions/_shared/atsFormat.ts
// documents the same guarantees and must change with it.
//
// classic_ats — serif, traditional, conservative. For finance/law/healthcare/
// government, where the research says conservative templates are expected.
// modern — sans-serif, tighter, accent-bar section headings. Acceptable for
// tech/startup/creative per the same research.
const THEMES = {
  classic_ats: {
    name: { fontFamily: "'DM Serif Display', serif", fontSize: '26px', margin: 0, letterSpacing: 0 },
    header: { marginBottom: '20px', borderBottom: '2px solid #1E3A5F', paddingBottom: '14px' },
    sectionTitle: {
      fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 700,
      letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1E3A5F', marginBottom: '8px',
    },
    body: { fontFamily: "'DM Sans', sans-serif", color: '#1E3A5F', lineHeight: 1.55 },
  },
  modern: {
    name: { fontFamily: "'DM Sans', sans-serif", fontSize: '24px', fontWeight: 700, margin: 0, letterSpacing: '-0.01em' },
    header: { marginBottom: '22px', borderBottom: '1px solid rgba(30,58,95,0.25)', paddingBottom: '16px' },
    sectionTitle: {
      fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 700,
      letterSpacing: '0.05em', textTransform: 'uppercase', color: '#1E3A5F', marginBottom: '10px',
      borderLeft: '3px solid #1E3A5F', paddingLeft: '8px',
    },
    body: { fontFamily: "'DM Sans', sans-serif", color: '#1F2937', lineHeight: 1.6 },
  },
}

export default function CvPreview({ cvDoc }) {
  const gen = cvDoc?.generated
  const input = cvDoc?.input
  if (!gen || !input) return null

  const p = input.personal_info || {}
  const order = gen.section_order?.length ? gen.section_order : DEFAULT_ORDER
  const theme = THEMES[cvDoc?.style] || THEMES.classic_ats

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #cv-print-area, #cv-print-area * { visibility: visible; }
          #cv-print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 0; box-shadow: none; }
        }
      `}</style>
      <div
        id="cv-print-area"
        style={{
          background: '#FFFFFF', borderRadius: '12px', boxShadow: '0px 2px 12px rgba(30,58,95,0.08)',
          padding: '48px', maxWidth: '720px', margin: '0 auto',
          ...theme.body,
        }}
      >
        <header style={theme.header}>
          <h1 style={theme.name}>{p.full_name}</h1>
          <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '6px' }}>
            {[p.email, p.phone, p.location, p.linkedin_url, p.portfolio_url].filter(Boolean).join('  ·  ')}
          </p>
        </header>

        {gen.professional_summary && (
          <Section title="Profile" theme={theme}><p style={bodyText}>{gen.professional_summary}</p></Section>
        )}

        {order.map((key) => {
          if (key === 'summary') return null
          if (key === 'experience' && gen.experience_section?.length) {
            return (
              <Section key={key} title="Experience" theme={theme}>
                {gen.experience_section.map((role, i) => (
                  <div key={i} style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '14px' }}>
                      <span>{role.job_title} — {role.company}</span>
                      <span style={{ color: '#6B7280', fontWeight: 400 }}>{role.dates}</span>
                    </div>
                    <ul style={bulletList}>{role.bullets?.map((b, j) => <li key={j} style={bodyText}>{b}</li>)}</ul>
                  </div>
                ))}
              </Section>
            )
          }
          if (key === 'education' && gen.education_section?.length) {
            return (
              <Section key={key} title="Education" theme={theme}>
                {gen.education_section.map((e, i) => (
                  <div key={i} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '14px' }}>
                      <span>{e.degree}, {e.institution}</span>
                      <span style={{ color: '#6B7280', fontWeight: 400 }}>{e.year}</span>
                    </div>
                    {e.details?.length > 0 && <ul style={bulletList}>{e.details.map((d, j) => <li key={j} style={bodyText}>{d}</li>)}</ul>}
                  </div>
                ))}
              </Section>
            )
          }
          if (key === 'projects' && gen.projects_section?.length) {
            return <Section key={key} title="Projects" theme={theme}><ul style={bulletList}>{gen.projects_section.map((pr, i) => <li key={i} style={bodyText}>{pr}</li>)}</ul></Section>
          }
          if (key === 'skills' && gen.skills_section) {
            const s = gen.skills_section
            return (
              <Section key={key} title="Skills" theme={theme}>
                {s.technical?.length > 0 && <p style={bodyText}><b>Technical:</b> {s.technical.join(', ')}</p>}
                {s.tools?.length > 0 && <p style={bodyText}><b>Tools:</b> {s.tools.join(', ')}</p>}
                {s.soft?.length > 0 && <p style={bodyText}><b>Soft skills:</b> {s.soft.join(', ')}</p>}
                {s.languages?.length > 0 && <p style={bodyText}><b>Languages:</b> {s.languages.join(', ')}</p>}
              </Section>
            )
          }
          if (key === 'achievements' && gen.achievements_section?.length) {
            return <Section key={key} title="Achievements & Extras" theme={theme}><ul style={bulletList}>{gen.achievements_section.map((a, i) => <li key={i} style={bodyText}>{a}</li>)}</ul></Section>
          }
          return null
        })}
      </div>
    </>
  )
}

function Section({ title, theme, children }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <h2 style={theme.sectionTitle}>{title}</h2>
      {children}
    </div>
  )
}

const bodyText = { fontSize: '13.5px', color: '#374151', margin: '2px 0' }
const bulletList = { margin: '4px 0 0', paddingLeft: '18px' }
