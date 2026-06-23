import { useState, useCallback, useEffect, useRef } from 'react'
import { useGameFeedback } from '../hooks'
import { isRateLimited, RateLimitBanner } from '../rate-limit-ui'

interface CrashGameProps {
  onBack: () => void
  userId?: number
}

interface CrashResult {
  crashPoint: number
  playerWon: boolean
  payout: number
  payoutMultiplier: number
  resultHash: string
  nonce: number
  clientSeed: string
}

const QUICK_BETS = [100, 250, 500, 1000, 2500]

export default function CrashGame({ onBack, userId }: CrashGameProps) {
  const [betAmount, setBetAmount] = useState(500)
  const [autoCashoutMultiplier, setAutoCashoutMultiplier] = useState(2.0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CrashResult | null>(null)

  useGameFeedback(result)
  const [balance, setBalance] = useState<number | null>(null)

  // Crash animation state
  const [animating, setAnimating] = useState(false)
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0)
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  // Fetch real balance from API on mount
  useEffect(() => {
    if (!userId) return
    fetch(`/api/balance?userId=${userId}`)
      .then(r => r.json())
      .then(data => {
        if (data.evm !== undefined) {
          setBalance(parseFloat(data.evm) || 0)
        }
      })
      .catch(() => setBalance(0))
  }, [userId])

  // Cleanup animation interval on unmount
  useEffect(() => {
    return () => {
      if (animRef.current) clearInterval(animRef.current)
    }
  }, [])

  const handleQuickBet = useCallback((amount: number) => {
    setBetAmount(amount)
  }, [])

  const startAnimation = useCallback((crashPoint: number) => {
    setAnimating(true)
    setCurrentMultiplier(1.0)
    startTimeRef.current = Date.now()

    animRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const mult = Math.min(Math.exp(0.1 * elapsed), crashPoint)
      setCurrentMultiplier(mult)

      if (mult >= crashPoint) {
        if (animRef.current) clearInterval(animRef.current)
        animRef.current = null
        setAnimating(false)
      }
    }, 50)
  }, [])

  const handlePlay = useCallback(async () => {
    if (loading || balance === null || betAmount <= 0 || betAmount > balance) return

    setLoading(true)
    setResult(null)
    setAnimating(false)
    setCurrentMultiplier(1.0)
    if (animRef.current) clearInterval(animRef.current)

    try {
      const initData = (window as any).Telegram?.WebApp?.initData || ''
      const res = await fetch('/api/crash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: betAmount,
          autoCashoutMultiplier,
          initData,
          userId,
        }),
      })
      const data: CrashResult = await res.json()

      // Start crash animation
      startAnimation(data.crashPoint)

      // Update balance
      if (data.playerWon) {
        setBalance(prev => prev !== null ? prev + data.payout : prev)
      } else {
        setBalance(prev => prev !== null ? prev - betAmount : prev)
      }

      // Show result overlay after animation completes
      setTimeout(() => {
        setResult(data)
      }, Math.ceil(Math.log(data.crashPoint) / 0.1 * 1000) + 200)
    } catch (err) {
      console.error('Crash API error:', err)
    } finally {
      setLoading(false)
    }
  }, [betAmount, autoCashoutMultiplier, loading, balance, userId, startAnimation])

  const displayMultiplier = animating ? currentMultiplier : (result ? result.crashPoint : 1.0)
  const crashed = result && !result.playerWon

  // Compute graph dimensions for the animated crash line
  const graphProgress = Math.min(((displayMultiplier - 1) / Math.max(displayMultiplier, 2)) * 100, 100)

  return (
    <div className="page">
      {/* Header — .header with .btn-back, .header-title, .header-balance */}
      <div className="header">
        <button className="btn-back" onClick={onBack}>BACK</button>
        <span className="header-title">🚀 CRASH</span>
        <span className="header-balance">
          {balance !== null
            ? balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : '---'}
        </span>
      </div>

      {/* Crash Graph — .crash-graph with .crash-line and .crash-label */}
      <div className="crash-graph">
        {animating || result ? (
          <>
            <div className="crash-line" style={{ width: graphProgress + '%', height: graphProgress * 0.9 + '%' }} />
            <div className={"crash-label " + (crashed ? 'text-red' : 'text-green')}>
              ×{displayMultiplier.toFixed(2)}
            </div>
          </>
        ) : (
          <div className="crash-label text-dim">WAITING...</div>
        )}
      </div>

      {/* Bet Amount — .term-box / .term-box-hd / .term-box-bd / .chips / .chip */}
      <div className="term-box">
        <div className="term-box-hd"><span>BET AMOUNT</span></div>
        <div className="term-box-bd">
          <div className="chips">
            {QUICK_BETS.map(amount => (
              <button
                key={amount}
                className={"chip" + (betAmount === amount ? " active" : "")}
                onClick={() => handleQuickBet(amount)}
              >
                {amount}
              </button>
            ))}
          </div>
          <input
            className="input"
            type="number"
            min={1}
            max={balance ?? undefined}
            value={betAmount}
            onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 0))}
          />
        </div>
      </div>

      {/* Auto Cashout — .term-box */}
      <div className="term-box">
        <div className="term-box-hd"><span>AUTO CASHOUT</span></div>
        <div className="term-box-bd">
          <input
            className="input"
            type="number"
            min={1.01}
            max={10000}
            step={0.01}
            value={autoCashoutMultiplier}
            onChange={(e) =>
              setAutoCashoutMultiplier(Math.max(1.01, parseFloat(e.target.value) || 1.01))
            }
          />
        </div>
      </div>

      {/* Launch — .btn .btn-green */}
      <button
        className="btn btn-green"
        onClick={handlePlay}
        disabled={loading || balance === null || betAmount <= 0 || betAmount > (balance ?? 0)}
      >
        {loading ? "🚀 LAUNCHING..." : animating ? `×${currentMultiplier.toFixed(2)}` : "🚀 LAUNCH"}
      </button>

      {isRateLimited(result) && <RateLimitBanner data={result} />}
      {/* Result Modal — .overlay / .result / .result-win / .result-lose */}
      {result && !animating && (
        <div className="overlay" onClick={() => setResult(null)}>
          <div
            className={"result " + (result.playerWon ? "result-win" : "result-lose")}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="result-label">
              {result.playerWon ? "CASHED OUT ✅" : "CRASHED 💥"}
            </div>
            <div className="result-number">
              ×{result.crashPoint.toFixed(2)}
            </div>
            <div className={result.playerWon ? "result-label win" : "result-label lose"}>
              {result.playerWon
                ? `+${result.payout.toLocaleString()} (+×${result.payoutMultiplier.toFixed(2)})`
                : `-${betAmount.toLocaleString()} LOST`}
            </div>
            <div className="result-detail">
              Cashout: ×{result.payoutMultiplier.toFixed(2)}
            </div>
            <div className="result-hash">
              HASH: {result.resultHash}
            </div>
            <div className="result-hash">
              NONCE: {result.nonce} · CLIENT SEED: {result.clientSeed}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
