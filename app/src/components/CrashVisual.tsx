import { useEffect, useRef } from 'react'
import Phaser from 'phaser'

/* ── Types ───────────────────────────────────────────────────── */
export interface CrashVisualProps {
  crashPoint: number
  animating: boolean
  currentMultiplier: number
  crashed: boolean
  onReady?: () => void
}

/* ── Constants ───────────────────────────────────────────────── */
const W = 440
const H = 260
const SPEED = 0.1
const MARGIN = { left: 30, right: 16, top: 24, bottom: 20 }
const PLOT_W = W - MARGIN.left - MARGIN.right // 394
const PLOT_H = H - MARGIN.top - MARGIN.bottom // 216
const STAR_COUNT = 45

const BG = 0x08080E
const GRID_LINE = 0x1E1E30
const LINE_GREEN = 0x00FF88
const LINE_RED = 0xFF3366
const TEXT_GREEN = '#00FF88'
const TEXT_RED = '#FF3366'

/* ── Curve Helpers ───────────────────────────────────────────── */
function elapsedFromMult(mult: number): number {
  return Math.log(mult) / SPEED
}

/**
 * Return the visible plot range so the tip of the curve sits at roughly
 * ¾ of the plot width and the max multiplier leaves 30 % headroom.
 */
function plotRange(mult: number) {
  const maxMult = Math.max(mult * 1.3, 2.5)
  const maxElapsed = elapsedFromMult(maxMult)
  return { maxMult, maxElapsed }
}

/**
 * Convert a multiplier value to canvas (x, y) for the current plot range.
 */
function multToXY(mult: number, maxMult: number, maxElapsed: number) {
  const t = elapsedFromMult(mult)
  const x = MARGIN.left + (t / maxElapsed) * PLOT_W
  const y = MARGIN.top + PLOT_H - ((mult - 1) / (maxMult - 1)) * PLOT_H
  return { x, y }
}

/* ── Phaser Scene ────────────────────────────────────────────── */
class CrashGameScene extends Phaser.Scene {
  /* Bridge to React props */
  private stateRef!: React.MutableRefObject<CrashVisualProps>
  private onReady?: () => void

  /* Layers */
  private gridGfx!: Phaser.GameObjects.Graphics
  private curveGfx!: Phaser.GameObjects.Graphics

  /* Stars */
  private stars: { dot: Phaser.GameObjects.Arc; phase: number; speed: number }[] = []

  /* Rocket */
  private rocket!: Phaser.GameObjects.Triangle

  /* Multiplier text */
  private multText!: Phaser.GameObjects.Text

  /* Crash effects */
  private flashRect!: Phaser.GameObjects.Rectangle
  private sparkEmitter!: Phaser.GameObjects.Particles.ParticleEmitter
  private hasCrashed = false
  private wasAnimating = false

  constructor() {
    super({ key: 'CrashScene' })
  }

  /* Called by React before create() */
  initBridge(
    stateRef: React.MutableRefObject<CrashVisualProps>,
    onReady?: () => void,
  ) {
    this.stateRef = stateRef
    this.onReady = onReady
  }

  /* ── Lifecycle ─────────────────────────────────────────────── */

  create() {
    this.cameras.main.setBackgroundColor(BG)

    /* Grid (static) */
    this.gridGfx = this.add.graphics()
    this.drawGrid()

    /* Curve (dynamic, redrawn every frame) */
    this.curveGfx = this.add.graphics()

    /* Twinkling stars */
    for (let i = 0; i < STAR_COUNT; i++) {
      const x = Phaser.Math.Between(0, W)
      const y = Phaser.Math.Between(0, H)
      const r = Phaser.Math.FloatBetween(0.3, 1.4)
      const dot = this.add.circle(x, y, r, 0xffffff, 0)
      this.stars.push({
        dot,
        phase: Phaser.Math.FloatBetween(0, Math.PI * 2),
        speed: Phaser.Math.FloatBetween(0.5, 2.5),
      })
    }

    /* Multiplier text (top-right) */
    this.multText = this.add
      .text(W - MARGIN.right, MARGIN.top, '1.00x', {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '26px',
        fontStyle: '800',
        color: TEXT_GREEN,
      })
      .setOrigin(1, 0)
      .setAlpha(0)

    /* Rocket — upward-pointing triangle/arrow */
    this.rocket = this.add
      .triangle(0, 0, 0, -10, 7, 7, -7, 7, 0xffffff)
      .setAlpha(0)
      .setDepth(10)

    /* Flash overlay */
    this.flashRect = this.add
      .rectangle(W / 2, H / 2, W, H, 0xffffff, 0)
      .setDepth(50)

    /* Particle texture for sparks */
    const pg = this.add.graphics()
    pg.fillStyle(0xffffff)
    pg.fillCircle(4, 4, 4)
    pg.generateTexture('spark_tex', 8, 8)
    pg.destroy()

    /* Spark burst emitter */
    this.sparkEmitter = this.add
      .particles(0, 0, 'spark_tex', {
        speed: { min: 100, max: 380 },
        angle: { min: 0, max: 360 },
        scale: { start: 1.2, end: 0 },
        lifespan: { min: 350, max: 900 },
        quantity: 30,
        emitting: false,
        tint: LINE_RED,
      })
      .setDepth(60)

    /* Notify parent that the canvas is ready */
    this.onReady?.()
  }

