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
  try { return localStorage.getItem('casino_daily_bonus') } catch { return null }
}

function saveLastClaimDate(date: string) {
  try { localStorage.setItem('casino_daily_bonus', date) } catch {}
}

function getStreak(): number {
  try { return parseInt(localStorage.getItem('casino_daily_streak') || '0') } catch { return 0 }
}

function saveStreak(n: number) {
  try { localStorage.setItem('casino_daily_streak', String(n)) } catch {}
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10)
}

interface DailyBonusProps {
  onClaim: (xp: number) => void
}

function FlameIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ display: 'block', margin: '0 auto' }}>
      <path
        d="M12 2C10 6 6 9 6 13C6 16.3 8.7 19 12 19C15.3 19 18 16.3 18 13C18 9 14 6 12 2Z"
        fill="#DC2626"
        opacity="0.3"
      />
      <path
        d="M12 6C11 8.5 8 11 8 13.5C8 15.7 9.8 17.5 12 17.5C14.2 17.5 16 15.7 16 13.5C16 11 13 8.5 12 6Z"
        fill="#DC2626"
        opacity="0.6"
      />
      <path
        d="M12 10C11.5 11.5 10 13 10 14C10 15.1 10.9 16 12 16C13.1 16 14 15.1 14 14C14 13 12.5 11.5 12 10Z"
        fill="#DC2626"
      />
      <path
        d="M11 17C10 17.5 9.5 18 9.5 18.5C9.5 19.3 10.2 20 11 20C11.8 20 12.5 19.3 12.5 18.5C12.5 18 12 17.5 11 17Z"
        fill="#DC2626"
        opacity="0.4"
      />
    </svg>
  )
}

function GiftIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" style={{ display: 'block', margin: '0 auto' }}>
      <rect x="3" y="7" width="18" height="14" rx="2" stroke="#FFB800" strokeWidth="2" fill="none" />
      <path d="M3 11h18" stroke="#FFB800" strokeWidth="2" />
      <path d="M12 7v14" stroke="#FFB800" strokeWidth="2" opacity="0.5" />
      <path d="M12 7C12 4 8 3 8 5C8 7 12 7 12 7Z" fill="#FFB800" opacity="0.3" />
      <path d="M12 7C12 4 16 3 16 5C16 7 12 7 12 7Z" fill="#FFB800" opacity="0.3" />
    </svg>
  )
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
        background: 'var(--surface)',
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
            <div style={{ marginBottom: 8 }}>
              <FlameIcon />
            </div>
            <div style={{
              fontFamily: 'var(--font)',
              fontSize: 18, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase',
              color: 'var(--gold)',
              marginBottom: 4,
            }}>
              DAILY BONUS
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16 }}>
              Day {day + 1} streak — keep it going!
            </div>

            {/* 7-day grid */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 20 }}>
              {REWARDS.map((r, i) => (
                <div key={i} style={{
                  width: 38, height: 48, borderRadius: 8,
                  background: i <= day ? 'rgba(255,184,0,0.15)' : 'var(--surface)',
                  border: i === day ? '2px solid var(--gold)' : '1px solid var(--border)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: i <= day ? 'var(--gold)' : 'var(--text-muted)',
                }}>
                  <div style={{ fontSize: 14, marginBottom: 2 }}>{i < day ? '✓' : r}</div>
                  <div>D{i + 1}</div>
                </div>
              ))}
            </div>

            <button onClick={claim} className="btn btn-cyan" style={{ width: '100%', fontSize: 15, padding: '12px 0' }}>
              CLAIM {reward} XP
            </button>
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
              Streak resets if you miss a day
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 8, animation: 'bounceIn 0.5s ease' }}>
              <GiftIcon />
            </div>
            <div style={{
              fontSize: 32, fontWeight: 900, fontFamily: 'var(--font-mono)',
              background: 'linear-gradient(135deg, var(--gold) 0%, #FFD700 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              marginBottom: 4,
            }}>
              +{reward} XP
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
              Day {day + 1} claimed!
            </div>
          </>
        )}
      </div>
    </div>
  )
}
