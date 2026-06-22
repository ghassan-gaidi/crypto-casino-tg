/* ═══════════════════════════════════════════════════════════════
   CONFETTI — Lightweight canvas particle system for win celebrations
   ═══════════════════════════════════════════════════════════════ */

export function confetti(duration = 2000) {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99999;'
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')!
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const colors = ['#00FF88', '#00F0FF', '#A855F7', '#FFD700', '#FF006E', '#FF3366']
  const particles: { x: number; y: number; vx: number; vy: number; color: string; size: number; rotation: number; rotationSpeed: number; opacity: number }[] = []

  for (let i = 0; i < 80; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.6,
      y: canvas.height * 0.4,
      vx: (Math.random() - 0.5) * 8,
      vy: -Math.random() * 8 - 4,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      size: Math.random() * 6 + 3,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      opacity: 1,
    })
  }

  const start = Date.now()
  let raf: number

  function draw() {
    const elapsed = Date.now() - start
    if (elapsed > duration) {
      cancelAnimationFrame(raf)
      canvas.remove()
      return
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (const p of particles) {
      p.x += p.vx
      p.vy += 0.15 // gravity
      p.y += p.vy
      p.rotation += p.rotationSpeed
      p.opacity = Math.max(0, 1 - elapsed / duration)

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.globalAlpha = p.opacity
      ctx.fillStyle = p.color
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
      ctx.restore()
    }

    raf = requestAnimationFrame(draw)
  }

  draw()
}

/* ═══════════════════════════════════════════════════════════════
   COUNT-UP ANIMATION — Animate a number from 0 to target
   ═══════════════════════════════════════════════════════════════ */

export function countUp(
  el: HTMLElement,
  target: number,
  duration = 800,
  prefix = '',
  suffix = '',
  decimals = 0
) {
  const start = performance.now()
  const initial = 0

  function update(now: number) {
    const elapsed = now - start
    const progress = Math.min(elapsed / duration, 1)
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3)
    const current = initial + (target - initial) * eased

    el.textContent = prefix + current.toFixed(decimals) + suffix

    if (progress < 1) {
      requestAnimationFrame(update)
    }
  }

  requestAnimationFrame(update)
}

/* ═══════════════════════════════════════════════════════════════
   GLOW PULSE — Temporary glow effect on an element
   ═══════════════════════════════════════════════════════════════ */

export function glowPulse(el: HTMLElement, color = 'rgba(0,255,136,.3)', duration = 600) {
  const original = el.style.boxShadow
  el.style.boxShadow = `0 0 30px ${color}, 0 0 60px ${color}`
  el.style.transition = 'box-shadow 0.15s ease'

  setTimeout(() => {
    el.style.boxShadow = original || ''
    setTimeout(() => {
      el.style.transition = ''
    }, 150)
  }, duration)
}
