/* ═══════════════════════════════════════════════════════════════
   HotCold — Visual streak indicator showing last 10 results
   Green dots = wins, Red dots = losses, gray = no data
   ═══════════════════════════════════════════════════════════════ */

export interface HotColdProps {
  history: boolean[]  // true = win, false = loss
  max?: number
}

export default function HotCold({ history, max = 10 }: HotColdProps) {
  const recent = history.slice(-max)
  const streak = recent.length > 0 ? recent.reduce((acc, w) => acc + (w ? 1 : -1), 0) : 0
  const isHot = streak >= 3
  const isCold = streak <= -3

  const label = isHot ? 'HOT' : isCold ? 'COLD' : ''
  const labelColor = isHot
    ? 'var(--green)'
    : isCold
      ? 'var(--red)'
      : 'var(--muted)'

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '12px',
    }}>
      {recent.length === 0 && (
        <span style={{ color: 'var(--muted)', fontSize: '11px' }}>No history</span>
      )}
      <div style={{ display: 'flex', gap: '3px' }}>
        {recent.map((won, i) => (
          <span
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: won ? 'var(--green)' : 'var(--red)',
              opacity: 0.4 + (0.6 * (i + 1)) / recent.length,
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>
      {label && (
        <span style={{
          color: labelColor,
          fontWeight: 700,
          fontSize: '10px',
          marginLeft: '2px',
          letterSpacing: '1px',
          textTransform: 'uppercase',
        }}>
          {label}
        </span>
      )}
    </div>
  )
}
