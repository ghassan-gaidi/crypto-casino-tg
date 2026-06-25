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

interface Props {
  onBack: () => void
  userId?: number
}

export default function CoinflipGame({ onBack, userId }: Props) {
  const [betAmount, setBetAmount] = useState('0.01')
  const [pick, setPick] = useState<'heads' | 'tails' | null>(null)
  const [result, setResult] = useState<{
    result: 'heads' | 'tails'
    playerWon: boolean
    payout: number
    payoutMultiplier: number
  } | null>(null)

  useGameFeedback(result)
  const [gameHistory, setGameHistory] = useState<boolean[]>([])

  const [loading, setLoading] = useState(false)
  const [flipping, setFlipping] = useState(false)
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
        setGameHistory(prev => [...prev.slice(-9), data.playerWon])
        if (data.playerWon) showWinToast('coinflip', parseFloat(betAmount), 1.96, '◑')
        setFlipping(false)
        setLoading(false)
      }, 800)
    } catch (err) {
      setFlipping(false)
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
        <button className="btn-back" onClick={onBack}>Back</button>
        <span className="header-title">COINFLIP</span>
        <span className="header-balance">
          {balance !== null ? <AnimatedNumber value={balance} decimals={4} /> : '---'}
        </span>
      </div>

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

      <BetMultipliers betAmount={betAmount} onSet={setBetAmount} balance={balance} />

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
        className="btn btn-green btn-pulse"
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
          {result.playerWon && <PayoutBadge multiplier={result.payoutMultiplier || 1.96} />}
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
          <HotCold history={gameHistory} />
        </div>
      )}
      <GameLiveBets />
      <FairnessPanel userId={userId} gameName="coinflip" />
    </div>
  )
}