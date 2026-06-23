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

const GAMES: Record<string, { icon: string; color: string }> = {
  dice: { icon: '◆', color: '#00F0FF' },
  coinflip: { icon: '◑', color: '#A855F7' },
  crash: { icon: '↗', color: '#FFB800' },
  mines: { icon: '⛏', color: '#FF3366' },
  plinko: { icon: '▼', color: '#00FF88' },
  slots: { icon: '≡', color: '#FFB800' },
  roulette: { icon: '◎', color: '#FF3366' },
  limbo: { icon: '↑', color: '#00F0FF' },
  jackpot: { icon: '★', color: '#FFD700' },
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
        const meta = GAMES[t.game] || { icon: '🎰', color: '#00F0FF' }
        return (
          <div
            key={t.id}
            style={{
              background: 'linear-gradient(135deg, rgba(0,255,136,.12), rgba(0,240,255,.08))',
              border: '1px solid rgba(0,255,136,.3)',
              borderRadius: 10,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: '0 4px 20px rgba(0,255,136,.15), 0 0 40px rgba(0,255,136,.08)',
              animation: 'toast-in 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
              opacity: 0,
              pointerEvents: 'auto',
            }}
          >
            <span style={{
              fontSize: 20,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,255,136,.1)',
              borderRadius: 8,
              color: meta.color,
              flexShrink: 0,
            }}>
              {meta.icon}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 2,
                color: '#00FF88',
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
                <span style={{ color: '#00FF88', fontWeight: 700 }}>{t.multiplier}×</span>
              </div>
            </div>
            <div style={{
              fontSize: 13,
              fontWeight: 800,
              color: '#00FF88',
              fontFamily: 'var(--font)',
              textShadow: '0 0 8px rgba(0,255,136,.4)',
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
