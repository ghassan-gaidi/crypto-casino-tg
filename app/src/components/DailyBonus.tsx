/* ═══════════════════════════════════════════════════════════════
   DAILY BONUS — First-open-of-day modal with XP claim
   Escalating rewards: Day 1=50, Day 2=75, ... Day 7=200 XP
   ═══════════════════════════════════════════════════════════════ */

import { useState, useEffect } from 'react'
import { sndNotification, sndCoin } from '../sounds'
import { hapticSuccess } from '../haptic'
import { confetti } from '../confetti'

const REWARDS = [50, 75, 100, 125, 150, 175, 200]

function getLastClaimDate(): string | null {
  try { return localStorage.getItem('pickr_daily_bonus') } catch { return null }
}

function saveLastClaimDate(date: string) {
  try { localStorage.setItem('pickr_daily_bonus', date) } catch {}
}

function getStreak(): number {
  try { return parseInt(localStorage.getItem('pickr_daily_streak') || '0') } catch { return 0 }
}

function saveStreak(n: number) {
  try { localStorage.setItem('pickr_daily_streak', String(n)) } catch {}
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10)
}

interface DailyBonusProps {
  onClaim: (xp: number) => void
}

export default function DailyBonus({ onClaim }: DailyBonusProps) {
  const [show, setShow] = useState(false)
  const [day, setDay] = useState(0)
  const [showReward, setShowReward] = useState(false)

  useEffect(() => {
    const today = getTodayStr()
    const lastClaim = getLastClaimDate()

    if (lastClaim === today) return // Already claimed today

    // Check streak continuity
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    let streak = getStreak()
    if (lastClaim && lastClaim !== yesterday) {
      streak = 0 // Streak broken
    }

    setDay(streak)
    setShow(true)
    sndNotification()
  }, [])

  const claim = () => {
    const reward: number = REWARDS[day] ?? REWARDS[0]!
    const today = getTodayStr()
    saveLastClaimDate(today)
    saveStreak(day + 1)
    setShowReward(true)

    sndCoin()
    hapticSuccess()
    confetti(2500)

    setTimeout(() => {
      onClaim(reward)
      setTimeout(() => setShow(false), 1500)
    }, 800)
  }

  if (!show) return null

  const reward: number = REWARDS[day] ?? REWARDS[0]!

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '32px 24px',
        maxWidth: 340,
        width: '100%',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Glow accent */}
        <div style={{
          position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,184,0,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {!showReward ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🔥</div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 18, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase',
              color: 'var(--warning)',
              marginBottom: 4,
            }}>
              DAILY BONUS
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Day {day + 1} streak — keep it going!
            </div>

            {/* 7-day grid */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 20 }}>
              {REWARDS.map((r, i) => (
                <div key={i} style={{
                  width: 38, height: 48, borderRadius: 8,
                  background: i <= day ? 'rgba(255,184,0,0.15)' : 'var(--surface)',
                  border: i === day ? '2px solid var(--warning)' : '1px solid var(--border)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: i <= day ? 'var(--warning)' : 'var(--text-muted)',
                }}>
                  <div style={{ fontSize: 14, marginBottom: 2 }}>{i < day ? '✓' : r}</div>
                  <div>D{i + 1}</div>
                </div>
              ))}
            </div>

            <button onClick={claim} className="btn btn-primary" style={{ width: '100%', fontSize: 15, padding: '12px 0' }}>
              CLAIM {reward} XP
            </button>
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
              Streak resets if you miss a day
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 56, marginBottom: 8, animation: 'bounceIn 0.5s ease' }}>🎁</div>
            <div style={{
              fontSize: 32, fontWeight: 900, fontFamily: 'var(--font-mono)',
              background: 'linear-gradient(135deg, var(--warning) 0%, #FFD700 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              marginBottom: 4,
            }}>
              +{reward} XP
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Day {day + 1} claimed!
            </div>
          </>
        )}
      </div>
    </div>
  )
}
