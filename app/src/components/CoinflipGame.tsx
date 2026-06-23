import { useState } from 'react'
import { useGameFeedback } from '../hooks'
import ShareWin from './ShareWin'
import { isRateLimited, RateLimitBanner } from '../rate-limit-ui'

interface Props {
  onBack: () => void
  userId?: number
}

export default function CoinflipGame({ onBack }: Props) {
  const [betAmount, setBetAmount] = useState('0.01')
  const [pick, setPick] = useState<'heads' | 'tails' | null>(null)
  const [result, setResult] = useState<{
    result: 'heads' | 'tails'
    playerWon: boolean
    payout: number
    payoutMultiplier: number
  } | null>(null)

  useGameFeedback(result)
  const [loading, setLoading] = useState(false)
  const [flipping, setFlipping] = useState(false)

  const quickBets = ['0.001', '0.01', '0.1', '1.0']

  const placeBet = async () => {
    if (!pick) return
    setLoading(true)
    setFlipping(true)
    setResult(null)

    try {
      const res = await fetch(`/api/coinflip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(betAmount),
          pick,
          initData: window.Telegram?.WebApp?.initData,
        }),
      })
      const data = await res.json()
      // Simulate flip animation
      setTimeout(() => {
        setResult(data)
        setFlipping(false)
        setLoading(false)
      }, 800)
    } catch (err) {
      setFlipping(false)
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <button className="btn-back" onClick={onBack}>
        Back
      </button>

      <div className="s-title">COINFLIP</div>

      {/* Quick bet amounts */}
      <div className="chips">
        {quickBets.map(amt => (
          <button
            key={amt}
            onClick={() => setBetAmount(amt)}
            className={"chip" + (betAmount === amt ? " active" : "")}
          >
            {amt}
          </button>
        ))}
      </div>

      {/* Bet input */}
      <div className="term-box mb-md">
        <div className="term-box-hd">
          <span>AMOUNT</span>
        </div>
        <div className="term-box-bd">
          <input
            type="number"
            step="0.001"
            value={betAmount}
            onChange={e => setBetAmount(e.target.value)}
            className="input"
          />
        </div>
      </div>

      {/* Pick */}
      <div className="divider">PICK SIDE</div>
      <div className="pick-row">
        <button
          onClick={() => setPick('heads')}
          className={"pick-btn" + (pick === 'heads' ? ' active' : '')}
        >
          HEADS
        </button>
        <button
          onClick={() => setPick('tails')}
          className={"pick-btn" + (pick === 'tails' ? ' active' : '')}
        >
          TAILS
        </button>
      </div>

      {/* Payout info */}
      <div className="stats">
        <div className="stat-row">
          <span className="stat-label">WIN CHANCE</span>
          <span className="stat-val">50%</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">PAYOUT</span>
          <span className="stat-val green">1.96x</span>
        </div>
      </div>

      {/* Place bet */}
      <button
        className="btn btn-green"
        onClick={placeBet}
        disabled={loading || !pick}
      >
        {loading ? 'FLIPPING...' : 'FLIP COIN'}
      </button>

      {isRateLimited(result) && <RateLimitBanner data={result} />}
      {/* Result */}
      {result && !flipping && (
        <div className={"result " + (result.playerWon ? 'result-win' : 'result-lose')}>
          <div className={"result-label " + (result.playerWon ? 'win' : 'lose')}>
            {result.playerWon ? 'WIN' : 'LOSE'}
          </div>
          <div className="result-number">
            {result.result.toUpperCase()}
          </div>
          <div className="result-detail">
            {result.playerWon
              ? `WON ${result.payout.toFixed(4)} (${result.payoutMultiplier.toFixed(2)}x)`
              : `LOST ${betAmount}`}
          </div>
          {result.playerWon && result.payoutMultiplier >= 2 && (
            <ShareWin game="coinflip" payout={result.payout} multiplier={result.payoutMultiplier} betAmount={parseFloat(betAmount)} />
          )}
        </div>
      )}
    </div>
  )
}