  /* ── Grid ──────────────────────────────────────────────────── */

  private drawGrid() {
    this.gridGfx.clear()
    this.gridGfx.lineStyle(1, GRID_LINE, 0.35)

    /* Vertical lines (5 interior) */
    for (let i = 1; i <= 5; i++) {
      const x = MARGIN.left + (i / 6) * PLOT_W
      this.gridGfx.beginPath()
      this.gridGfx.moveTo(x, MARGIN.top)
      this.gridGfx.lineTo(x, H - MARGIN.bottom)
      this.gridGfx.strokePath()
    }

    /* Horizontal lines (4 interior) */
    for (let i = 1; i <= 4; i++) {
      const y = MARGIN.top + (i / 5) * PLOT_H
      this.gridGfx.beginPath()
      this.gridGfx.moveTo(MARGIN.left, y)
      this.gridGfx.lineTo(W - MARGIN.right, y)
      this.gridGfx.strokePath()
    }

    /* Axes border */
    this.gridGfx.lineStyle(1, GRID_LINE, 0.5)
    this.gridGfx.strokeRect(
      MARGIN.left,
      MARGIN.top,
      PLOT_W,
      PLOT_H,
    )
  }

  /* ── Curve ─────────────────────────────────────────────────── */

  private drawCurve(mult: number) {
    const state = this.stateRef.current
    const color = state.crashed ? LINE_RED : LINE_GREEN
    const { maxMult, maxElapsed } = plotRange(mult)
    const elapsed = elapsedFromMult(mult)
    const segments = 100

    this.curveGfx.clear()

    /* Glow layer (wider, fainter) */
    this.curveGfx.lineStyle(7, color, 0.15)
    this.curveGfx.beginPath()
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * elapsed
      const m = Math.exp(SPEED * t)
      const { x, y } = multToXY(m, maxMult, maxElapsed)
      if (i === 0) this.curveGfx.moveTo(x, y)
      else this.curveGfx.lineTo(x, y)
    }
    this.curveGfx.strokePath()

