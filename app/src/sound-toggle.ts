/* Sound toggle — persists mute state in localStorage */

const KEY = 'casino_muted'

export function isMuted(): boolean {
  try {
    return localStorage.getItem(KEY) === 'true'
  } catch {
    return false
  }
}

export function setMuted(v: boolean): void {
  try {
    localStorage.setItem(KEY, String(v))
  } catch { /* ignore */ }
}

export function toggleMute(): void {
  setMuted(!isMuted())
}
