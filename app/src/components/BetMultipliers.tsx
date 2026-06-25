/* ═══════════════════════════════════════════════════════════════
   BetMultipliers — ½ / 2× / MAX quick multiplier buttons
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  betAmount: string | number
  onSet: (val: any) => void
  balance?: number | null
  min?: number
  decimals?: number
}

export default function BetMultipliers({ betAmount, onSet, balance, min = 0.001, decimals = 4 }: Props) {
  const current = typeof betAmount === 'string' ? parseFloat(betAmount) || 0 : betAmount
  const half = Math.max(current / 2, min)
  const double = balance != null ? Math.min(current * 2, balance) : current * 2
  const max = balance != null ? Math.max(balance, min) : current * 2
  const isString = typeof betAmount === 'string'

  const set = (val: number) => {
    onSet(isString ? val.toFixed(decimals) : val)
  }

  return (
    <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
      <button className="chip" onClick={() => set(half)} style={{ flex: 1, fontSize: 10 }}>
        ½
      </button>
      <button className="chip" onClick={() => set(double)} style={{ flex: 1, fontSize: 10 }}>
        2×
      </button>
      <button className="chip" onClick={() => set(max)} style={{ flex: 1, fontSize: 10 }}>
        MAX
      </button>
    </div>
  )
}
