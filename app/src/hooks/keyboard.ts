/* ═══════════════════════════════════════════════════════════════
   useGameKeyboard — Keyboard shortcuts for game components
   Space = place bet, 1-4 = quick bet amounts
   Q = half bet, E = double bet, X = max bet
   ═══════════════════════════════════════════════════════════════ */

import { useEffect } from 'react'

const QUICK_BETS: string[] = ['0.001', '0.01', '0.1', '1.0']

interface UseGameKeyboardOpts {
  onBet: () => void
  onQuickBet?: (amount: string) => void
  onHalfBet?: () => void
  onDoubleBet?: () => void
  onMaxBet?: () => void
  disabled?: boolean
}

export function useGameKeyboard({ onBet, onQuickBet, onHalfBet, onDoubleBet, onMaxBet, disabled = false }: UseGameKeyboardOpts) {
  useEffect(() => {
    if (disabled) return

    const handler = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT') return

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault()
        onBet()
      } else if (onQuickBet && e.key >= '1' && e.key <= '4') {
        const idx = parseInt(e.key) - 1
        if (idx < QUICK_BETS.length) {
          onQuickBet(QUICK_BETS[idx]!)
        }
      } else if (onHalfBet && (e.key === 'q' || e.key === 'Q')) {
        onHalfBet()
      } else if (onDoubleBet && (e.key === 'e' || e.key === 'E')) {
        onDoubleBet()
      } else if (onMaxBet && (e.key === 'x' || e.key === 'X')) {
        onMaxBet()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onBet, onQuickBet, onHalfBet, onDoubleBet, onMaxBet, disabled])
}
