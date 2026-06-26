import { useEffect, useState } from 'react'
import Streak from './components/Streak'
import XpBar from './components/XpBar'
import LiveFeed from './components/LiveFeed'
import DailyBonus from './components/DailyBonus'
import ChainSwitcher, { getActiveChain, type Chain } from './components/ChainSwitcher'
import RecentBets from './components/RecentBets'
import WinToastLayer from './components/WinToast'
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
import { isMuted, toggleMute } from './sound-toggle'
import { hapticTap } from './haptic'
import { GameIcon, NavIcon, type GameId } from './components/Icons'
import './design.css'

type Page = 'home' | 'dice' | 'coinflip' | 'crash' | 'mines' | 'plinko' | 'slots' | 'roulette' | 'limbo' | 'jackpot' | 'balance' | 'leaderboard' | 'refs' | 'history'

type Risk = 'low' | 'medium' | 'high'

interface GameItem {
  id: Page
  icon: GameId
  title: string
  desc: string
  maxMult: string
  risk: Risk
}

const GAMES: GameItem[] = [
  { id: 'dice',    icon: 'dice',     title: 'DICE',    desc: 'Roll over/under · 99% win chance',         maxMult: '99×',   risk: 'low' },
  { id: 'coinflip',icon: 'coinflip', title: 'COINFLIP',desc: 'Heads or tails · 50% win chance',          maxMult: '2×',    risk: 'low' },
  { id: 'crash',   icon: 'crash',    title: 'CRASH',   desc: 'Cash out before rocket crashes',           maxMult: '∞',    risk: 'high' },
  { id: 'mines',   icon: 'mines',    title: 'MINES',   desc: 'Pick gems, avoid bombs · 5×5',             maxMult: '25×',  risk: 'medium' },
  { id: 'plinko',  icon: 'plinko',   title: 'PLINKO',  desc: 'Drop ball · low/med/high risk',             maxMult: '29×',  risk: 'medium' },
  { id: 'slots',   icon: 'slots',    title: 'SLOTS',   desc: 'Match 3 symbols · classic reels',          maxMult: '1000×',risk: 'high' },
  { id: 'roulette',icon: 'roulette', title: 'ROULETTE', desc: 'European · number/color/section',           maxMult: '36×',  risk: 'medium' },
  { id: 'limbo',   icon: 'limbo',    title: 'LIMBO',   desc: 'Target multiplier · fly high',             maxMult: '100×',  risk: 'high' },
  { id: 'jackpot', icon: 'jackpot', title: 'JACKPOT', desc: 'Progressive pool · highest wins',            maxMult: '∞',    risk: 'high' },
]

