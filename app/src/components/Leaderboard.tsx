/* ═══════════════════════════════════════════════════════════════
   LEADERBOARD — Daily/Weekly/All-Time rankings with proximity nudge
   ═══════════════════════════════════════════════════════════════ */

import { useState } from 'react'

type Period = 'daily' | 'weekly' | 'all'

const MOCK_LEADERBOARD = {
  daily: [
    { rank: 1, name: '@whale_trader', xp: 45200, badge: 'gold' },
    { rank: 2, name: '@dex_master', xp: 43800, badge: 'silver' },
    { rank: 3, name: '@crypto_sage', xp: 41500, badge: 'bronze' },
    { rank: 4, name: '@yield_fiend', xp: 39200 },
    { rank: 5, name: '@defi_king', xp: 38100 },
    { rank: 6, name: '@sol_whale', xp: 35400 },
    { rank: 7, name: '@btc_maxi', xp: 32000 },
    { rank: 8, name: '@eth_purist', xp: 28500 },
    { rank: 9, name: '@lucky_doge', xp: 24100 },
    { rank: 10, name: '@moon_shot', xp: 20000 },
  ],
  weekly: [
    { rank: 1, name: '@crypto_sage', xp: 185000, badge: 'gold' },
    { rank: 2, name: '@whale_trader', xp: 172000, badge: 'silver' },
    { rank: 3, name: '@defi_king', xp: 156000, badge: 'bronze' },
    { rank: 4, name: '@dex_master', xp: 141000 },
    { rank: 5, name: '@yield_fiend', xp: 128000 },
  ],
  all: [
    { rank: 1, name: '@crypto_sage', xp: 892000, badge: 'gold' },
    { rank: 2, name: '@whale_trader', xp: 756000, badge: 'silver' },
    { rank: 3, name: '@defi_king', xp: 634000, badge: 'bronze' },
    { rank: 4, name: '@dex_master', xp: 521000 },
    { rank: 5, name: '@yield_fiend', xp: 445000 },
  ],
}

interface LeaderboardProps {
  userXp?: number
  userRank?: number
}

export default function Leaderboard({ userXp = 12400, userRank = 47 }: LeaderboardProps) {
  const [period, setPeriod] = useState<Period>('daily')
  const entries = MOCK_LEADERBOARD[period]

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      background: 'var(--surface)',
      overflow: 'hidden',
    }}>
      {/* Period Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        {(['daily', 'weekly', 'all'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            style={{
              flex: 1, padding: '8px', fontSize: '9px', fontWeight: 600,
              letterSpacing: '1.5px', textTransform: 'uppercase' as const,
              background: period === p ? 'rgba(0,240,255,.06)' : 'transparent',
              border: 'none', borderBottom: period === p ? '2px solid var(--cyan)' : '2px solid transparent',
              color: period === p ? 'var(--cyan)' : 'var(--text-dim)',
              cursor: 'pointer', fontFamily: 'var(--font)',
              transition: 'all .15s',
            }}
          >
            {p === 'all' ? 'ALL TIME' : p.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Top 3 */}
      <div style={{ padding: '12px 12px 8px' }}>
        {entries.slice(0, 3).map((entry) => (
          <div key={entry.rank} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '6px 0',
          }}>
            <span style={{
              fontSize: '16px', width: '28px', textAlign: 'center',
              ...(entry.badge === 'gold' ? { color: 'var(--gold)', textShadow: '0 0 8px rgba(255,215,0,.4)' } :
                entry.badge === 'silver' ? { color: '#C0C0C0' } :
                { color: '#CD7F32' }),
            }}>
              {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
            </span>
            <span style={{ flex: 1, fontSize: '12px', color: 'var(--white)', fontWeight: 500 }}>
              {entry.name}
            </span>
            <span style={{
              fontSize: '11px', fontWeight: 600, color: 'var(--cyan)',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {entry.xp.toLocaleString()} XP
            </span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'var(--border)', margin: '0 12px' }} />

      {/* Your Position */}
      <div className="lb-row you" style={{ padding: '10px 12px' }}>
        <span className="lb-rank" style={{ color: 'var(--cyan)' }}>
          {userRank}
        </span>
        <span style={{ fontSize: '8px', color: 'var(--cyan)', marginRight: '4px' }}>⭐</span>
        <span className="lb-name" style={{ color: 'var(--cyan)' }}>YOU</span>
        <span className="lb-xp">{userXp.toLocaleString()} XP</span>
      </div>

      {/* Proximity Nudge */}
      <div style={{
        padding: '6px 12px 12px',
        fontSize: '9px', color: 'var(--text-dim)',
        textAlign: 'center', letterSpacing: '.5px',
      }}>
        Only <span style={{ color: 'var(--purple)' }}>200 XP</span> behind <span style={{ color: 'var(--white)' }}>@trader99</span>!
      </div>
    </div>
  )
}
