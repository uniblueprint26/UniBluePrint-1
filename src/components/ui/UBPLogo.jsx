export default function UBPLogo({ height = 36, inverted = false, className = '' }) {
  return (
    <img
      src="/src/assets/ubp-logo.png"
      alt="UniBlueprint logo"
      height={height}
      style={{
        height: `${height}px`,
        width: 'auto',
        display: 'block',
        filter: inverted ? 'brightness(0) invert(1)' : 'none',
        objectFit: 'contain'
      }}
      className={className}
    />
  )
}