export default function App() {
  const [displayPage, setDisplayPage] = useState<Page>('home')
  const [fading, setFading] = useState(false)
  const [user, setUser] = useState<{ id: number; username?: string } | null>(null)
  const [xp, setXp] = useState(12400)
  const [chain, setChain] = useState<Chain>(getActiveChain)
  const [muted, setMuted] = useState(isMuted)

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
    if (p === displayPage) return
    setFading(true)
    setTimeout(() => {
      setDisplayPage(p)
      setFading(false)
    }, 120)
  }

  const pageStyle: React.CSSProperties = {
    opacity: fading ? 0 : 1,
    transform: fading ? 'translateY(6px)' : 'translateY(0)',
    transition: 'opacity .12s ease, transform .12s ease',
  }

  const renderPage = () => {
    switch (displayPage) {
      case 'dice': return <DiceGame onBack={nav('home')} userId={user?.id} />
      case 'coinflip': return <CoinflipGame onBack={nav('home')} userId={user?.id} />
      case 'crash': return <CrashGame onBack={nav('home')} userId={user?.id} />
      case 'mines': return <MinesGame onBack={nav('home')} userId={user?.id} />
      case 'plinko': return <PlinkoGame onBack={nav('home')} userId={user?.id} />
      case 'slots': return <SlotsGame onBack={nav('home')} userId={user?.id} />
      case 'roulette': return <RouletteGame onBack={nav('home')} userId={user?.id} />
      case 'limbo': return <LimboGame onBack={nav('home')} userId={user?.id} />
      case 'jackpot': return <JackpotGame onBack={nav('home')} userId={user?.id} />
      case 'balance': return <BalancePage onBack={nav('home')} userId={user?.id} username={user?.username} />
      case 'leaderboard': return <LeaderboardPage onBack={nav('home')} userId={user?.id} />
      case 'refs': return <ReferralsPage onBack={nav('home')} userId={user?.id} username={user?.username} />
      case 'history': return <GameHistoryPage onBack={nav('home')} userId={user?.id} />
      default: return null
    }
  }

  const navTabs: { page: Page; icon: 'home' | 'wallet' | 'history' | 'rank'; label: string }[] = [
    { page: 'home',        icon: 'home',   label: 'HOME' },
    { page: 'balance',     icon: 'wallet', label: 'WALLET' },
    { page: 'history',     icon: 'history',label: 'HISTORY' },
    { page: 'leaderboard', icon: 'rank',   label: 'RANK' },
  ]

  return (
    <div className="page" style={pageStyle}>
      {/* WIN TOAST LAYER — always visible */}
      <WinToastLayer />

      {/* DAILY BONUS POPUP — always visible */}
      <DailyBonus onClaim={(reward) => setXp(x => x + reward)} />

      {displayPage === 'home' ? (
        <>
          {/* HEADER */}
          <div className="header">
            <div>
              <div className="hero-brand">
                <div className="brand-mark">P</div>
                <div>
                  <div className="header-title">PICKR</div>
                  <div className="t-small text-dim hero-subtitle">
                    Premium neon casino. Addictive, fast, and beautifully designed.
                  </div>
                </div>
              </div>
              <div className="hero-meta">
                <span>Provably fair · Instant payouts · Multi-chain</span>
              </div>
              <div style={{marginTop:10, maxWidth:240}}>
                <ChainSwitcher value={chain} onChange={setChain} />
              </div>
            </div>
            <div className="header-actions">
              <button
                onClick={() => { toggleMute(); setMuted(isMuted()) }}
                className="icon-button"
                title={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? '🔇' : '🔊'}
              </button>
              <button className="btn btn-ghost btn-sm header-balance" onClick={nav('balance')}>
                <span className="pill">BALANCE</span>
              </button>
            </div>
          </div>

          {/* HERO SUMMARY */}
          <div className="hero-card">
            <div>
              <div className="hero-card-label">PICKR</div>
              <div className="hero-card-title">Stay on top of every bet</div>
              <div className="hero-card-copy">Track streaks, live winners, and hot games while your balance grows.</div>
            </div>
            <div className="hero-card-badges">
              <span className="badge badge-cyan">TOP RISK</span>
              <span className="badge badge-purple">HIGH REWARDS</span>
            </div>
          </div>

          {/* XP BAR */}
          <div className="section-block">
            <XpBar xp={xp} />
          </div>

          {/* STREAK */}
          <div className="section-block">
            <Streak userId={user?.id} />
          </div>

          {/* LIVE FEED */}
          <div className="section-block">
            <LiveFeed />
          </div>

          {/* RECENT BETS */}
          <div className="section-block">
            <RecentBets userId={user?.id} />
          </div>

          {/* DIVIDER */}
          <div className="divider">GAMES</div>

          {/* GAME LIST */}
          <div className="game-grid">
            {GAMES.map(g => (
              <button key={g.id} className="game-card" onClick={nav(g.id)}>
                <div className="game-card-icon">
                  <GameIcon game={g.icon} />
                </div>
                <div style={{flex:1}}>
                  <div className="game-card-title">{g.title}</div>
                  <div className="game-card-desc">{g.desc}</div>
                </div>
                <div className={`game-card-badge badge-${g.risk}`}>
                  {g.maxMult}
                </div>
              </button>
            ))}
          </div>

          {/* BOTTOM LINKS — secondary actions */}
          <div className="action-row">
            <button className="btn btn-ghost btn-sm" onClick={nav('refs')}>◇ REFER A FRIEND</button>
            <button className="btn btn-ghost btn-sm" onClick={() => window.open('https://t.me/' + (window as any).BOT_USERNAME, '_blank')}>◇ HELP</button>
          </div>

          {/* FOOTER */}
          <div className="footer-copy">
            ═══ PICKR — NEON NIGHT CASINO ═══
          </div>
        </>
      ) : renderPage()}

      {/* FIXED BOTTOM NAV — always visible on all pages */}
      <nav className="bottom-nav">
        {navTabs.map(t => (
          <button
            key={t.page}
            className={`nav-item${displayPage === t.page ? ' active' : ''}`}
            onClick={nav(t.page)}
          >
            <span className="nav-icon"><NavIcon name={t.icon} /></span>
            <span className="nav-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
