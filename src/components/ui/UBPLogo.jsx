export default function UBPLogo({ height = 36, color = '#1E3A5F' }) {
  const width = Math.round(height * 3.0)
  return (
    <svg
      height={height}
      width={width}
      viewBox="0 0 300 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      overflow="visible"
    >
      <text
        x="150"
        y="72"
        textAnchor="middle"
        fontFamily="'DM Serif Display', serif"
        fontSize="68"
        fill={color}
        style={{ fontFamily: "'DM Serif Display', serif" }}
      >
        UBP
      </text>
      <rect x="28" y="83" width="244" height="2" fill={color} />
    </svg>
  )
}
