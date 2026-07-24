function colorFor(score) {
  if (score >= 80) return '#16A34A'
  if (score >= 60) return '#1E3A5F'
  return '#DC2626'
}

export default function ScoreGauge({ label, score, large }) {
  if (score === null || score === undefined) {
    return (
      <div style={{ minWidth: large ? '120px' : '100px' }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#9CA3AF' }}>{label}</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#9CA3AF', marginTop: '4px' }}>Not scored</div>
      </div>
    )
  }
  const color = colorFor(score)
  return (
    <div style={{ minWidth: large ? '120px' : '100px' }}>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B7280' }}>{label}</div>
      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: large ? '34px' : '22px', color, lineHeight: 1.2 }}>{score}</div>
      <div style={{ width: '100%', height: '5px', borderRadius: '3px', background: 'rgba(30,58,95,0.1)', marginTop: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(100, Math.max(0, score))}%`, height: '100%', background: color, borderRadius: '3px' }} />
      </div>
    </div>
  )
}
