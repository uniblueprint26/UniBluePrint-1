export default function UBPLogo({ height = 36, color = '#1E3A5F' }) {
  const width = Math.round(height * 1.15)
  return (
    <svg
      height={height}
      width={width}
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <text
        x="60"
        y="68"
        textAnchor="middle"
        fontFamily="'Playfair Display', serif"
        fontWeight="700"
        fontSize="58"
        letterSpacing="2"
        fill={color}
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        UBP
      </text>
      <rect x="10" y="80" width="100" height="3" fill={color} />
    </svg>
  )
}
