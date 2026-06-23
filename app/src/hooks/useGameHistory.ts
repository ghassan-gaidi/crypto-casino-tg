/* ═══════════════════════════════════════════════════════════════
   useGameHistory — Tracks last 10 win/loss results for HotCold
   ═══════════════════════════════════════════════════════════════ */

import { useState, useRef } from 'react'

export function useGameHistory(result: { playerWon?: boolean } | null, max = 10) {
  const [history, setHistory] = useState<boolean[]>([])
  const lastRef = useRef<any>(null)

  // Track when a NEW result arrives (not re-renders of the same one)
  if (result && result !== lastRef.current) {
    lastRef.current = result
    if (result.playerWon !== undefined) {
      setHistory(prev => [...prev.slice(-(max - 1)), result.playerWon!])
    }
  }

  return history
}
