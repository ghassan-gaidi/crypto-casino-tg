import { useState, useEffect } from 'react'
import { useGameFeedback } from '../hooks'
import { useGameKeyboard } from '../hooks/keyboard'
import ShareWin from './ShareWin'
import HotCold from './HotCold'
import PayoutBadge from './PayoutBadge'
import AnimatedNumber from './AnimatedNumber'
import { showWinToast } from './WinToast'
import { isRateLimited, RateLimitBanner } from '../rate-limit-ui'
import BetMultipliers from './BetMultipliers'
import FairnessPanel from './FairnessPanel'
import GameLiveBets from './GameLiveBets'
import AutoPlay from './AutoPlay'

interface Props {
  onBack: () => void
  userId?: number
}

export default function DiceGame({ onBack, userId }: Props) {
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

  useGameFeedback(result)
  const [gameHistory, setGameHistory] = useState<boolean[]>([])
  const [balance, setBalance] = useState<number | null>(null)

  // Fetch real balance
  useEffect(() => {
    if (!userId) return
    fetch(`/api/balance?userId=${userId}`)
      .then(r => r.json())
      .then(data => { if (data.evm !== undefined) setBalance(parseFloat(data.evm) || 0) })
      .catch(() => setBalance(0))
  }, [userId])

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
      setBalance(prev => prev !== null ? prev + data.payout - parseFloat(betAmount) : prev)
      setGameHistory(prev => [...prev.slice(-9), data.playerWon])
      if (data.playerWon) showWinToast('dice', parseFloat(betAmount), 99 / (data.winChance || 50) * 0.98, '◆')
    } catch (err) {
      console.error('Bet failed', err)
    } finally {
      setLoading(false)
    }
  }

  useGameKeyboard({
    onBet: placeBet,
    onQuickBet: setBetAmount,
    disabled: loading,
    onHalfBet: () => { const c = parseFloat(betAmount) || 0; setBetAmount(Math.max(c / 2, 0.001).toFixed(4)) },
    onDoubleBet: () => { const c = parseFloat(betAmount) || 0; setBetAmount((balance != null ? Math.min(c * 2, balance) : c * 2).toFixed(4)) },
    onMaxBet: () => { setBetAmount((balance != null ? Math.max(balance, 0.001) : (parseFloat(betAmount) || 0) * 2).toFixed(4)) },
  })

  return (
    <div className="page">
      <div className="header">
        <button className="btn-back" onClick={onBack}>&larr; Back</button>
        <span className="header-title" style={{display:'flex',alignItems:'center',gap:6}}>
          <img src="/icons/icon-dice.svg" alt="" width="18" height="18" />
          DICE
        </span>
        <span className="header-balance">
          {balance !== null ? <AnimatedNumber value={balance} decimals={4} /> : '---'}
        </span>
      </div>

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
            <BetMultipliers betAmount={betAmount} onSet={setBetAmount} balance={balance} />
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
        className="btn btn-green btn-pulse"
        onClick={placeBet}
        disabled={loading}
      >
        {loading ? 'ROLLING...' : 'ROLL DICE'}
      </button>

      <AutoPlay onPlay={placeBet} disabled={loading} balance={balance} />

      {isRateLimited(result) && <RateLimitBanner data={result} />}
      {result && (
        <div className={"result " + (result.playerWon ? 'result-win' : 'result-lose')}>
          <div className="result-number">{result.roll.toFixed(2)}</div>
          <div className={result.playerWon ? 'result-label win' : 'result-label lose'}>
            {result.playerWon
              ? `WIN +${result.payout.toFixed(4)} (${result.payoutMultiplier.toFixed(2)}x)`
              : `LOSE -${betAmount}`}
          </div>
          {result.playerWon && <PayoutBadge multiplier={result.payoutMultiplier} />}
          <div className="result-hash">{result.resultHash}</div>
          {result.playerWon && result.payoutMultiplier >= 2 && (
            <ShareWin game="dice" payout={result.payout} multiplier={result.payoutMultiplier} betAmount={parseFloat(betAmount)} />
          )}
          <HotCold history={gameHistory} />
        </div>
      )}
      <GameLiveBets />
      <FairnessPanel userId={userId} gameName="dice" />
    </div>
  )
}
