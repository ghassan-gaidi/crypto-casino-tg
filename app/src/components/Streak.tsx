/* ═══════════════════════════════════════════════════════════════
   STREAK — Daily login streak calendar with escalating rewards
   ═══════════════════════════════════════════════════════════════ */

import { useState, useEffect } from 'react'
import { confetti } from '../confetti'

const REWARDS = [50, 50, 75, 75, 100, 100, 200] // Daily XP rewards
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface StreakProps {
  userId?: number
}

function FlameIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
      <path
        d="M12 2C10 6 6 9 6 13C6 16.3 8.7 19 12 19C15.3 19 18 16.3 18 13C18 9 14 6 12 2Z"
        fill="currentColor"
        opacity="0.3"
      />
      <path
        d="M12 6C11 8.5 8 11 8 13.5C8 15.7 9.8 17.5 12 17.5C14.2 17.5 16 15.7 16 13.5C16 11 13 8.5 12 6Z"
        fill="currentColor"
        opacity="0.6"
      />
      <path
        d="M12 10C11.5 11.5 10 13 10 14C10 15.1 10.9 16 12 16C13.1 16 14 15.1 14 14C14 13 12.5 11.5 12 10Z"
        fill="currentColor"
      />
      <path
        d="M11 17C10 17.5 9.5 18 9.5 18.5C9.5 19.3 10.2 20 11 20C11.8 20 12.5 19.3 12.5 18.5C12.5 18 12 17.5 11 17Z"
        fill="currentColor"
        opacity="0.4"
      />
    </svg>
  )
}

export default function Streak({ userId }: StreakProps) {
  const [streak, setStreak] = useState(0)
  const [claimedToday, setClaimedToday] = useState(false)
  const [showClaim, setShowClaim] = useState(false)

  // Load streak from localStorage
  useEffect(() => {
    const key = `streak_${userId || 'default'}`
    const data = localStorage.getItem(key)
    if (data) {
      const parsed = JSON.parse(data)
      const lastClaim = new Date(parsed.lastClaim)
      const today = new Date()
      const diffDays = Math.floor((today.getTime() - lastClaim.getTime()) / 86400000)

      if (diffDays === 0) {
        setStreak(parsed.streak)
        setClaimedToday(true)
      } else if (diffDays === 1) {
        setStreak(parsed.streak)
        setClaimedToday(false)
      } else {
        // Streak broken
        setStreak(0)
        setClaimedToday(false)
      }
    } else {
      setShowClaim(true) // First time user
    }
  }, [userId])

  const claimDay = () => {
    const newStreak = streak + 1
    setStreak(newStreak)
    setClaimedToday(true)
    setShowClaim(false)

    const key = `streak_${userId || 'default'}`
    localStorage.setItem(key, JSON.stringify({
      streak: newStreak,
      lastClaim: new Date().toISOString(),
    }))

    confetti(1500)
  }

  const streakDay = new Date().getDay() // 0=Sun, 1=Mon...
  const adjustedDay = streakDay === 0 ? 6 : streakDay - 1 // Convert to Mon=0

  const multiplier = streak >= 28 ? '3x' : streak >= 14 ? '2x' : streak >= 7 ? '1.5x' : '1x'

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      background: 'var(--surface)',
      padding: '16px',
      marginBottom: '16px',
    }}>
      {/* Streak Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'flex', alignItems: 'center', color: 'var(--accent)' }}>
            <FlameIcon />
          </span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--white)' }}>
            {streak} DAY STREAK
          </span>
        </div>
        <span style={{
          fontSize: '10px', fontWeight: 700,
          color: streak >= 7 ? 'var(--gold)' : 'var(--accent)',
          background: streak >= 7 ? 'rgba(255,215,0,.1)' : 'rgba(220,38,54,.1)',
          padding: '2px 8px',
          borderRadius: '10px',
          textShadow: streak >= 7 ? '0 0 6px rgba(255,215,0,.3)' : 'none',
        }}>
          {multiplier} REWARD
        </span>
      </div>

      {/* Calendar Grid */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        {DAY_NAMES.map((day, i) => {
          const isClaimed = i < adjustedDay || (i === adjustedDay && claimedToday)
          const isToday = i === adjustedDay
          const isFuture = i > adjustedDay

          return (
            <div key={day} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                fontSize: '8px', color: 'var(--text-dim)',
                marginBottom: '4px', letterSpacing: '1px',
              }}>
                {day}
              </div>
              <div className={`streak-day ${isClaimed ? 'claimed' : ''} ${isToday ? 'today' : ''} ${isFuture ? 'future' : ''}`}>
                {isClaimed ? '✓' : REWARDS[i]}
              </div>
            </div>
          )
        })}
      </div>

      {/* Claim Button */}
      {showClaim && !claimedToday && (
        <button
          onClick={claimDay}
          className="btn btn-green"
          style={{ marginTop: '4px' }}
        >
          ⚡ CLAIM DAY {streak + 1} REWARD
        </button>
      )}

      {claimedToday && (
        <div style={{
          textAlign: 'center', fontSize: '10px', color: 'var(--green)',
          letterSpacing: '1px', padding: '6px 0',
        }}>
          ✓ CLAIMED TODAY — COME BACK TOMORROW
        </div>
      )}

      {/* Next Reward Preview */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginTop: '8px', paddingTop: '8px',
        borderTop: '1px solid var(--border)',
        fontSize: '10px', color: 'var(--text-dim)',
      }}>
        <span>NEXT REWARD: {REWARDS[(adjustedDay + 1) % 7]} XP</span>
        <span>{streak >= 7 ? '🔥 BONUS ACTIVE' : `${7 - Math.min(streak, 7)} DAYS TO BONUS`}</span>
      </div>
    </div>
  )
}
