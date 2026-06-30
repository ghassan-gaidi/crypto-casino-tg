/* ═══════════════════════════════════════════════════════════════
   WinToast — floating notification for big wins
   Shows briefly then auto-dismisses. Stacks up to 3.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useState, useRef } from 'react'

export interface Toast {
  id: number
  game: string
  amount: number
  multiplier: number
  icon: string
}

let _nextId = 0
let _listeners: ((toasts: Toast[]) => void)[] = []
let _toasts: Toast[] = []

function notify() {
  _listeners.forEach(fn => fn([..._toasts]))
}

export function showWinToast(game: string, amount: number | string, multiplier: number, icon: string) {
  if (multiplier < 2) return // only show for decent wins
  const t: Toast = { id: _nextId++, game, amount: typeof amount === 'string' ? parseFloat(amount) : amount, multiplier, icon }
  _toasts = [..._toasts.slice(-2), t] // max 3
  notify()
  setTimeout(() => {
    _toasts = _toasts.filter(x => x.id !== t.id)
    notify()
  }, 3500)
}

const GAME_COLORS: Record<string, string> = {
  dice: '#DC2626',
  coinflip: '#A855F7',
  crash: '#FFB800',
  mines: '#FF3366',
  plinko: '#00FF88',
  slots: '#FFB800',
  roulette: '#FF3366',
  limbo: '#DC2626',
  jackpot: '#FFD700',
}

function GameIconSVG({ game }: { game: string }) {
  const s = { width: 18, height: 18, display: 'block' as const }
  switch (game) {
    case 'dice':
      return (
        <svg {...s} viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="9" cy="9" r="1.5" fill="currentColor" />
          <circle cx="15" cy="15" r="1.5" fill="currentColor" />
        </svg>
      )
    case 'coinflip':
      return (
        <svg {...s} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M12 4v16" stroke="currentColor" strokeWidth="2" opacity="0.5" />
          <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.25" />
        </svg>
      )
    case 'crash':
      return (
        <svg {...s} viewBox="0 0 24 24" fill="none">
          <path d="M2 20L8 12L14 16L22 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      )
    case 'mines':
      return (
        <svg {...s} viewBox="0 0 24 24" fill="none">
          <path d="M12 2L22 12L12 22L2 12Z" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      )
    case 'plinko':
      return (
        <svg {...s} viewBox="0 0 24 24" fill="none">
          <path d="M12 3L21 20H3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none" />
          <circle cx="12" cy="14" r="1.5" fill="currentColor" opacity="0.5" />
          <circle cx="8" cy="18" r="1" fill="currentColor" opacity="0.5" />
          <circle cx="16" cy="18" r="1" fill="currentColor" opacity="0.5" />
        </svg>
      )
    case 'slots':
      return (
        <svg {...s} viewBox="0 0 24 24" fill="none">
          <rect x="2" y="4" width="5.5" height="16" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
          <rect x="9.25" y="4" width="5.5" height="16" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
          <rect x="16.5" y="4" width="5.5" height="16" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      )
    case 'roulette':
      return (
        <svg {...s} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <path d="M12 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M3 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M17 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'limbo':
      return (
        <svg {...s} viewBox="0 0 24 24" fill="none">
          <path d="M4 18L12 6L20 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M12 6v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        </svg>
      )
    case 'jackpot':
      return (
        <svg {...s} viewBox="0 0 24 24" fill="none">
          <path d="M12 2L15 9H22L16 14L18 22L12 17L6 22L8 14L2 9H9Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
        </svg>
      )
    default:
      return (
        <svg {...s} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
  }
}

export default function WinToastLayer() {
  const [toasts, setToasts] = useState<Toast[]>(_toasts)
  const listenerRef = useRef(setToasts)

  useEffect(() => {
    listenerRef.current = setToasts
    const handler = (t: Toast[]) => listenerRef.current(t)
    _listeners.push(handler)
    return () => { _listeners = _listeners.filter(x => x !== handler) }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div style={{
      position: 'fixed',
      top: 12,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      width: 'min(380px, calc(100vw - 32px))',
      pointerEvents: 'none',
    }}>
      {toasts.map((t) => {
        const color = GAME_COLORS[t.game] || '#DC2626'
        return (
          <div
            key={t.id}
            style={{
              background: 'linear-gradient(135deg, rgba(220,38,54,.12), rgba(220,38,54,.06))',
              border: '1px solid rgba(220,38,54,.25)',
              borderRadius: 10,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: '0 4px 20px rgba(220,38,54,.15), 0 0 40px rgba(220,38,54,.06)',
              animation: 'toast-in 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
              opacity: 0,
              pointerEvents: 'auto',
            }}
          >
            <span style={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(220,38,54,.1)',
              borderRadius: 8,
              color: color,
              flexShrink: 0,
            }}>
              <GameIconSVG game={t.game} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 2,
                color: '#DC2626',
                textTransform: 'uppercase',
              }}>
                BIG WIN
              </div>
              <div style={{
                fontSize: 11,
                color: '#8B8BA3',
                marginTop: 1,
                fontFamily: 'var(--font)',
              }}>
                <span style={{ color: '#fff', fontWeight: 600 }}>{t.game.toUpperCase()}</span>
                {' · '}
                <span style={{ color: '#DC2626', fontWeight: 700 }}>{t.multiplier}×</span>
              </div>
            </div>
            <div style={{
              fontSize: 13,
              fontWeight: 800,
              color: '#DC2626',
              fontFamily: 'var(--font)',
              textShadow: '0 0 8px rgba(220,38,54,.4)',
              whiteSpace: 'nowrap',
            }}>
              +{t.amount.toFixed(4)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
