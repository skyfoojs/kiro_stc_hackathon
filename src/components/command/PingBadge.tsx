/** Ping, the Relay mascot, used only as the small logo badge (Command spec section 5). */
export default function PingBadge({ height = 44 }: { height?: number }) {
  const width = Math.round((height * 120) / 158);
  return (
    <svg viewBox="20 6 120 158" width={width} height={height} aria-hidden="true">
      <g>
        <path d="M62 -2L76 50M98 -2L84 50" stroke="#F59E0B" strokeWidth="8" fill="none" />
        <rect x="73" y="44" width="14" height="10" rx="3" fill="#CBD5E1" />
      </g>
      <g>
        <circle cx="80" cy="100" r="57" fill="none" stroke="#2563EB" strokeOpacity=".22" strokeWidth="7" />
        <circle cx="80" cy="100" r="52" fill="#F8FAFC" stroke="#2563EB" strokeWidth="5" />
      </g>
      <circle cx="80" cy="100" r="45" fill="none" stroke="#E2E8F0" strokeWidth="1.5" />
      <g>
        <rect x="46" y="72" width="68" height="44" rx="22" fill="#1E293B" />
        <ellipse cx="66" cy="93" rx="5.5" ry="7" fill="#FBBF24" />
        <ellipse cx="94" cy="93" rx="5.5" ry="7" fill="#FBBF24" />
        <path d="M71 106q9 7 18 0" fill="none" stroke="#FBBF24" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
