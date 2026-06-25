/* ═══════════════════════════════════════════════════════════════
   GameLiveBets — Real-time feed of recent bets from all players
   ═══════════════════════════════════════════════════════════════ */

import { useState, useEffect } from 'react'

interface Bet {
  id: string
  user_id: number
  game: string
  bet_amount: number
  payout: number
  player_won: boolean
  created_at: string
}

const GAME_ICONS: Record<string, string> = {
  dice: '◆', coinflip: '◑', crash: '↗', mines: '⛏',
  plinko: '▼', slots: '≡', roulette: '◎', limbo: '↑', jackpot: '★'
}

export default function GameLiveBets() {
  const [bets, setBets] = useState<Bet[]>([])

  useEffect(() => {
    const fetchBets = () => {
      fetch('/api/bets/recent')
        .then(r => r.json())
        .then(d => setBets(d.bets || []))
        .catch(() => {})
    }
    fetchBets()
    const interval = setInterval(fetchBets, 5000)
    return () => clearInterval(interval)
  }, [])

  if (bets.length === 0) return null

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{
        fontSize: 9, fontWeight: 600, letterSpacing: 1.5,
        color: 'var(--text-dim)', marginBottom: 6,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: 'var(--green)',
          boxShadow: '0 0 6px rgba(0,255,136,.5)',
          animation: 'glow-pulse 2s infinite',
        }} />
        LIVE BETS
      </div>
      <div style={{
        border: '1px solid var(--border)', background: 'var(--surface)',
        maxHeight: 160, overflowY: 'auto',
      }}>
        {bets.map(bet => (
          <div key={bet.id} style={{
            display: 'flex', alignItems: 'center', padding: '5px 10px',
            borderBottom: '1px solid var(--border)', fontSize: 11, gap: 6,
          }}>
            <span style={{ fontSize: 12, width: 18, textAlign: 'center' }}>
              {GAME_ICONS[bet.game] || '●'}
            </span>
            <span style={{ color: 'var(--white)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Player_{String(bet.user_id).slice(-4)}
            </span>
            <span style={{ fontFamily: 'var(--font)', color: 'var(--text)', fontSize: 10 }}>
              {bet.bet_amount.toFixed(4)}
            </span>
            <span style={{
              fontFamily: 'var(--font)', fontWeight: 700, fontSize: 10,
              color: bet.player_won ? 'var(--green)' : 'var(--red)',
              minWidth: 52, textAlign: 'right',
            }}>
              {bet.player_won ? '+' : ''}{(bet.payout - bet.bet_amount).toFixed(4)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
