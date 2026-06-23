/* ═══════════════════════════════════════════════════════════════
   ChainSwitcher — ETH / SOL / TON chain selector with icons
   Persisted to localStorage, used for deposit/withdraw context
   ═══════════════════════════════════════════════════════════════ */

export type Chain = 'evm' | 'sol' | 'ton'

const CHAINS: { id: Chain; icon: string; symbol: string; color: string }[] = [
  { id: 'evm', icon: '◆', symbol: 'ETH', color: '#627EEA' },
  { id: 'sol', icon: '◎', symbol: 'SOL', color: '#14F195' },
  { id: 'ton', icon: '💎', symbol: 'TON', color: '#0098EA' },
]

const STORAGE_KEY = 'casino_chain'

export function getActiveChain(): Chain {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && ['evm', 'sol', 'ton'].includes(stored)) return stored as Chain
  } catch {}
  return 'evm'
}

interface ChainSwitcherProps {
  value: Chain
  onChange: (chain: Chain) => void
}

export default function ChainSwitcher({ value, onChange }: ChainSwitcherProps) {
  return (
    <div style={{
      display: 'flex',
      gap: 4,
      background: 'var(--surface)',
      borderRadius: 8,
      padding: 3,
      border: '1px solid var(--border)',
    }}>
      {CHAINS.map(c => {
        const active = c.id === value
        return (
          <button
            key={c.id}
            onClick={() => {
              onChange(c.id)
              try { localStorage.setItem(STORAGE_KEY, c.id) } catch {}
            }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: '6px 0',
              borderRadius: 6,
              border: 'none',
              fontSize: 11,
              fontWeight: active ? 800 : 500,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              color: active ? 'var(--bg)' : c.color,
              background: active ? c.color : 'transparent',
            }}
          >
            <span style={{ fontSize: 13 }}>{c.icon}</span>
            <span>{c.symbol}</span>
          </button>
        )
      })}
    </div>
  )
}
