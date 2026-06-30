import React, { useRef, useEffect } from 'react'

/* ── PlinkoVisual — Animated canvas plinko ball drop ─────── */

interface PlinkoVisualProps {
  rows: number
  dropSlot: number | null
  animating: boolean
}

const CANVAS_W = 440
const CANVAS_H = 500

const MARGIN_X = 30
const MARGIN_TOP = 20
const MARGIN_BOTTOM = 40

const BOARD_W = CANVAS_W - 2 * MARGIN_X   // 380
const BOARD_H = CANVAS_H - MARGIN_TOP - MARGIN_BOTTOM // 440

const PEG_RADIUS = 3
const BALL_RADIUS = 6

const COLORS = {
  peg: '#3A3A50',
  ball: '#DC2626',
  ballGlow: 'rgba(220,38,54,0.3)',
  slotHighlight: 'rgba(220,38,54,0.2)',
  slotActive: '#DC2626',
  slotInactive: '#3A3A50',
}

const PlinkoVisual: React.FC<PlinkoVisualProps> = ({ rows, dropSlot, animating }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const intervalRef = useRef<number | null>(null)

  const slotSpacing = BOARD_W / rows
  const centerX = CANVAS_W / 2

  /* ── helpers ────────────────────────────────────────────── */

  /** Peg position: row r (0-indexed) has r+1 pegs, centred horizontally */
  const getPegPos = (r: number, j: number) => {
    const rowWidth = r * slotSpacing
    const rowLeft = centerX - rowWidth / 2
    return {
      x: rowLeft + j * slotSpacing,
      y: MARGIN_TOP + (r + 1) * BOARD_H / (rows + 1),
    }
  }

  /** Slot position at bottom */
  const getSlotPos = (i: number) => ({
    x: MARGIN_X + i * slotSpacing,
    y: CANVAS_H - MARGIN_BOTTOM,
  })

  /** Generate a bounce sequence that reaches targetSlot */
  const generateBounces = (targetSlot: number): boolean[] => {
    let right = targetSlot
    let left = rows - targetSlot
    const bounces: boolean[] = []
    for (let i = 0; i < rows; i++) {
      if (right > 0 && (left === 0 || Math.random() < right / (right + left))) {
        bounces.push(true)
        right--
      } else {
        bounces.push(false)
        left--
      }
    }
    return bounces
  }

  /** Compute ball keyframe path from bounce sequence */
  const computePath = (bounces: boolean[], finalSlot: number) => {
    const vSpacing = BOARD_H / (rows + 1)
    let offset = rows / 2
    const path: Array<{ x: number; y: number }> = [{ x: centerX, y: MARGIN_TOP }]

    for (let r = 0; r < rows; r++) {
      offset += bounces[r] ? 0.5 : -0.5
      path.push({
        x: MARGIN_X + offset * slotSpacing,
        y: MARGIN_TOP + (r + 1) * vSpacing,
      })
    }

    // final settle — drop into slot
    path.push({
      x: MARGIN_X + finalSlot * slotSpacing,
      y: CANVAS_H - MARGIN_BOTTOM + 12,
    })
    return path
  }

  /* ── drawing ────────────────────────────────────────────── */

  const drawBoard = (ctx: CanvasRenderingContext2D, highlightSlot: number | null) => {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

    // --- pegs ---
    for (let r = 0; r < rows; r++) {
      for (let j = 0; j <= r; j++) {
        const { x, y } = getPegPos(r, j)
        ctx.beginPath()
        ctx.arc(x, y, PEG_RADIUS, 0, Math.PI * 2)
        ctx.fillStyle = COLORS.peg
        ctx.fill()
      }
    }

    // --- slot labels ---
    for (let i = 0; i <= rows; i++) {
      const { x, y } = getSlotPos(i)
      const active = highlightSlot === i

      // highlight background
      if (active) {
        ctx.fillStyle = COLORS.slotHighlight
        ctx.fillRect(
          x - slotSpacing / 2 + 3,
          y - 4,
          slotSpacing - 6,
          12,
        )
      }

      // slot indicator
      ctx.fillStyle = active ? COLORS.slotActive : COLORS.slotInactive
      ctx.font = 'bold 12px JetBrains Mono, monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(i.toString(), x, y + 14)

      // tick mark
      ctx.fillStyle = active ? COLORS.slotActive : '#2A2A40'
      ctx.fillRect(x - 0.5, y, 1, 6)
    }
  }

  const drawBall = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // outer glow
    const g = ctx.createRadialGradient(x, y, 0, x, y, BALL_RADIUS * 4)
    g.addColorStop(0, COLORS.ballGlow)
    g.addColorStop(1, 'rgba(220,38,54,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, BALL_RADIUS * 4, 0, Math.PI * 2)
    ctx.fill()

    // ball body
    ctx.beginPath()
    ctx.arc(x, y, BALL_RADIUS, 0, Math.PI * 2)
    ctx.fillStyle = COLORS.ball
    ctx.fill()

    // subtle highlight
    ctx.beginPath()
    ctx.arc(x - 1.5, y - 2, 2, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.fill()
  }

  /* ── main effect ────────────────────────────────────────── */

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // clear any running animation
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // static draw — just board
    if (!animating && dropSlot === null) {
      drawBoard(ctx, null)
      return
    }

    // finished — ball at final position
    if (!animating && dropSlot !== null) {
      drawBoard(ctx, dropSlot)
      drawBall(ctx, MARGIN_X + dropSlot * slotSpacing, CANVAS_H - MARGIN_BOTTOM + 12)
      return
    }

    // --- animate ball drop ---
    const bounces = generateBounces(dropSlot ?? Math.floor(rows / 2))
    const path = computePath(bounces, dropSlot ?? Math.floor(rows / 2))
    const totalFrames = 50
    let frame = 0

    intervalRef.current = window.setInterval(() => {
      frame++
      const progress = Math.min(frame / totalFrames, 1)

      drawBoard(ctx, dropSlot)

      // interpolate along path
      const segCount = path.length - 1
      const rawIdx = progress * segCount
      const seg = Math.min(Math.floor(rawIdx), segCount - 1)
      const t = rawIdx - seg
      const a = path[seg]!
      const b = path[seg + 1]!
      const ballX = a.x + (b.x - a.x) * t
      const ballY = a.y + (b.y - a.y) * t

      drawBall(ctx, ballX, ballY)

      if (progress >= 1 && intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }, 28) // ~36 fps

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [animating, rows, dropSlot, centerX, slotSpacing])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      style={{
        width: '100%',
        height: 'auto',
        maxWidth: CANVAS_W,
        display: 'block',
        margin: '0 auto',
        borderRadius: 'var(--radius, 4px)',
        background: 'transparent',
      }}
    />
  )
}

export default PlinkoVisual
