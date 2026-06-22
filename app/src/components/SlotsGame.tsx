import React, { useState } from 'react';

interface SlotsGameProps {
  onBack: () => void;
  userId?: number;
}

const QUICK_BETS = [0.001, 0.01, 0.1, 1.0];

const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣', '⭐', '🔔'];

function formatPayout(amount: number): string {
  return amount.toFixed(6);
}

const SlotsGame: React.FC<SlotsGameProps> = ({ onBack }) => {
  const [amount, setAmount] = useState('0.01');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [animating, setAnimating] = useState(false);
  const [displayReels, setDisplayReels] = useState<string[][]>([
    ['🍒', '🍋', '🍊'],
    ['🍋', '🍊', '🍇'],
    ['🍊', '🍇', '💎'],
  ]);
  const [spinPhase, setSpinPhase] = useState(0);

  const handleQuickBet = (val: number) => {
    setAmount(val.toString());
  };

  const spinAnimation = async (finalReels: string[][]) => {
    setAnimating(true);
    setSpinPhase(0);

    // Animate through several random states
    for (let phase = 0; phase < 8; phase++) {
      await new Promise((r) => setTimeout(r, 100 + phase * 30));
      setDisplayReels(
        finalReels.map((reel) =>
          reel.map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]!)
        )
      );
      setSpinPhase(phase);
    }

    // Snap to final
    setDisplayReels(finalReels);
    setAnimating(false);
  };

  const handleSpin = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const initData = (window as any).Telegram?.WebApp?.initDataUnsafe || '';
      const res = await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          initData,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setResult(data);

      // Parse reels from API (3 strings)
      const reels = data.reels || ['🍒🍒🍒', '🍋🍋🍋', '🍊🍊🍊'];
      const parsedReels = reels.map((r: string) => r.split(''));
      // Ensure each reel has exactly 3 symbols
      const paddedReels = parsedReels.map((r: string[]) =>
        r.length >= 3 ? r.slice(0, 3) : [...r, ...Array(3 - r.length).fill('🍒')]
      );

      await spinAnimation(paddedReels);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const closeResult = () => {
    setResult(null);
  };

  return (
    <div className="page">
      {/* Header */}
      <button className="btn-back" onClick={onBack}>back</button>
      <div className="header" style={{ marginBottom: '20px' }}>
        <span className="header-title">⚡ SLOTS</span>
      </div>

      {/* Bet Amount */}
      <div className="s-title">BET AMOUNT</div>
      <input
        className="input"
        type="number"
        step="0.001"
        min="0.001"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.00"
      />
      <div className="chips" style={{ marginTop: '8px' }}>
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

      {/* Reels Display */}
      <div className="reels">
        {displayReels.map((reel, reelIdx) => (
          <div
            key={reelIdx}
            className={"reel" + (animating ? " spinning" : "")}
            style={{
              opacity: animating ? 0.6 + Math.random() * 0.4 : 1,
            }}
          >
            {reel.map((sym, symIdx) => (
              <div
                key={symIdx}
                style={{
                  fontSize: '28px',
                  lineHeight: 1.2,
                  transform: animating
                    ? `translateY(${Math.sin(reelIdx + symIdx + spinPhase) * 4}px)`
                    : 'translateY(0)',
                  transition: 'transform 0.15s ease',
                }}
              >
                {sym}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Spin Button */}
      <button
        className="btn btn-green"
        onClick={handleSpin}
        disabled={loading || animating}
        style={{ marginTop: '8px' }}
      >
        {loading ? 'SPINNING...' : animating ? 'SPINNING...' : '🎰 SPIN'}
      </button>

      {/* Combo display when result exists */}
      {result && !animating && result.combo && (
        <div className="stats" style={{ marginTop: '16px' }}>
          <div className="stat-row">
            <span className="stat-label">COMBO</span>
            <span className="stat-val text-yellow">
              {result.combo}
              {result.payoutMultiplier && (
                <> ×{result.payoutMultiplier}</>
              )}
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="text-red text-center mt-sm" style={{ fontSize: '12px' }}>
          {error}
        </div>
      )}

      {/* Result Overlay */}
      {result && !animating && (
        <div
          className={"result" + (result.playerWon ? " result-win" : " result-lose")}
          style={{ marginTop: '20px' }}
          onClick={closeResult}
        >
          <div className={"result-label" + (result.playerWon ? " win" : " lose")}>
            {result.playerWon ? '✓ YOU WON' : '✗ YOU LOST'}
          </div>
          <div className="result-number">
            {result.playerWon ? '+' : ''}{formatPayout(result.payout)}
          </div>
          {result.combo && (
            <div className="result-detail" style={{ marginTop: '6px' }}>
              COMBO: {result.combo}
              {result.payoutMultiplier && (
                <> ×{result.payoutMultiplier}</>
              )}
            </div>
          )}
          <div className="result-detail" style={{ marginTop: '4px' }}>
            {result.reels?.join(' | ')}
          </div>
          <div className="result-hash">
            HASH: {result.resultHash}
          </div>
          <button
            className="btn btn-ghost mt-md"
            onClick={(e) => { e.stopPropagation(); closeResult(); }}
          >
            CLOSE
          </button>
        </div>
      )}

      {/* Paytable */}
      <div className="term-box" style={{ marginTop: '24px' }}>
        <div className="term-box-hd">
          <span>PAYTABLE</span>
        </div>
        <div className="term-box-bd">
          <div className="stat-row">
            <span className="stat-label">777</span>
            <span className="stat-val text-green">×10</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">💎💎💎</span>
            <span className="stat-val text-green">×8</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">🔔🔔🔔</span>
            <span className="stat-val text-green">×6</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">⭐⭐⭐</span>
            <span className="stat-val text-green">×5</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">🍒🍒🍒</span>
            <span className="stat-val text-green">×4</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">🍋🍋🍋</span>
            <span className="stat-val text-green">×3</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">🍊🍊🍊</span>
            <span className="stat-val text-green">×3</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">🍇🍇🍇</span>
            <span className="stat-val text-green">×3</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">ANY 2 MATCH</span>
            <span className="stat-val text-yellow">×1.5</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlotsGame;
