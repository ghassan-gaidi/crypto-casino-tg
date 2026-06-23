/* ═══════════════════════════════════════════════════════════════
   SOUNDS — Web Audio API synthesizer for casino micro-interactions
   Zero external files, all procedurally generated
   ═══════════════════════════════════════════════════════════════ */

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  const c = getCtx()
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(volume, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start()
  osc.stop(c.currentTime + duration)
}

/* ── Click: short blip ── */
export function sndClick() {
  playTone(800, 0.06, 'sine', 0.08)
}

/* ── Win: ascending arpeggio ── */
export function sndWin() {
  const notes = [523, 659, 784, 1047] // C5 E5 G5 C6
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 0.15, 'sine', 0.12), i * 80)
  })
}

/* ── Big Win: fanfare ── */
export function sndBigWin() {
  const notes = [523, 659, 784, 1047, 1319, 1568] // C5→C6→E6→G6
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 0.2, 'triangle', 0.15), i * 100)
  })
}

/* ── Lose: low thud ── */
export function sndLose() {
  playTone(120, 0.2, 'sine', 0.15)
  setTimeout(() => playTone(80, 0.3, 'sine', 0.1), 100)
}

/* ── Near Miss: quick double blip ── */
export function sndNearMiss() {
  playTone(600, 0.08, 'square', 0.06)
  setTimeout(() => playTone(900, 0.08, 'square', 0.06), 60)
}

/* ── Spin: whoosh sweep ── */
export function sndSpin() {
  const c = getCtx()
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(200, c.currentTime)
  osc.frequency.exponentialRampToValueAtTime(1200, c.currentTime + 0.15)
  gain.gain.setValueAtTime(0.06, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start()
  osc.stop(c.currentTime + 0.2)
}

/* ── Coin: metallic ping ── */
export function sndCoin() {
  playTone(2000, 0.08, 'sine', 0.1)
  setTimeout(() => playTone(2500, 0.06, 'sine', 0.08), 40)
}

/* ── Level Up: triumphant rise ── */
export function sndLevelUp() {
  const notes = [392, 494, 587, 698, 880, 1047] // G4→C6
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 0.25, 'triangle', 0.12), i * 90)
  })
}

/* ── Button: subtle tap ── */
export function sndTap() {
  playTone(600, 0.04, 'sine', 0.05)
}

/* ── Ambient: soft notification for streak/daily ── */
export function sndNotification() {
  playTone(880, 0.12, 'sine', 0.08)
  setTimeout(() => playTone(1100, 0.15, 'sine', 0.1), 120)
}
