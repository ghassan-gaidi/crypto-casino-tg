import React, { useState, useCallback, useEffect } from 'react';
import { useGameFeedback } from '../hooks';
import { useGameKeyboard } from '../hooks/keyboard';
import ShareWin from './ShareWin';
import HotCold from './HotCold';
import PayoutBadge from './PayoutBadge';
import AnimatedNumber from './AnimatedNumber';
import { showWinToast } from './WinToast';
import { isRateLimited, RateLimitBanner } from '../rate-limit-ui';
import PlinkoVisual from './PlinkoVisual'
import BetMultipliers from './BetMultipliers';
import FairnessPanel from './FairnessPanel';
import GameLiveBets from './GameLiveBets';

interface PlinkoGameProps {
  onBack: () => void;
  userId?: number;
}

const QUICK_BETS = [0.001, 0.01, 0.1, 1.0];
const ROWS_OPTIONS = [8, 12, 16] as const;
const RISK_OPTIONS = ['low', 'medium', 'high'] as const;
const ANIM_DURATION_MS = 1600; // matches ~56 frames × 28ms in PlinkoVisual

function formatPayout(amount: number): string {
  return amount.toFixed(6);
}

const PlinkoGame: React.FC<PlinkoGameProps> = ({ onBack, userId }) => {
  const [amount, setAmount] = useState('0.01');
  const [rows, setRows] = useState<number>(12);
  const [risk, setRisk] = useState<string>('medium');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useGameFeedback(result);
  const [gameHistory, setGameHistory] = useState<boolean[]>([]);
  const [dropSlot, setDropSlot] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);
  const [error, setError] = useState('');
  const [balance, setBalance] = useState<number | null>(null);

  // Fetch real balance
  useEffect(() => {
    if (!userId) return;
    fetch(`/api/balance?userId=${userId}`)
      .then(r => r.json())
      .then(data => { if (data.evm !== undefined) setBalance(parseFloat(data.evm) || 0); })
      .catch(() => setBalance(0));
  }, [userId]);

  const handleQuickBet = (val: number) => {
    setAmount(val.toString());
  };

  const handlePlay = useCallback(async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setDropSlot(null);
    setAnimating(false);

    try {
      const initData = (window as any).Telegram?.WebApp?.initData || '';
      const res = await fetch('/api/plinko', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          initData,
          rows,
          risk,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
      setBalance(prev => prev !== null ? prev + data.payout - amt : prev);
      setGameHistory(prev => [...prev.slice(-9), (data.multiplier ?? 0) > 1]);
      if ((data.multiplier ?? 0) > 1) showWinToast('plinko', amount, data.multiplier ?? 1, '▼')
      setDropSlot(data.slot);
      // Start canvas animation
      setAnimating(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [amount, rows, risk]);

  // Stop animating after duration so the ball stays at final position
  useEffect(() => {
    if (!animating) return;
    const t = setTimeout(() => setAnimating(false), ANIM_DURATION_MS);
    return () => clearTimeout(t);
  }, [animating]);

  const closeResult = () => {
    setResult(null);
    setDropSlot(null);
    setAnimating(false);
  };

  useGameKeyboard({
    onBet: handlePlay,
    onQuickBet: setAmount,
    disabled: loading,
    onHalfBet: () => { const c = parseFloat(amount) || 0; setAmount(Math.max(c / 2, 0.001).toFixed(4)) },
    onDoubleBet: () => { const c = parseFloat(amount) || 0; setAmount((balance != null ? Math.min(c * 2, balance) : c * 2).toFixed(4)) },
    onMaxBet: () => { setAmount((balance != null ? Math.max(balance, 0.001) : (parseFloat(amount) || 0) * 2).toFixed(4)) },
  });

  return (
    <div className="page">
      {/* Header */}
      <div className="header">
        <button className="btn-back" onClick={onBack}>Back</button>
        <span className="header-title" style={{display:'flex',alignItems:'center',gap:6}}>
          <img src="/icons/icon-plinko.svg" alt="" width="18" height="18" />
          PLINKO
        </span>
        <span className="header-balance">
          {balance !== null ? <AnimatedNumber value={balance} decimals={4} /> : '---'}
        </span>
      </div>

      {/* Bet Amount */}
      <div className="term-box">
        <div className="term-box-hd"><span>BET AMOUNT</span></div>
        <div className="term-box-bd">
          <input
            className="input"
            type="number"
            step="0.001"
            min="0.001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
          <div className="chips">
            {QUICK_BETS.map((qb) => (
              <button
                key={qb}
                className={"chip" + (parseFloat(amount) === qb ? " active" : "")}
                onClick={() => handleQuickBet(qb)}
              >
                {qb}
              </button>
            ))}
          </div>
          <BetMultipliers betAmount={amount} onSet={setAmount} balance={balance} />
        </div>
      </div>

      {/* Rows Selector */}
      <div className="term-box">
        <div className="term-box-hd"><span>ROWS</span></div>
        <div className="term-box-bd">
          <div className="chips">
            {ROWS_OPTIONS.map((r) => (
              <button
                key={r}
                className={"chip" + (rows === r ? " active" : "")}
                onClick={() => setRows(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Risk Selector */}
      <div className="term-box">
        <div className="term-box-hd"><span>RISK</span></div>
        <div className="term-box-bd">
          <div className="dir-row">
            {RISK_OPTIONS.map((r) => (
              <button
                key={r}
                className={
                  "pick-btn risk-" + r +
                  (risk === r ? " active" : "")
                }
                onClick={() => setRisk(r)}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Plinko Board - Canvas Visualization */}
      <div className="term-box">
        <div className="term-box-hd"><span>BOARD</span></div>
        <div className="term-box-bd" style={{ padding: 0 }}>
          <PlinkoVisual
            rows={rows}
            dropSlot={dropSlot}
            animating={animating}
          />
        </div>
      </div>

      {/* Play Button */}
      <button
        className={"btn btn-green btn-pulse" + (loading ? " disabled" : "")}
        onClick={handlePlay}
        disabled={loading}
      >
        {loading ? 'DROPPING...' : 'DROP BALL'}
      </button>

      {error && (
        <div className="overlay-error">
          {error}
        </div>
      )}

      {isRateLimited(result) && <RateLimitBanner data={result} />}
      {/* Result Overlay */}
      {result && (
        <div className="overlay" onClick={closeResult}>
          <div
            className={"result " + (result.playerWon ? "result-win" : "result-lose")}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={"result-label " + (result.playerWon ? "win" : "lose")}>
              {result.playerWon ? 'WIN' : 'LOSE'}
            </div>
            {result.playerWon && <PayoutBadge multiplier={result.multiplier || result.payoutMultiplier || 1} />}
            <div className="result-number">
              {result.playerWon ? '+' : ''}{formatPayout(result.payout)}
            </div>
            <div className="result-detail">
              SLOT: <strong>{result.slot}</strong> | ROWS: {result.rows} | RISK: {result.risk}
            </div>
            <div className="result-detail">
              MULTIPLIER: <strong>{result.multiplier}x</strong>
            </div>
            <div className="result-hash">
              {result.resultHash}
            </div>
            {result.playerWon && result.multiplier >= 2 && (
              <ShareWin game="plinko" payout={result.payout} multiplier={result.multiplier} betAmount={parseFloat(amount)} />
            )}
            <HotCold history={gameHistory} />
            <button className="btn btn-green mt-md" onClick={closeResult}>
              OK
            </button>
          </div>
        </div>
      )}
      <GameLiveBets />
      <FairnessPanel userId={userId} gameName="plinko" />
    </div>
  );
};

export default PlinkoGame;
