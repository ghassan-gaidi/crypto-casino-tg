import { useState } from 'react'

interface Props {
  onBack: () => void
  userId?: number
}

export default function DiceGame({ onBack }: Props) {
  const [betAmount, setBetAmount] = useState('0.01')
  const [direction, setDirection] = useState<'under' | 'over'>('under')
  const [target, setTarget] = useState(50)
  const [result, setResult] = useState<{
    roll: number
    playerWon: boolean
    payout: number
    payoutMultiplier: number
    resultHash: string
    nonce: number
    clientSeed: string
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const quickBets = ['0.001', '0.01', '0.1', '1.0']

  const winChance = direction === 'under' ? target : 100 - target
  const payout = (99 / winChance * 0.98).toFixed(2)

  const placeBet = async () => {
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch(`/api/dice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(betAmount),
          direction,
          target,
          initData: window.Telegram?.WebApp?.initData,
        }),
      })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      console.error('Bet failed', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <button className="btn-back" onClick={onBack}>&larr; Back</button>
      <div className="s-title" style={{ marginTop: 12 }}>DICE</div>

      <div className="term-box">
        <div className="term-box-hd"><span>AMOUNT</span></div>
        <div className="term-box-bd">
          <div className="chips">
            {quickBets.map(amt => (
              <button
                key={amt}
                className={"chip" + (betAmount === amt ? ' active' : '')}
                onClick={() => setBetAmount(amt)}
              >
                {amt}
              </button>
            ))}
          </div>
          <input
            className="input"
            type="number"
            step="0.001"
            value={betAmount}
            onChange={e => setBetAmount(e.target.value)}
          />
        </div>
      </div>

      <div className="term-box">
        <div className="term-box-hd"><span>CONFIG</span></div>
        <div className="term-box-bd">
          <div className="dir-row">
            <button
              className={"dir-btn" + (direction === 'under' ? ' active-under' : '')}
              onClick={() => setDirection('under')}
            >
              UNDER
            </button>
            <button
              className={"dir-btn" + (direction === 'over' ? ' active-over' : '')}
              onClick={() => setDirection('over')}
            >
              OVER
            </button>
          </div>
          <div className="t-label">TARGET</div>
          <input
            type="range"
            min={1}
            max={99}
            value={target}
            onChange={e => setTarget(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="t-small text-dim">1</span>
            <span className="t-small text-dim">99</span>
          </div>
          <div className="t-body" style={{ marginTop: 4 }}>
            <span className="text-green">{target}</span>
          </div>
        </div>
      </div>

      <div className="stats">
        <div className="stat-row">
          <span className="stat-label">WIN CHANCE</span>
          <span className="stat-val">{winChance}%</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">PAYOUT</span>
          <span className="stat-val text-green">{payout}x</span>
        </div>
      </div>

      <button
        className="btn btn-green"
        onClick={placeBet}
        disabled={loading}
      >
        {loading ? 'ROLLING...' : 'ROLL DICE'}
      </button>

      {result && (
        <div className={"result " + (result.playerWon ? 'result-win' : 'result-lose')}>
          <div className="result-number">{result.roll.toFixed(2)}</div>
          <div className={result.playerWon ? 'result-label win' : 'result-label lose'}>
            {result.playerWon
              ? `WIN +${result.payout.toFixed(4)} (${result.payoutMultiplier.toFixed(2)}x)`
              : `LOSE -${betAmount}`}
          </div>
          <div className="result-hash">
            {result.resultHash}
          </div>
        </div>
      )}
    </div>
  )
}
