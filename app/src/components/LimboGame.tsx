import React, { useState, useCallback } from 'react';

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

const INITIAL_BALANCE = 10000;
const QUICK_BETS = [100, 250, 500, 1000, 2500];

const LimboGame: React.FC<LimboGameProps> = ({ onBack, userId }) => {
  const [betAmount, setBetAmount] = useState<number>(500);
  const [targetMultiplier, setTargetMultiplier] = useState<number>(2.0);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<LimboResult | null>(null);
  const [balance, setBalance] = useState<number>(INITIAL_BALANCE);

  const handleQuickBet = useCallback((amount: number) => {
    setBetAmount(amount);
  }, []);

  const handlePlay = useCallback(async () => {
    if (loading || betAmount <= 0 || betAmount > balance) return;

    setLoading(true);
    try {
      const initData = (window as any).Telegram?.WebApp?.initDataUnsafe || {};
      const res = await fetch('/api/limbo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: betAmount,
          targetMultiplier,
          initData,
          userId,
        }),
      });
      const data: LimboResult = await res.json();
      setResult(data);
      if (data.playerWon) {
        setBalance((prev) => prev + data.payout);
      } else {
        setBalance((prev) => prev - betAmount);
      }
    } catch (err) {
      console.error('Limbo API error:', err);
    } finally {
      setLoading(false);
    }
  }, [betAmount, targetMultiplier, loading, balance, userId]);

  const handleCloseResult = useCallback(() => {
    setResult(null);
  }, []);

  return (
    <div className="page">
      {/* ── HEADER ── */}
      <div className="header">
        <button className="btn-back" onClick={onBack}>
          Back
        </button>
        <span className="header-title">🚀 Limbo</span>
        <span className="header-balance">💰 {balance.toLocaleString()}</span>
      </div>

      {/* ── CRASH DISPLAY ── */}
      <div className="term-box" style={{ marginBottom: 16 }}>
        <div className="term-box-hd">
          <span>CRASH POINT</span>
        </div>
        <div
          className="term-box-bd text-center"
          style={{ padding: 20 }}
        >
          {result ? (
            <>
              <div
                className="result-number"
                style={{
                  fontSize: 48,
                  color: result.playerWon ? 'var(--green)' : 'var(--red)',
                }}
              >
                ×{result.crashPoint.toFixed(2)}
              </div>
              <div className="result-detail">CRASHED</div>
            </>
          ) : (
            <>
              <div className="result-number" style={{ fontSize: 48, color: 'var(--text-muted)' }}>
                🚀
              </div>
              <div className="result-detail">SET TARGET AND LAUNCH</div>
            </>
          )}
        </div>
      </div>

      {/* ── INFO ── */}
      <p className="text-dim text-center mb-md" style={{ fontSize: 11, letterSpacing: 0.5, lineHeight: 1.5 }}>
        Set a target multiplier. The rocket flies higher — if it passes your target before crashing, you win.
      </p>

      {/* ── BET AMOUNT ── */}
      <div className="s-title">Bet Amount</div>
      <div className="term-box" style={{ marginBottom: 16 }}>
        <div className="term-box-hd">
          <span>AMOUNT</span>
        </div>
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
        </div>
      </div>

      {/* ── QUICK BET CHIPS ── */}
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

      {/* ── TARGET MULTIPLIER ── */}
      <div className="s-title">Target Multiplier (1.01 – 10,000)</div>
      <div className="term-box" style={{ marginBottom: 16 }}>
        <div className="term-box-hd">
          <span>TARGET</span>
        </div>
        <div className="term-box-bd">
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
      </div>

      {/* ── POTENTIAL PAYOUT STATS ── */}
      <div className="stats">
        <div className="stat-row">
          <span className="stat-label">Potential Payout</span>
          <span className="stat-val text-yellow">
            ×{targetMultiplier.toFixed(2)}
          </span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Win Amount</span>
          <span className="stat-val green">
            {Math.floor(betAmount * targetMultiplier).toLocaleString()}
          </span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Profit</span>
          <span className="stat-val green">
            +{Math.floor(betAmount * targetMultiplier - betAmount).toLocaleString()}
          </span>
        </div>
      </div>

      {/* ── PLAY BUTTON ── */}
      <button
        className="btn btn-green"
        onClick={handlePlay}
        disabled={loading || betAmount <= 0 || betAmount > balance}
      >
        {loading ? '▶ FLYING...' : '▶ PLAY'}
      </button>

      {/* ── RESULT ── */}
      {result && (
        <div
          className={"result " + (result.playerWon ? "result-win animate-win" : "result-lose animate-lose")}
          style={{ marginTop: 20 }}
        >
          <div className={"result-label " + (result.playerWon ? "win" : "lose")}>
            {result.playerWon ? "▲ YOU WON" : "▼ CRASHED"}
          </div>

          <div className="result-number">
            ×{result.crashPoint.toFixed(2)}
          </div>

          <div className="result-detail">
            Target: ×{targetMultiplier.toFixed(2)}
            {result.playerWon && (
              <span className="text-green" style={{ marginLeft: 8 }}>✓ PASSED</span>
            )}
          </div>

          {result.playerWon && (
            <div
              className="result-label win"
              style={{ fontSize: 16, marginTop: 8 }}
            >
              +{result.payout.toLocaleString()} (×{result.payoutMultiplier.toFixed(2)})
            </div>
          )}

          <div className="result-hash">
            Hash: {result.resultHash.slice(0, 20)}...
            <br />
            Nonce: {result.nonce} | Seed: {result.clientSeed.slice(0, 12)}...
          </div>

          <button
            className="btn btn-ghost mt-md"
            onClick={handleCloseResult}
          >
            PLAY AGAIN
          </button>
        </div>
      )}
    </div>
  );
};

export default LimboGame;
