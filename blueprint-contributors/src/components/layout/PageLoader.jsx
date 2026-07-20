import UBPLogo from '../ui/UBPLogo'

export default function PageLoader() {
  return (
    <div
      aria-label="Loading"
      aria-live="polite"
      style={{
        position: 'fixed', inset: 0,
        background: '#F5F0E8',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '24px',
        zIndex: 9999,
      }}
    >
      <UBPLogo height={64} />
      <div
        style={{
          width: '40px', height: '40px',
          border: '3px solid rgba(30,58,95,0.15)',
          borderTopColor: '#1E3A5F',
          borderRadius: '50%',
          animation: 'spin 700ms linear infinite',
        }}
      />
      <style>{`@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }`}</style>
    </div>
  )
}
