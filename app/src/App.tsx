import { useEffect, useState } from 'react'
import Streak from './components/Streak'
import XpBar from './components/XpBar'
import LiveFeed from './components/LiveFeed'
import DailyBonus from './components/DailyBonus'
import ChainSwitcher, { getActiveChain, type Chain } from './components/ChainSwitcher'
import RecentBets from './components/RecentBets'
import WinToastLayer from './components/WinToast'
import WalletButton from './components/WalletButton'
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
  { id: 'dice' as const,    icon: '/icons/icon-dice.svg',    title: 'DICE',    desc: 'Roll over/under  ·  99% win chance',    maxMult: '99×' },
  { id: 'coinflip' as const,icon: '/icons/icon-coinflip.svg',title: 'COINFLIP',desc: 'Heads or tails  ·  50% win chance',     maxMult: '2×' },
  { id: 'crash' as const,   icon: '/icons/icon-crash.svg',   title: 'CRASH',   desc: 'Cash out before rocket crashes',        maxMult: '∞' },
  { id: 'mines' as const,   icon: '/icons/icon-mines.svg',   title: 'MINES',   desc: 'Pick gems, avoid bombs  ·  5×5',       maxMult: '25×' },
  { id: 'plinko' as const,  icon: '/icons/icon-plinko.svg',  title: 'PLINKO',  desc: 'Drop ball  ·  low/med/high risk',       maxMult: '29×' },
  { id: 'slots' as const,   icon: '/icons/icon-slots.svg',   title: 'SLOTS',   desc: 'Match 3 symbols  ·  classic reels',    maxMult: '1000×' },
  { id: 'roulette' as const,icon: '/icons/icon-roulette.svg',title: 'ROULETTE', desc: 'European  ·  number/color/section',    maxMult: '36×' },
  { id: 'limbo' as const,   icon: '/icons/icon-limbo.svg',   title: 'LIMBO',   desc: 'Target multiplier  ·  fly high',       maxMult: '100×' },
  { id: 'jackpot' as const, icon: '/icons/icon-jackpot.svg', title: 'JACKPOT', desc: 'Progressive pool  ·  highest wins',    maxMult: '∞' },
]

const NAV_TABS = [
  { page: 'home' as const,        icon: '/icons/nav-home.svg',   iconActive: '/icons/nav-home-active.svg',   label: 'HOME' },
  { page: 'balance' as const,     icon: '/icons/nav-wallet.svg', iconActive: '/icons/nav-wallet-active.svg', label: 'WALLET' },
  { page: 'history' as const,     icon: '/icons/nav-history.svg',iconActive: '/icons/nav-history-active.svg',label: 'HISTORY' },
  { page: 'leaderboard' as const, icon: '/icons/nav-rank.svg',   iconActive: '/icons/nav-rank-active.svg',   label: 'RANK' },
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

  return (
    <div className="page" style={pageStyle}>
      {/* AMBIENT PARTICLES — subtle floating orbs */}
      <div className="ambient-particles">
        <div className="ambient-particle"></div>
        <div className="ambient-particle"></div>
        <div className="ambient-particle"></div>
      </div>

      {/* PICKAXE WATERMARK — ghost branding */}
      <div className="page-watermark">
        <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
          <path d="M 256 380 L 256 130 L 180 60 L 180 30 L 256 100 L 332 30 L 332 60 L 256 130 L 256 200 L 340 200 Q 380 200 380 250 Q 380 300 340 300 L 256 300"
                fill="none" stroke="#DC2626" strokeWidth="20" strokeLinecap="square" strokeLinejoin="miter"/>
        </svg>
      </div>

      {/* WIN TOAST LAYER */}
      <WinToastLayer />

      {/* DAILY BONUS POPUP */}
      <DailyBonus onClaim={(reward) => setXp(x => x + reward)} />

      {displayPage === 'home' ? (
        <>
          {/* HEADER */}
          <div className="header">
            <div>
              <div className="header-logo">
                <svg className="header-logo-svg" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 32 46 L 32 20 L 24 14 L 24 12 L 32 18 L 40 12 L 40 14 L 32 20 L 32 26 L 44 26 Q 48 26 48 32 Q 48 38 44 38 L 32 38"
                        fill="none" stroke="#DC2626" stroke-width="3.5" stroke-linecap="square" stroke-linejoin="miter"/>
                </svg>
                <div className="t-display" style={{color:'var(--cyan)'}}>PICKR</div>
              </div>
              <div className="t-small" style={{letterSpacing:3,marginTop:2}}>
                PICK. PLAY. PROVE.
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
                  lineHeight:1, padding:6, opacity:0.6, borderRadius:4,
                  display:'flex', alignItems:'center',
                }}
                title={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3A3A50" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
                    <polygon points="3,10 7,10 12,5 12,19 7,14 3,14" />
                    <line x1="18" y1="9" x2="22" y2="15" /><line x1="22" y1="9" x2="18" y2="15" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4D4E0" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
                    <polygon points="3,10 7,10 12,5 12,19 7,14 3,14" />
                    <path d="M 15 9 Q 18 12 15 15" /><path d="M 17 6 Q 22 12 17 18" />
                  </svg>
                )}
              </button>
              <WalletButton />
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
                <div className="game-card-icon">
                  <img src={g.icon} alt={g.title} width="28" height="28" />
                </div>
                <div style={{flex:1}}>
                  <div className="game-card-title">{g.title}</div>
                  <div className="game-card-desc">{g.desc}</div>
                </div>
                <div style={{
                  fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-mono)',
                  color: 'var(--gold)', background: 'rgba(255,184,0,0.1)',
                  letterSpacing: 1, whiteSpace: 'nowrap',
                  padding: '3px 8px', borderRadius: 4,
                }}>
                  {g.maxMult}
                </div>
              </button>
            ))}
          </div>

          {/* BOTTOM LINKS */}
          <div style={{marginTop:24, display:'flex', gap:8, flexWrap:'wrap'}}>
            <button className="btn btn-ghost btn-sm" onClick={nav('refs')} style={{flex:'1 1 45%',display:'flex',alignItems:'center',gap:6,justifyContent:'center'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg>
              REFER A FRIEND
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => window.open('https://t.me/' + (window as any).BOT_USERNAME, '_blank')} style={{flex:'1 1 45%',display:'flex',alignItems:'center',gap:6,justifyContent:'center'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              HELP
            </button>
          </div>

          {/* FOOTER */}
          <div className="text-center" style={{fontSize:9,letterSpacing:4,color:'var(--text-muted)',paddingBottom:16}}>
            ═══ PICKR ═══
          </div>
        </>
      ) : renderPage()}

      {/* FIXED BOTTOM NAV */}
      <nav className="bottom-nav">
        {NAV_TABS.map(t => {
          const active = displayPage === t.page
          return (
            <button
              key={t.page}
              className={`nav-item${active ? ' active' : ''}`}
              onClick={nav(t.page)}
            >
              <span className="nav-icon">
                <img src={active ? t.iconActive : t.icon} alt={t.label} width="20" height="20" />
              </span>
              <span className="nav-label">{t.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