    /* Main line */
    this.curveGfx.lineStyle(2.5, color, 1)
    this.curveGfx.beginPath()
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * elapsed
      const m = Math.exp(SPEED * t)
      const { x, y } = multToXY(m, maxMult, maxElapsed)
      if (i === 0) this.curveGfx.moveTo(x, y)
      else this.curveGfx.lineTo(x, y)
    }
    this.curveGfx.strokePath()

    /* Fill below the curve (gradient-like flat fill) */
    this.curveGfx.fillStyle(color, 0.04)
    this.curveGfx.beginPath()
    this.curveGfx.moveTo(MARGIN.left, MARGIN.top + PLOT_H)
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * elapsed
      const m = Math.exp(SPEED * t)
      const { x, y } = multToXY(m, maxMult, maxElapsed)
      this.curveGfx.lineTo(x, y)
    }
    this.curveGfx.lineTo(
      MARGIN.left + (elapsed / maxElapsed) * PLOT_W,
      MARGIN.top + PLOT_H,
    )
    this.curveGfx.closePath()
    this.curveGfx.fillPath()
  }

  /* ── Rocket ────────────────────────────────────────────────── */

  private updateRocket(mult: number) {
    const { maxMult, maxElapsed } = plotRange(mult)
    const { x, y } = multToXY(mult, maxMult, maxElapsed)

    /* Sits just above the line */
    this.rocket.setPosition(x, y - 12).setAlpha(1)

    /* Compute rotation from derivative at current point */
    const eps = 0.01
    const multNear = Math.exp(SPEED * (elapsedFromMult(mult) + eps))
    const { x: xN, y: yN } = multToXY(multNear, maxMult, maxElapsed)
    const angle = Math.atan2(yN - y, xN - x)

    /* Rocket faces UP by default; rotate so tip points along tangent */
    this.rocket.setRotation(angle + Math.PI / 2)
  }

  /* ── Crash Effects ─────────────────────────────────────────── */

  private triggerCrash() {
    this.hasCrashed = true

    /* Camera shake */
    this.cameras.main.shake(500, 0.01)

    /* Screen flash */
    this.flashRect.setAlpha(0.45)
    this.tweens.add({
      targets: this.flashRect,
      alpha: 0,
      duration: 350,
      ease: 'Power2',
    })

    /* Spark burst at rocket position */
    this.sparkEmitter.emitParticleAt(this.rocket.x, this.rocket.y, 30)

    /* Additional nearby bursts */
    for (let i = 0; i < 4; i++) {
      const rx = this.rocket.x + Phaser.Math.Between(-25, 25)
      const ry = this.rocket.y + Phaser.Math.Between(-25, 25)
      this.sparkEmitter.emitParticleAt(rx, ry, 12)
    }
  }

  /* ── Per-frame Update ──────────────────────────────────────── */

  update(_time: number, _delta: number) {
    /* Safety: bridge not yet wired */
    if (!this.stateRef) return

    const state = this.stateRef.current
    const t = _time / 1000

    /* Twinkle stars */
    for (const s of this.stars) {
      const brightness = 0.12 + 0.4 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase))
      s.dot.setAlpha(brightness)
    }

    if (state.animating) {
      const mult = state.currentMultiplier

      /* Curve */
      this.drawCurve(mult)

      /* Rocket */
      this.updateRocket(mult)

      /* Text */
      this.multText
        .setText(`${mult.toFixed(2)}x`)
        .setAlpha(1)
        .setColor(state.crashed ? TEXT_RED : TEXT_GREEN)
        .setShadow(0, 0, state.crashed ? TEXT_RED : TEXT_GREEN, state.crashed ? 18 : 14)

      /* One-shot crash effects */
      if (state.crashed && !this.hasCrashed) {
        this.triggerCrash()
      }

      this.wasAnimating = true
    } else if (this.wasAnimating) {
      /* Tear-down after animation ends */
      this.curveGfx.clear()
      this.rocket.setAlpha(0)
      this.multText.setAlpha(0)
      this.hasCrashed = false
      this.wasAnimating = false

      /* Draw a static end-state line if crashed (shows where it crashed) */
      if (this.stateRef.current.crashed) {
        // Briefly show the crash point marker
      }
    }
  }
}

/* ── React Component ─────────────────────────────────────────── */

export default function CrashVisual({
  crashPoint,
  animating,
  currentMultiplier,
  crashed,
  onReady,
}: CrashVisualProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const sceneRef = useRef<CrashGameScene | null>(null)

  /* Mutable ref that the Phaser scene reads each frame.
     Avoids stale closures / React render-cycle coupling. */
  const stateRef = useRef<CrashVisualProps>({
    crashPoint,
    animating,
    currentMultiplier,
    crashed,
    onReady,
  })

  /* Keep the ref in sync with incoming props */
  useEffect(() => {
    stateRef.current = { crashPoint, animating, currentMultiplier, crashed }
  }, [crashPoint, animating, currentMultiplier, crashed])

  /* Bootstrap Phaser once */
  useEffect(() => {
    if (!containerRef.current || gameRef.current) return

    const scene = new CrashGameScene()

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.CANVAS,
      width: W,
      height: H,
      parent: containerRef.current,
      backgroundColor: '#08080E',
      scene,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      /* Disable Phaser's built-in DOM / keyboard / gamepad
         so it doesn't interfere with React event handling */
      input: {
        keyboard: false,
        mouse: false,
        touch: false,
      },
      banner: false,
    }

    gameRef.current = new Phaser.Game(config)

    /* Wire up the bridge *after* the game is created so the scene
       is guaranteed to exist.  Because we passed the scene instance
       directly, create() fires synchronously inside the constructor. */
    scene.initBridge(stateRef, onReady)
    sceneRef.current = scene

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
        sceneRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        aspectRatio: `${W} / ${H}`,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '4px',
      }}
    />
  )
}
