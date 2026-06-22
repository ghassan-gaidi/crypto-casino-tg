import { useEffect, useState } from 'react'
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
import './design.css'

type Page = 'home' | 'dice' | 'coinflip' | 'crash' | 'mines' | 'plinko' | 'slots' | 'roulette' | 'limbo' | 'jackpot' | 'balance'

const GAMES = [
  { id: 'dice' as const,    icon: '◆', title: 'DICE',    desc: 'Roll over/under  ·  99% win chance' },
  { id: 'coinflip' as const,icon: '◑', title: 'COINFLIP',desc: 'Heads or tails  ·  50% win chance' },
  { id: 'crash' as const,   icon: '↗', title: 'CRASH',   desc: 'Cash out before rocket crashes' },
  { id: 'mines' as const,   icon: '⛏', title: 'MINES',   desc: 'Pick gems, avoid bombs  ·  5×5' },
  { id: 'plinko' as const,  icon: '▼', title: 'PLINKO',  desc: 'Drop ball  ·  low/med/high risk' },
  { id: 'slots' as const,   icon: '≡', title: 'SLOTS',   desc: 'Match 3 symbols  ·  classic reels' },
  { id: 'roulette' as const,icon: '◎', title: 'ROULETTE', desc: 'European  ·  number/color/section' },
  { id: 'limbo' as const,   icon: '↑', title: 'LIMBO',   desc: 'Target multiplier  ·  fly high' },
  { id: 'jackpot' as const, icon: '★', title: 'JACKPOT', desc: 'Progressive pool  ·  highest wins' },
]

export default function App() {
  const [page, setPage] = useState<Page>('home')
  const [user, setUser] = useState<{ id: number; username?: string } | null>(null)

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg) {
      tg.ready()
      tg.expand()
      const u = tg.initDataUnsafe?.user
      if (u) setUser({ id: u.id, username: u.username })
    }
  }, [])

  const nav = (p: Page) => () => setPage(p)

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

  return (
    <div className="page">
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

      {/* DIVIDER */}
      <div className="divider">GAMES</div>

      {/* GAME LIST */}
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {GAMES.map(g => (
          <button key={g.id} className="game-card" onClick={nav(g.id)}>
            <div className="game-card-icon">{g.icon}</div>
            <div>
              <div className="game-card-title">{g.title}</div>
              <div className="game-card-desc">{g.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* BOTTOM LINKS */}
      <div style={{marginTop:24,borderTop:'1px solid var(--border)',paddingTop:16}}>
        <div className="flex gap-sm">
          <button className="btn btn-ghost btn-sm" onClick={nav('balance')} style={{flex:1}}>◆ BALANCE</button>
          <button className="btn btn-ghost btn-sm" onClick={() => {}} style={{flex:1}}>◇ VERIFY</button>
          <button className="btn btn-ghost btn-sm" onClick={() => window.open('https://t.me/' + (window as any).BOT_USERNAME, '_blank')} style={{flex:1}}>◇ HELP</button>
        </div>
      </div>

      {/* FOOTER */}
      <div className="text-center text-muted mt-lg" style={{fontSize:9,letterSpacing:3}}>
        ─── END TRANSMISSION ───
      </div>
    </div>
  )
}
