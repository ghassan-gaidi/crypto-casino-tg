import { useEffect, useState } from 'react'
import Streak from './components/Streak'
import XpBar from './components/XpBar'
import LiveFeed from './components/LiveFeed'
import DailyBonus from './components/DailyBonus'
import DiceGame from './components/DiceGame'
import CoinflipGame from './components/CoinflipGame'
import CrashGame from './components/CrashGame'
import MinesGame from './components/MinesGame'
import PlinkoGame from './components/PlinkoGame'
import SlotsGame from './components/SlotsGame'
import RouletteGame from './components/RouletteGame'
import LimboGame from './components/LimboGame'
import JackpotGame from './components/JackpotGame'
import BalancePage from './components/BalancePage'
import LeaderboardPage from './components/LeaderboardPage'
import ReferralsPage from './components/ReferralsPage'
import GameHistoryPage from './components/GameHistoryPage'
import { sndClick } from './sounds'
import { hapticTap } from './haptic'
import './design.css'

type Page = 'home' | 'dice' | 'coinflip' | 'crash' | 'mines' | 'plinko' | 'slots' | 'roulette' | 'limbo' | 'jackpot' | 'balance' | 'leaderboard' | 'refs' | 'history'

const GAMES = [
  { id: 'dice' as const,    icon: '◆', title: 'DICE',    desc: 'Roll over/under  ·  99% win chance',    maxMult: '99×' },
  { id: 'coinflip' as const,icon: '◑', title: 'COINFLIP',desc: 'Heads or tails  ·  50% win chance',     maxMult: '2×' },
  { id: 'crash' as const,   icon: '↗', title: 'CRASH',   desc: 'Cash out before rocket crashes',        maxMult: '∞' },
  { id: 'mines' as const,   icon: '⛏', title: 'MINES',   desc: 'Pick gems, avoid bombs  ·  5×5',       maxMult: '25×' },
  { id: 'plinko' as const,  icon: '▼', title: 'PLINKO',  desc: 'Drop ball  ·  low/med/high risk',       maxMult: '29×' },
  { id: 'slots' as const,   icon: '≡', title: 'SLOTS',   desc: 'Match 3 symbols  ·  classic reels',    maxMult: '1000×' },
  { id: 'roulette' as const,icon: '◎', title: 'ROULETTE', desc: 'European  ·  number/color/section',    maxMult: '36×' },
  { id: 'limbo' as const,   icon: '↑', title: 'LIMBO',   desc: 'Target multiplier  ·  fly high',       maxMult: '100×' },
  { id: 'jackpot' as const, icon: '★', title: 'JACKPOT', desc: 'Progressive pool  ·  highest wins',    maxMult: '∞' },
]

export default function App() {
  const [page, setPage] = useState<Page>('home')
  const [user, setUser] = useState<{ id: number; username?: string } | null>(null)
  const [xp, setXp] = useState(12400)

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg) {
      tg.ready()
      tg.expand()
      const u = tg.initDataUnsafe?.user
      if (u) setUser({ id: u.id, username: u.username })
    }
  }, [])

  const nav = (p: Page) => () => {
    sndClick()
    hapticTap()
    setPage(p)
  }

  if (page === 'dice') return <DiceGame onBack={nav('home')} userId={user?.id} />
  if (page === 'coinflip') return <CoinflipGame onBack={nav('home')} userId={user?.id} />
  if (page === 'crash') return <CrashGame onBack={nav('home')} userId={user?.id} />
  if (page === 'mines') return <MinesGame onBack={nav('home')} userId={user?.id} />
  if (page === 'plinko') return <PlinkoGame onBack={nav('home')} userId={user?.id} />
  if (page === 'slots') return <SlotsGame onBack={nav('home')} userId={user?.id} />
  if (page === 'roulette') return <RouletteGame onBack={nav('home')} userId={user?.id} />
  if (page === 'limbo') return <LimboGame onBack={nav('home')} userId={user?.id} />
  if (page === 'jackpot') return <JackpotGame onBack={nav('home')} userId={user?.id} />
  if (page === 'balance') return <BalancePage onBack={nav('home')} userId={user?.id} username={user?.username} />
  if (page === 'leaderboard') return <LeaderboardPage onBack={nav('home')} userId={user?.id} />
  if (page === 'refs') return <ReferralsPage onBack={nav('home')} userId={user?.id} username={user?.username} />
  if (page === 'history') return <GameHistoryPage onBack={nav('home')} userId={user?.id} />

  return (
    <div className="page">
      {/* DAILY BONUS POPUP */}
      <DailyBonus onClaim={(reward) => setXp(x => x + reward)} />

      {/* HEADER */}
      <div className="header">
        <div>
          <div className="t-display">CASINO</div>
          <div className="t-small text-dim" style={{letterSpacing:3,marginTop:2}}>
            PROVABLY FAIR · 2% EDGE · MULTI-CHAIN
          </div>
        </div>
        <div className="header-balance" onClick={nav('balance')} style={{cursor:'pointer'}}>
          ◆ BALANCE
        </div>
      </div>

      {/* XP BAR */}
      <div style={{marginBottom:12}}>
        <XpBar xp={xp} />
      </div>

      {/* STREAK */}
      <Streak userId={user?.id} />

      {/* LIVE FEED */}
      <div style={{marginBottom:16}}>
        <LiveFeed />
      </div>

      {/* DIVIDER */}
      <div className="divider">GAMES</div>

      {/* GAME LIST */}
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {GAMES.map(g => (
          <button key={g.id} className="game-card" onClick={nav(g.id)}>
            <div className="game-card-icon">{g.icon}</div>
            <div style={{flex:1}}>
              <div className="game-card-title">{g.title}</div>
              <div className="game-card-desc">{g.desc}</div>
            </div>
            <div style={{
              fontSize: 10, fontWeight: 800, fontFamily: 'var(--font-mono)',
              color: 'var(--bg)', background: 'var(--primary)',
              letterSpacing: 1, whiteSpace: 'nowrap',
              padding: '3px 8px', borderRadius: 4,
            }}>
              {g.maxMult}
            </div>
          </button>
        ))}
      </div>

      {/* BOTTOM NAV */}
      <div style={{marginTop:24,borderTop:'1px solid var(--border)',paddingTop:16}}>
        <div className="flex gap-sm" style={{flexWrap:'wrap'}}>
          <button className="btn btn-ghost btn-sm" onClick={nav('balance')} style={{flex:'1 1 30%'}}>◆ WALLET</button>
          <button className="btn btn-ghost btn-sm" onClick={nav('history')} style={{flex:'1 1 30%'}}>◇ HISTORY</button>
          <button className="btn btn-ghost btn-sm" onClick={nav('leaderboard')} style={{flex:'1 1 30%'}}>▲ RANK</button>
        </div>
        <div className="flex gap-sm" style={{marginTop:6}}>
          <button className="btn btn-ghost btn-sm" onClick={nav('refs')} style={{flex:'1 1 50%'}}>◇ REFER</button>
          <button className="btn btn-ghost btn-sm" onClick={() => window.open('https://t.me/' + (window as any).BOT_USERNAME, '_blank')} style={{flex:'1 1 50%'}}>◇ HELP</button>
        </div>
      </div>

      {/* FOOTER */}
      <div className="text-center mt-lg" style={{fontSize:9,letterSpacing:3,color:'var(--text-dim)'}}>
        ═══ NEON NIGHT CASINO ═══
      </div>
    </div>
  )
}
