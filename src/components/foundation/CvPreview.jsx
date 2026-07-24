const DEFAULT_ORDER = ['summary', 'experience', 'education', 'projects', 'skills', 'achievements']

export default function CvPreview({ cvDoc }) {
  const gen = cvDoc?.generated
  const input = cvDoc?.input
  if (!gen || !input) return null

  const p = input.personal_info || {}
  const order = gen.section_order?.length ? gen.section_order : DEFAULT_ORDER

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
          fontFamily: "'DM Sans', sans-serif", color: '#1E3A5F', lineHeight: 1.55,
        }}
      >
        <header style={{ marginBottom: '20px', borderBottom: '2px solid #1E3A5F', paddingBottom: '14px' }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '26px', margin: 0 }}>{p.full_name}</h1>
          <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '6px' }}>
            {[p.email, p.phone, p.location, p.linkedin_url, p.portfolio_url].filter(Boolean).join('  ·  ')}
          </p>
        </header>

        {gen.professional_summary && (
          <Section title="Profile"><p style={bodyText}>{gen.professional_summary}</p></Section>
        )}

        {order.map((key) => {
          if (key === 'summary') return null
          if (key === 'experience' && gen.experience_section?.length) {
            return (
              <Section key={key} title="Experience">
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
              <Section key={key} title="Education">
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
            return <Section key={key} title="Projects"><ul style={bulletList}>{gen.projects_section.map((pr, i) => <li key={i} style={bodyText}>{pr}</li>)}</ul></Section>
          }
          if (key === 'skills' && gen.skills_section) {
            const s = gen.skills_section
            return (
              <Section key={key} title="Skills">
                {s.technical?.length > 0 && <p style={bodyText}><b>Technical:</b> {s.technical.join(', ')}</p>}
                {s.tools?.length > 0 && <p style={bodyText}><b>Tools:</b> {s.tools.join(', ')}</p>}
                {s.soft?.length > 0 && <p style={bodyText}><b>Soft skills:</b> {s.soft.join(', ')}</p>}
                {s.languages?.length > 0 && <p style={bodyText}><b>Languages:</b> {s.languages.join(', ')}</p>}
              </Section>
            )
          }
          if (key === 'achievements' && gen.achievements_section?.length) {
            return <Section key={key} title="Achievements & Extras"><ul style={bulletList}>{gen.achievements_section.map((a, i) => <li key={i} style={bodyText}>{a}</li>)}</ul></Section>
          }
          return null
        })}
      </div>
    </>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1E3A5F', marginBottom: '8px' }}>{title}</h2>
      {children}
    </div>
  )
}

const bodyText = { fontSize: '13.5px', color: '#374151', margin: '2px 0' }
const bulletList = { margin: '4px 0 0', paddingLeft: '18px' }
