/* ═══════════════════════════════════════════════════════════════
   XP BAR — Level progression with animated XP bar
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from 'react'

const LEVELS = [
  { level: 1, xpNeeded: 0 },
  { level: 2, xpNeeded: 100 },
  { level: 3, xpNeeded: 250 },
  { level: 4, xpNeeded: 500 },
  { level: 5, xpNeeded: 1000 },
  { level: 6, xpNeeded: 2000 },
  { level: 7, xpNeeded: 3500 },
  { level: 8, xpNeeded: 5000 },
  { level: 9, xpNeeded: 7500 },
  { level: 10, xpNeeded: 10000 },
  { level: 11, xpNeeded: 15000 },
  { level: 12, xpNeeded: 20000 },
  { level: 13, xpNeeded: 30000 },
  { level: 14, xpNeeded: 45000 },
  { level: 15, xpNeeded: 60000 },
  { level: 16, xpNeeded: 80000 },
  { level: 17, xpNeeded: 100000 },
  { level: 18, xpNeeded: 130000 },
  { level: 19, xpNeeded: 160000 },
  { level: 20, xpNeeded: 200000 },
]

function getLevelInfo(xp: number) {
  let current = LEVELS[0]!
  let next = LEVELS[1]!
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i]!.xpNeeded) {
      current = LEVELS[i]!
      next = LEVELS[i + 1] || LEVELS[i]!
      break
    }
  }

  const progress = next.xpNeeded > current.xpNeeded
    ? (xp - current.xpNeeded) / (next.xpNeeded - current.xpNeeded)
    : 1

  return {
    level: current.level,
    currentXp: xp,
    nextXp: next.xpNeeded,
    progress: Math.min(progress, 1),
  }
}

interface XpBarProps {
  xp: number
  compact?: boolean
}

export default function XpBar({ xp, compact = false }: XpBarProps) {
  const { level, currentXp, nextXp, progress } = getLevelInfo(xp)
  const fillRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (fillRef.current) {
      fillRef.current.style.width = `${progress * 100}%`
    }
  }, [progress])

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div className="level-badge" style={{ width: '28px', height: '28px', fontSize: '11px' }}>
          {level}
        </div>
        <div style={{ flex: 1 }}>
          <div className="xp-bar" style={{ height: '4px' }}>
            <div
              ref={fillRef}
              className="xp-fill"
              style={{ width: '0%' }}
            />
          </div>
        </div>
        <span style={{ fontSize: '9px', color: 'var(--text-dim)', fontVariantNumeric: 'tabular-nums' }}>
          {currentXp}/{nextXp}
        </span>
      </div>
    )
  }

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      background: 'var(--surface)',
      padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <div className="level-badge">
          {level}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--white)', letterSpacing: '1px' }}>
            LEVEL {level}
          </div>
          <div style={{ fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '1px' }}>
            {nextXp - currentXp} XP TO LEVEL {level + 1}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: '14px', fontWeight: 700, color: 'var(--cyan)',
            fontVariantNumeric: 'tabular-nums',
            textShadow: '0 0 8px rgba(220,38,54,.3)',
          }}>
            {currentXp.toLocaleString()}
          </div>
          <div style={{ fontSize: '8px', color: 'var(--text-dim)', letterSpacing: '1px' }}>
            TOTAL XP
          </div>
        </div>
      </div>

      <div className="xp-bar">
        <div
          ref={fillRef}
          className="xp-fill"
          style={{ width: '0%' }}
        />
      </div>

      {/* Next Level Perks */}
      <div style={{
        marginTop: '8px', paddingTop: '8px',
        borderTop: '1px solid var(--border)',
        fontSize: '9px', color: 'var(--text-dim)',
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span>UNLOCKS AT LEVEL {level + 1}:</span>
        <span style={{ color: 'var(--purple)' }}>
          {level < 5 ? 'HIGHER BET LIMITS' :
           level < 10 ? 'VIP BADGE + EXCLUSIVE GAMES' :
           level < 15 ? 'PRIORITY SUPPORT + BONUSES' :
           'DIAMOND STATUS + MAX REWARDS'}
        </span>
      </div>
    </div>
  )
}
