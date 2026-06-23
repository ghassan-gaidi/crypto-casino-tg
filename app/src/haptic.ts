/* ═══════════════════════════════════════════════════════════════
   HAPTIC — Telegram WebApp.HapticFeedback wrappers
   Falls back gracefully when not in Telegram
   ═══════════════════════════════════════════════════════════════ */

function getHaptic() {
  return (window as any).Telegram?.WebApp?.HapticFeedback || null
}

/* ── Light tap: button presses, navigation ── */
export function hapticTap() {
  getHaptic()?.impactOccurred?.('light')
}

/* ── Medium impact: placing bets, confirming actions ── */
export function hapticConfirm() {
  getHaptic()?.impactOccurred?.('medium')
}

/* ── Heavy impact: big wins, jackpot hits ── */
export function hapticWin() {
  getHaptic()?.impactOccurred?.('heavy')
}

/* ── Error: insufficient balance, rate limit ── */
export function hapticError() {
  getHaptic()?.notificationOccurred?.('error')
}

/* ── Success: deposit confirmed, win ── */
export function hapticSuccess() {
  getHaptic()?.notificationOccurred?.('success')
}

/* ── Warning: near miss, streak at risk ── */
export function hapticWarning() {
  getHaptic()?.notificationOccurred?.('warning')
}

/* ── Selection changed: toggles, sliders ── */
export function hapticSelection() {
  getHaptic()?.selectionChanged?.()
}
