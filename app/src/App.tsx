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

  const navTabs: { page: Page; icon: string; label: string }[] = [
    { page: 'home',        icon: '⌂',  label: 'HOME' },
    { page: 'balance',     icon: '◆',  label: 'WALLET' },
    { page: 'history',     icon: '◇',  label: 'HISTORY' },
    { page: 'leaderboard', icon: '▲',  label: 'RANK' },
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
              <div className="t-display">CASINO</div>
              <div className="t-small text-dim" style={{letterSpacing:3,marginTop:2}}>
                PROVABLY FAIR · 2% EDGE · MULTI-CHAIN
              </div>
              <div style={{marginTop:8, maxWidth:220}}>
                <ChainSwitcher value={chain} onChange={setChain} />
              </div>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <button
                onClick={() => { toggleMute(); setMuted(isMuted()) }}
                style={{
                  background:'none', border:'none', cursor:'pointer',
                  fontSize:16, lineHeight:1, padding:4, opacity:0.7,
                }}
                title={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? '🔇' : '🔊'}
              </button>
              <div className="header-balance" onClick={nav('balance')} style={{cursor:'pointer'}}>
                ◆ BALANCE
              </div>
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
          {/* RECENT BETS */}
          <div style={{marginBottom:16}}>
            <RecentBets userId={user?.id} />
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

          {/* BOTTOM LINKS — secondary actions */}
          <div style={{marginTop:24, display:'flex', gap:8, flexWrap:'wrap'}}>
            <button className="btn btn-ghost btn-sm" onClick={nav('refs')} style={{flex:'1 1 45%'}}>◇ REFER A FRIEND</button>
            <button className="btn btn-ghost btn-sm" onClick={() => window.open('https://t.me/' + (window as any).BOT_USERNAME, '_blank')} style={{flex:'1 1 45%'}}>◇ HELP</button>
          </div>

          {/* FOOTER */}
          <div className="text-center" style={{fontSize:9,letterSpacing:3,color:'var(--text-dim)',paddingBottom:16}}>
            ═══ NEON NIGHT CASINO ═══
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
            <span className="nav-icon">{t.icon}</span>
            <span className="nav-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
