export default function UBPLogo({ height = 36, color = '#1E3A5F' }) {
  const width = Math.round(height * 1.1)
  return (
    <svg
      height={height}
      width={width}
      viewBox="0 0 110 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <text
        x="55"
        y="72"
        textAnchor="middle"
        fontFamily="'DM Serif Display', serif"
        fontSize="68"
        fill={color}
        style={{ fontFamily: "'DM Serif Display', serif" }}
      >
        UBP
      </text>
      <rect x="6" y="82" width="98" height="2" fill={color} />
      <rect x="6" y="90" width="98" height="2" fill={color} />
    </svg>
  )
}
