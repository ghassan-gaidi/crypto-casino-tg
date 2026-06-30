import { useState, useCallback } from 'react'
import { hapticTap } from '../haptic'

interface ShareWinProps {
  game: string
  payout: number
  multiplier: number
  betAmount: number
}

const GAME_NAMES: Record<string, string> = {
  dice: 'DICE', coinflip: 'COINFLIP', crash: 'CRASH', mines: 'MINES',
  plinko: 'PLINKO', slots: 'SLOTS', roulette: 'ROULETTE', limbo: 'LIMBO', jackpot: 'JACKPOT'
}

export default function ShareWin({ game, payout, multiplier, betAmount }: ShareWinProps) {
  const [copied, setCopied] = useState(false)

  const share = useCallback(() => {
    hapticTap()
    const name = GAME_NAMES[game] || 'CASINO'
    const text = `Just won ${payout.toFixed(4)} on ${name}! (${multiplier}x • bet: ${betAmount.toFixed(4)})\n\nPlay now: `
    const url = `https://t.me/share/url?url=${encodeURIComponent('https://crypto-casino-tg.vercel.app')}&text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }, [game, payout, multiplier, betAmount])

  const copyLink = useCallback(() => {
    hapticTap()
    const text = `I just won on PICKR! Pick. Play. Prove.`
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [])

  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
      <button
        onClick={share}
        className="btn btn-cyan"
        style={{ flex: 1, fontSize: 11, padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        SHARE WIN
      </button>
      <button
        onClick={copyLink}
        className="btn btn-ghost"
        style={{ fontSize: 11, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {copied ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00FF88" strokeWidth="2.5" strokeLinecap="square">
            <polyline points="20,6 9,17 4,12" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
            <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
    </div>
  )
}
