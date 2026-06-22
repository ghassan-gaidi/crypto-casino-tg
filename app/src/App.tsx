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

type Page = 'home' | 'dice' | 'coinflip' | 'crash' | 'mines' | 'plinko' | 'slots' | 'roulette' | 'limbo' | 'jackpot' | 'balance'

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void
        expand: () => void
        close: () => void
        MainButton: {
          setText: (text: string) => void
          show: () => void
          hide: () => void
          onClick: (fn: () => void) => void
        }
        initDataUnsafe?: {
          user?: {
            id: number
            username?: string
            first_name?: string
          }
        }
      }
    }
  }
}

export default function App() {
  const [page, setPage] = useState<Page>('home')
  const [user, setUser] = useState<{ id: number; username?: string } | null>(null)

  useEffect(() => {
    // Init Telegram Mini App
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
    <div style={{ padding: '16px', maxWidth: 480, margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        padding: '24px 0 32px',
        borderBottom: '1px solid #1a1a2e',
      }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#fff', letterSpacing: 2 }}>
          🎰 CASINO
        </h1>
        <p style={{ color: '#666', fontSize: 13, marginTop: 4 }}>
          Provably fair · 2% edge · Multi-chain
        </p>
      </div>

      {/* Game cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
        <GameCard
          emoji="🎲"
          title="Dice"
          subtitle="Roll over/under — 99% win chance"
          onClick={nav('dice')}
        />
        <GameCard
          emoji="🪙"
          title="Coinflip"
          subtitle="Heads or tails — 50% win chance"
          onClick={nav('coinflip')}
        />
        <GameCard
          emoji="🚀"
          title="Crash"
          subtitle="Cash out before the rocket crashes"
          onClick={nav('crash')}
        />
        <GameCard
          emoji="⛏️"
          title="Mines"
          subtitle="Pick gems, avoid bombs — 5×5 grid"
          onClick={nav('mines')}
        />
        <GameCard
          emoji="📍"
          title="Plinko"
          subtitle="Drop the ball — low/medium/high risk"
          onClick={nav('plinko')}
        />
        <GameCard
          emoji="🎰"
          title="Slots"
          subtitle="Classic slot machine — match 3 symbols"
          onClick={nav('slots')}
        />
        <GameCard
          emoji="🎡"
          title="Roulette"
          subtitle="European roulette — number, color, section bets"
          onClick={nav('roulette')}
        />
        <GameCard
          emoji="🚀"
          title="Limbo"
          subtitle="Rocket multiplier — set a target and fly!"
          onClick={nav('limbo')}
        />
        <GameCard
          emoji="🎰"
          title="Jackpot"
          subtitle="Progressive pool — highest wins!"
          onClick={nav('jackpot')}
        />
      </div>

      {/* Quick links */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginTop: 32,
        padding: '16px 0',
        borderTop: '1px solid #1a1a2e',
      }}>
        <QuickLink label="💰 Balance" onClick={nav('balance')} />
        <QuickLink label="🔍 Verify" onClick={() => {}} />
        <QuickLink label="❓ Help" onClick={() => window.open('https://t.me/' + (window as any).BOT_USERNAME, '_blank')} />
      </div>
    </div>
  )
}

function GameCard({ emoji, title, subtitle, onClick }: {
  emoji: string
  title: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '20px 24px',
        background: '#111',
        border: '1px solid #1a1a2e',
        borderRadius: 12,
        color: '#e0e0e0',
        cursor: 'pointer',
        fontSize: 16,
        textAlign: 'left',
        width: '100%',
        transition: 'background 0.2s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#1a1a2e')}
      onMouseLeave={e => (e.currentTarget.style.background = '#111')}
    >
      <span style={{ fontSize: 32 }}>{emoji}</span>
      <div>
        <div style={{ fontWeight: 600, color: '#fff' }}>{title}</div>
        <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{subtitle}</div>
      </div>
    </button>
  )
}

function QuickLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '10px 0',
        background: 'transparent',
        border: '1px solid #1a1a2e',
        borderRadius: 8,
        color: '#888',
        cursor: 'pointer',
        fontSize: 13,
      }}
    >
      {label}
    </button>
  )
}
