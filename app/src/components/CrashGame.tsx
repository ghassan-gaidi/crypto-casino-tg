import React, { useState, useCallback } from 'react';

interface CrashGameProps {
  onBack: () => void;
  userId?: number;
}

interface CrashResult {
  crashPoint: number;
  playerWon: boolean;
  payout: number;
  payoutMultiplier: number;
  resultHash: string;
  nonce: number;
  clientSeed: string;
}

const INITIAL_BALANCE = 10000;
const QUICK_BETS = [100, 250, 500, 1000, 2500];

const CrashGame: React.FC<CrashGameProps> = ({ onBack, userId }) => {
  const [betAmount, setBetAmount] = useState<number>(500);
  const [autoCashoutMultiplier, setAutoCashoutMultiplier] = useState<number>(2.0);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<CrashResult | null>(null);
  const [balance, setBalance] = useState<number>(INITIAL_BALANCE);

  const handleQuickBet = useCallback((amount: number) => {
    setBetAmount(amount);
  }, []);

  const handlePlay = useCallback(async () => {
    if (loading || betAmount <= 0 || betAmount > balance) return;

    setLoading(true);
    try {
      const initData = (window as any).Telegram?.WebApp?.initDataUnsafe || {};
      const res = await fetch('/api/crash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: betAmount,
          autoCashoutMultiplier,
          initData,
          userId,
        }),
      });
      const data: CrashResult = await res.json();
      setResult(data);
      if (data.playerWon) {
        setBalance((prev) => prev + data.payout);
      } else {
        setBalance((prev) => prev - betAmount);
      }
    } catch (err) {
      console.error('Crash API error:', err);
    } finally {
      setLoading(false);
    }
  }, [betAmount, autoCashoutMultiplier, loading, balance, userId]);

  return (
    <div className="page">
      <div className="header">
        <button className="btn-back" onClick={onBack}>
          &larr; BACK
        </button>
        <h1 className="s-title">🚀 CRASH</h1>
        <div className="stats">
          <div className="stat-row">
            <span>BALANCE</span>
            <span>{balance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Crash Graph Area */}
      <div className="crash-graph">
        {result ? (
          <div className={"crash-label " + (result.playerWon ? "win" : "lose")}>
            ×{result.crashPoint.toFixed(2)}
          </div>
        ) : (
          <div className="crash-label">WAITING...</div>
        )}
      </div>

      {/* Inline Result Display */}
      {result && (
        <div className={"result " + (result.playerWon ? "result-win" : "result-lose")}>
          <div className={"result-label " + (result.playerWon ? "win" : "lose")}>
            {result.playerWon ? "CASHED OUT" : "CRASHED"}
          </div>
          <div className="result-number">
            ×{result.crashPoint.toFixed(2)}
          </div>
          {result.playerWon && (
            <div className={"result-label " + (result.playerWon ? "win" : "lose")}>
              +{result.payout.toLocaleString()} (+×{result.payoutMultiplier.toFixed(2)})
            </div>
          )}
          <div className="result-label">
            CASHOUT: ×{result.payoutMultiplier.toFixed(2)}
          </div>
          <div className="result-hash">
            {result.resultHash.slice(0, 20)}... | NONCE: {result.nonce} | SEED: {result.clientSeed.slice(0, 12)}...
          </div>
        </div>
      )}

      {/* Bet Amount Section */}
      <div className="term-box">
        <div className="term-box-hd"><span>BET AMOUNT</span></div>
        <div className="term-box-bd">
          <input
            className="input"
            type="number"
            min={1}
            max={balance}
            value={betAmount}
            onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 0))}
            placeholder="Enter bet amount"
          />
          <div className="chip-row">
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
        </div>
      </div>

      {/* Auto Cashout Section */}
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
            placeholder="e.g. 2.0"
          />
        </div>
      </div>

      {/* Launch Button */}
      <button
        className="btn btn-green"
        onClick={handlePlay}
        disabled={loading || betAmount <= 0 || betAmount > balance}
      >
        {loading ? "🚀 LAUNCHING..." : "🚀 LAUNCH"}
      </button>
    </div>
  );
};

export default CrashGame;
