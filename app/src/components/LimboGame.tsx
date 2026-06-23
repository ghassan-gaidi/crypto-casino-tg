import React, { useState, useCallback, useEffect } from 'react';
import { useGameFeedback } from '../hooks';
import { useGameKeyboard } from '../hooks/keyboard';
import ShareWin from './ShareWin';
import HotCold from './HotCold';
import { isRateLimited, RateLimitBanner } from '../rate-limit-ui';

interface LimboGameProps {
  onBack: () => void;
  userId?: number;
}

interface LimboResult {
  crashPoint: number;
  playerWon: boolean;
  payout: number;
  payoutMultiplier: number;
  resultHash: string;
  nonce: number;
  clientSeed: string;
}

const QUICK_BETS = [0.001, 0.01, 0.1, 1.0];

const LimboGame: React.FC<LimboGameProps> = ({ onBack, userId }) => {
  const [betAmount, setBetAmount] = useState<number>(0.01);
  const [targetMultiplier, setTargetMultiplier] = useState<number>(2.0);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<LimboResult | null>(null);

  useGameFeedback(result);
  const [balance, setBalance] = useState<number>(0);
  const [error, setError] = useState('');
  const [gameHistory, setGameHistory] = useState<boolean[]>([]);

  // Fetch real balance
  useEffect(() => {
    if (!userId) return;
    fetch(`/api/balance?userId=${userId}`)
      .then(r => r.json())
      .then(data => {
        if (data.evm !== undefined) setBalance(Number(data.evm));
      })
      .catch(() => {});
  }, [userId]);

  const handleQuickBet = useCallback((amount: number) => {
    setBetAmount(amount);
  }, []);

  const handlePlay = useCallback(async () => {
    if (loading || betAmount <= 0 || betAmount > balance) return;
    setLoading(true);
    setError('');
    try {
      const initData = (window as any).Telegram?.WebApp?.initData || '';
      const res = await fetch('/api/limbo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: betAmount, targetMultiplier, initData, userId }),
      });
      const data: LimboResult = await res.json();
      setResult(data);
      setGameHistory(prev => [...prev.slice(-9), data.playerWon]);
      if (data.playerWon) {
        setBalance((prev) => prev + data.payout);
      } else {
        setBalance((prev) => prev - betAmount);
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [betAmount, targetMultiplier, loading, balance, userId]);

  const handleCloseResult = useCallback(() => {
    setResult(null);
  }, []);

  useGameKeyboard({ onBet: handlePlay, onQuickBet: (v) => setBetAmount(parseFloat(v)), disabled: loading })

  return (
    <div className="page">
      <div className="header">
        <button className="btn-back" onClick={onBack}>
          Back
        </button>
        <span className="header-title">LIMBO</span>
        <span className="header-balance">{balance.toFixed(4)}</span>
      </div>

      {/* Crash Display */}
      <div className="term-box">
        <div className="term-box-hd">
          <span>CRASH POINT</span>
        </div>
        <div className="term-box-bd text-center">
          {result ? (
            <>
              <div
                className="result-number"
                style={{ color: result.playerWon ? 'var(--green)' : 'var(--red)' }}
              >
                x{result.crashPoint.toFixed(2)}
              </div>
              <div className="result-detail">CRASHED</div>
            </>
          ) : (
            <>
              <div className="result-number text-dim">x0.00</div>
              <div className="result-detail">SET TARGET AND LAUNCH</div>
            </>
          )}
        </div>
      </div>

      <div className="text-center text-dim mb-md" style={{ fontSize: '11px' }}>
        Set a target multiplier. The rocket flies higher — if it passes your target before crashing, you win.
      </div>

      {/* Bet Amount */}
      <div className="s-title">BET AMOUNT</div>
      <div className="chips">
        {QUICK_BETS.map((amount) => (
          <button
            key={amount}
            className={"chip" + (betAmount === amount ? " active" : "")}
            onClick={() => handleQuickBet(amount)}
          >
            {amount}
          </button>
        ))}
      </div>
      <div className="mb-md">
        <input
          className="input"
          type="number"
          min={0.001}
          value={betAmount}
          onChange={(e) => setBetAmount(Math.max(0.001, parseFloat(e.target.value) || 0.001))}
          placeholder="Enter bet amount"
        />
      </div>

      {/* Target Multiplier */}
      <div className="s-title">TARGET MULTIPLIER</div>
      <div className="mb-md">
        <input
          className="input"
          type="number"
          min={1.01}
          max={10000}
          step={0.01}
          value={targetMultiplier}
          onChange={(e) =>
            setTargetMultiplier(Math.max(1.01, parseFloat(e.target.value) || 1.01))
          }
          placeholder="e.g. 2.0"
        />
      </div>

      {/* Potential Payout Stats */}
      <div className="stats">
        <div className="stat-row">
          <span className="stat-label">Potential Payout</span>
          <span className="stat-val text-yellow">x{targetMultiplier.toFixed(2)}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Win Amount</span>
          <span className="stat-val green">{(betAmount * targetMultiplier).toFixed(4)}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Profit</span>
          <span className="stat-val green">+{(betAmount * targetMultiplier - betAmount).toFixed(4)}</span>
        </div>
      </div>

      {error && <div className="overlay-error">{error}</div>}

      <button
        className="btn btn-green"
        onClick={handlePlay}
        disabled={loading || betAmount <= 0 || betAmount > balance}
      >
        {loading ? 'FLYING...' : 'PLAY'}
      </button>

      {isRateLimited(result) && <RateLimitBanner data={result} />}
      {/* Result */}
      {result && (
        <div
          className={"result " + (result.playerWon ? "result-win animate-win" : "result-lose animate-lose")}
        >
          <div className={"result-label " + (result.playerWon ? "win" : "lose")}>
            {result.playerWon ? "YOU WON" : "CRASHED"}
          </div>

          <div className="result-number">
            x{result.crashPoint.toFixed(2)}
          </div>

          <div className="result-detail">
            Target: x{targetMultiplier.toFixed(2)}
            {result.playerWon && (
              <span className="text-green"> PASSED</span>
            )}
          </div>

          {result.playerWon && (
            <div className="result-label win mt-sm">
              +{result.payout.toFixed(4)} (x{result.payoutMultiplier.toFixed(2)})
            </div>
          )}

          <div className="result-hash">
            Hash: {result.resultHash.slice(0, 20)}...
            <br />
            Nonce: {result.nonce} | Seed: {result.clientSeed.slice(0, 12)}...
          {result.playerWon && result.payoutMultiplier >= 2 && (
            <ShareWin game="limbo" payout={result.payout} multiplier={result.payoutMultiplier} betAmount={betAmount} />
          )}
          </div>

          <button
            className="btn btn-ghost mt-md"
            onClick={handleCloseResult}
          >
            PLAY AGAIN
          </button>
        </div>
      )}
      <HotCold history={gameHistory} />
    </div>
  );
};

export default LimboGame;
