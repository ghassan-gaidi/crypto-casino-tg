/* ═══════════════════════════════════════════════════════════════
   ChainSwitcher — ETH / SOL / TON chain selector with icons
   Persisted to localStorage, used for deposit/withdraw context
   ═══════════════════════════════════════════════════════════════ */

export type Chain = 'evm' | 'sol' | 'ton'

const CHAINS: { id: Chain; symbol: string; color: string }[] = [
  { id: 'evm', symbol: 'ETH', color: '#627EEA' },
  { id: 'sol', symbol: 'SOL', color: '#14F195' },
  { id: 'ton', symbol: 'TON', color: '#0098EA' },
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

function ChainIcon({ chain }: { chain: Chain }) {
  switch (chain) {
    case 'evm':
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ display: 'block' }}>
          <path d="M6 0L11 3V9L6 12L1 9V3L6 0Z" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <path d="M6 3L8 4.5V7.5L6 9L4 7.5V4.5L6 3Z" fill="currentColor" opacity="0.5" />
        </svg>
      )
    case 'sol':
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ display: 'block' }}>
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="6" cy="6" r="1.5" fill="currentColor" />
        </svg>
      )
    case 'ton':
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ display: 'block' }}>
          <path d="M6 0L11 6L6 12L1 6L6 0Z" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <path d="M6 2L9.5 6H8L6 9L4 6H2.5L6 2Z" fill="currentColor" opacity="0.5" />
        </svg>
      )
  }
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
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <ChainIcon chain={c.id} />
            </span>
            <span>{c.symbol}</span>
          </button>
        )
      })}
    </div>
  )
}
