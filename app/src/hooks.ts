/* ═══════════════════════════════════════════════════════════════
   useGameFeedback — Hook that adds sound + haptic + confetti
   to any game result. Drop into any game component.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from 'react'
import { sndWin, sndBigWin, sndLose, sndClick, sndNearMiss, sndSpin } from './sounds'
import { hapticTap, hapticWin, hapticError, hapticConfirm } from './haptic'
import { confetti } from './confetti'

type GameResult = { playerWon?: boolean; safe?: boolean; payoutMultiplier?: number } | null

export function useGameFeedback(result: GameResult) {
  const prevResult = useRef(result)

  useEffect(() => {
    if (result && result !== prevResult.current) {
      const won = result.playerWon ?? result.safe ?? false
      if (won) {
        const isBig = (result.payoutMultiplier || 0) >= 5
        if (isBig) {
          sndBigWin()
          hapticWin()
          confetti(3000)
        } else {
          sndWin()
          hapticWin()
          confetti(1500)
        }
      } else {
        sndLose()
        hapticError()
      }
      prevResult.current = result
    }
  }, [result])
}

/* ── Reusable action feedback ── */
export function tapButton() {
  sndClick()
  hapticTap()
}

export function confirmAction() {
  sndSpin()
  hapticConfirm()
}

export function nearMissAction() {
  sndNearMiss()
  hapticError()
}
