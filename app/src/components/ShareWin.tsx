/* ═══════════════════════════════════════════════════════════════
   ShareWin — Viral share button for Telegram after big wins
   Opens a Telegram share dialog with the win details.
   ═══════════════════════════════════════════════════════════════ */

import { useState, useCallback } from 'react'
import { hapticTap } from '../haptic'

interface ShareWinProps {
  game: string
  payout: number
  multiplier: number
  betAmount: number
}

const GAME_EMOJIS: Record<string, string> = {
  dice: '🎲',
  coinflip: '🪙',
  crash: '📈',
  mines: '💣',
  plinko: '📍',
  slots: '🎰',
  roulette: '🎡',
  limbo: '🚀',
  jackpot: '🏆',
}

export default function ShareWin({ game, payout, multiplier, betAmount }: ShareWinProps) {
  const [copied, setCopied] = useState(false)

  const share = useCallback(() => {
    hapticTap()
    const emoji = GAME_EMOJIS[game] || '🎰'
    const text = `${emoji} Just won ${payout.toFixed(4)} on ${game.toUpperCase()}! (${multiplier}x — bet: ${betAmount.toFixed(4)})\n\nPlay now: `
    const url = `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }, [game, payout, multiplier, betAmount])
 
  const copyLink = useCallback(() => {
    hapticTap()
    const text = `🎰 I just won on Pickr! Play now`
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [])

  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
      <button
        onClick={share}
        className="btn btn-primary"
        style={{ flex: 1, fontSize: 13, padding: '10px 0' }}
      >
        📤 SHARE WIN
      </button>
      <button
        onClick={copyLink}
        className="btn btn-ghost"
        style={{ fontSize: 13, padding: '10px 12px' }}
      >
        {copied ? '✓' : '🔗'}
      </button>
    </div>
  )
}
