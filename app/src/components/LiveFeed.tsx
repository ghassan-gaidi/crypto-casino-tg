/* ═══════════════════════════════════════════════════════════════
   LIVE FEED — Simulated real-time winner feed for social proof FOMO
   ═══════════════════════════════════════════════════════════════ */

import { useState, useEffect, useRef } from 'react'

const GAMES = ['Crash', 'Dice', 'Slots', 'Coinflip', 'Mines', 'Plinko', 'Wheel', 'Hi-Lo', 'Tower']
const NAMES = [
  '@whale_420', '@sol_king', '@btc_maxi', '@eth_dreamer', '@lucky_doge',
  '@crypto_fox', '@degen_trader', '@moon_hunter', '@diamond_hands', '@yield_fiend',
  '@defi_ninja', '@alt_coiner', '@gem_seeker', '@hodl_4life', '@pump_it',
]

const CHAINS = [
  { symbol: 'ETH', color: '#627EEA' },
  { symbol: 'SOL', color: '#14F195' },
  { symbol: 'TON', color: '#0098EA' },
]

function randomWin(): { name: string; amount: number; chain: typeof CHAINS[0]; game: string } {
  const name = NAMES[Math.floor(Math.random() * NAMES.length)]!
  const chain = CHAINS[Math.floor(Math.random() * CHAINS.length)]!
  const game = GAMES[Math.floor(Math.random() * GAMES.length)]!

  // Skew toward smaller amounts (realistic)
  const r = Math.random()
  const amount = r < 0.6 ? +(Math.random() * 0.05 + 0.001).toFixed(4) :
                r < 0.9 ? +(Math.random() * 0.5 + 0.01).toFixed(3) :
                +(Math.random() * 2 + 0.1).toFixed(3)

  return { name, amount, chain, game }
}

interface LiveFeedProps {
  maxItems?: number
}

export default function LiveFeed({ maxItems = 8 }: LiveFeedProps) {
  const [items, setItems] = useState<{ id: number; data: ReturnType<typeof randomWin> }[]>([])
  const idRef = useRef(0)

  useEffect(() => {
    // Add initial items
    const initial = Array.from({ length: 4 }, () => ({
      id: idRef.current++,
      data: randomWin(),
    }))
    setItems(initial)

    // Add new items periodically
    const interval = setInterval(() => {
      setItems(prev => {
        const newItem = { id: idRef.current++, data: randomWin() }
        return [newItem, ...prev].slice(0, maxItems)
      })
    }, 3000 + Math.random() * 4000) // 3-7 seconds

    return () => clearInterval(interval)
  }, [maxItems])

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      background: 'var(--surface)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '8px 12px',
        borderBottom: '1px solid var(--border)',
        fontSize: '9px', fontWeight: 600, letterSpacing: '1.5px',
        textTransform: 'uppercase' as const, color: 'var(--green)',
      }}>
        <span style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: 'var(--green)',
          animation: 'glow-pulse 2s infinite',
          boxShadow: '0 0 6px rgba(0,255,136,.5)',
        }} />
        LIVE WINS
      </div>

      {/* Feed Items */}
      <div className="live-feed" style={{ padding: '4px 12px' }}>
        {items.map((item) => (
          <div key={item.id} className="feed-item">
            <span style={{ color: 'var(--white)' }}>{item.data.name}</span>
            {' won '}
            <span style={{ color: item.data.chain.color, fontWeight: 600 }}>
              {item.data.amount} {item.data.chain.symbol}
            </span>
            {' on '}
            <span style={{ color: 'var(--text)' }}>{item.data.game}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
