import { BookMarked } from 'lucide-react'

export default function BenchmarkNote({ sources }) {
  if (!sources || sources.length === 0) return null
  const unique = Array.from(new Map(sources.map((s) => [s.source_name, s])).values())

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 14px', background: 'rgba(30,58,95,0.05)', borderRadius: '8px', marginBottom: '4px' }}>
      <BookMarked size={14} color="#1E3A5F" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B7280', lineHeight: 1.6 }}>
        Benchmarked against {sources.length} real example{sources.length !== 1 ? 's' : ''} from{' '}
        {unique.map((s, i) => (
          <span key={s.source_name}>
            <a href={s.source_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1E3A5F', textDecoration: 'underline' }}>{s.source_name}</a>
            {i < unique.length - 1 ? (i === unique.length - 2 ? ' and ' : ', ') : ''}
          </span>
        ))}.
      </p>
    </div>
  )
}
