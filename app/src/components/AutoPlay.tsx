/* ═══════════════════════════════════════════════════════════════
   AutoPlay — Automated betting with stop conditions
   ═══════════════════════════════════════════════════════════════ */

import { useState, useRef, useCallback } from 'react'

interface Props {
  onPlay: () => Promise<void>
  disabled: boolean
  balance: number | null
}

const BET_COUNTS = [10, 25, 50, 100, Infinity]

export default function AutoPlay({ onPlay, disabled, balance }: Props) {
  const [open, setOpen] = useState(false)
  const [running, setRunning] = useState(false)
  const [numBets, setNumBets] = useState(10)
  const [stopOnWin, setStopOnWin] = useState('')
  const [stopOnLose, setStopOnLose] = useState('')
  const [stopOnBalance, setStopOnBalance] = useState('')
  const [played, setPlayed] = useState(0)
  const [wins, setWins] = useState(0)
  const [profit, setProfit] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const runningRef = useRef(false)

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = null
    runningRef.current = false
    setRunning(false)
  }, [])

  const start = useCallback(() => {
    if (running || disabled) return
    runningRef.current = true
    setRunning(true)
    setPlayed(0)
    setWins(0)
    setProfit(0)
    let count = 0

    intervalRef.current = setInterval(async () => {
      if (!runningRef.current) return
      if (count >= numBets) { stop(); return }
      if (balance != null && balance <= 0) { stop(); return }
      try {
        await onPlay()
        count++
        setPlayed(count)
      } catch {}
    }, 1200)
  }, [running, disabled, numBets, onPlay, balance, stop])

  return (
    <div style={{ marginTop: 12 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'none', border: 'none', color: 'var(--purple)',
          fontFamily: 'var(--font)', fontSize: 10, cursor: 'pointer',
          letterSpacing: 1, padding: '4px 0', opacity: 0.7,
        }}
      >
        {open ? 'HIDE' : 'SHOW'} AUTO-PLAY
      </button>

      {open && (
        <div style={{
          marginTop: 8, padding: 12,
          border: '1px solid var(--border)', background: 'var(--surface)',
        }}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1.5, marginBottom: 6 }}>NUMBER OF BETS</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {BET_COUNTS.map(n => (
                <button
                  key={n}
                  className={'chip' + (numBets === n ? ' active' : '')}
                  onClick={() => setNumBets(n)}
                  style={{ flex: 1, fontSize: 10 }}
                >
                  {n === Infinity ? '∞' : n}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1, marginBottom: 4 }}>STOP ON WIN</div>
              <input
                className="input"
                type="number" placeholder="0.0"
                value={stopOnWin}
                onChange={e => setStopOnWin(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', fontSize: 10 }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1, marginBottom: 4 }}>STOP ON LOSS</div>
              <input
                className="input"
                type="number" placeholder="0.0"
                value={stopOnLose}
                onChange={e => setStopOnLose(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', fontSize: 10 }}
              />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1, marginBottom: 4 }}>STOP AT BALANCE</div>
            <input
              className="input"
              type="number" placeholder="0.0"
              value={stopOnBalance}
              onChange={e => setStopOnBalance(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', fontSize: 10 }}
            />
          </div>

          {running && (
            <div style={{ display: 'flex', gap: 16, marginBottom: 10, fontSize: 11 }}>
              <div><span style={{ color: 'var(--text-dim)' }}>BETS: </span><span style={{ color: 'var(--white)' }}>{played}/{numBets === Infinity ? '∞' : numBets}</span></div>
              <div><span style={{ color: 'var(--text-dim)' }}>WINS: </span><span style={{ color: 'var(--green)' }}>{wins}</span></div>
              <div><span style={{ color: 'var(--text-dim)' }}>P/L: </span><span style={{ color: profit >= 0 ? 'var(--green)' : 'var(--red)' }}>{profit >= 0 ? '+' : ''}{profit.toFixed(4)}</span></div>
            </div>
          )}

          <button
            onClick={running ? stop : start}
            disabled={!running && disabled}
            style={{
              width: '100%', padding: '10px 0',
              background: running ? 'var(--red)' : 'var(--purple)',
              border: 'none', color: 'var(--white)',
              fontFamily: 'var(--font)', fontSize: 11, fontWeight: 700,
              letterSpacing: 2, cursor: 'pointer',
              opacity: !running && disabled ? 0.5 : 1,
            }}
          >
            {running ? 'STOP' : 'START AUTO'}
          </button>
        </div>
      )}
    </div>
  )
}
