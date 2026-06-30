/* ═══════════════════════════════════════════════════════════════
   RecentBets — Compact recent bet list for home page
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useState } from 'react'

interface Bet {
  id: string
  game: string
  bet_amount: number
  payout: number
  player_won: boolean
  created_at: string
}

const GAME_ICONS: Record<string, string> = {
  dice: '/icons/icon-dice.svg', coinflip: '/icons/icon-coinflip.svg', crash: '/icons/icon-crash.svg',
  mines: '/icons/icon-mines.svg', plinko: '/icons/icon-plinko.svg', slots: '/icons/icon-slots.svg',
  roulette: '/icons/icon-roulette.svg', limbo: '/icons/icon-limbo.svg', jackpot: '/icons/icon-jackpot.svg'
}

const BASE = import.meta.env.VITE_API_URL || ''

interface Props {
  userId?: number
}

export default function RecentBets({ userId }: Props) {
  const [bets, setBets] = useState<Bet[]>([])

  useEffect(() => {
    if (!userId) return
    fetch(`${BASE}/api/history`, { headers: { 'x-user-id': String(userId) } })
      .then(r => r.json())
      .then(d => setBets((d.bets || []).slice(0, 5)))
      .catch(() => {})
  }, [userId])

  if (bets.length === 0) return null

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '8px 12px',
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: 2,
        color: 'var(--muted)',
        borderBottom: '1px solid var(--border)',
      }}>
        RECENT BETS
      </div>
      {bets.map(bet => (
        <div key={bet.id} style={{
          display: 'flex',
          alignItems: 'center',
          padding: '7px 12px',
          gap: 8,
          borderBottom: '1px solid var(--border)',
          fontSize: 12,
        }}>
          <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>
          <img src={GAME_ICONS[bet.game] || '/icons/icon-dice.svg'} alt={bet.game} width={16} height={16} />
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color: 'var(--text)',
            textTransform: 'uppercase',
            width: 56,
            fontSize: 10,
          }}>
            {bet.game}
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--muted)',
            fontSize: 11,
            flex: 1,
            textAlign: 'right',
          }}>
            {bet.bet_amount.toFixed(4)}
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            fontSize: 11,
            minWidth: 56,
            textAlign: 'right',
            color: bet.player_won ? 'var(--green)' : 'var(--red)',
          }}>
            {bet.player_won ? '+' : ''}{(bet.payout - bet.bet_amount).toFixed(4)}
          </span>
        </div>
      ))}
    </div>
  )
}
