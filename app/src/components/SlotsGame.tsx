import React, { useState } from 'react';

interface SlotsGameProps {
  onBack: () => void;
  userId?: number;
}

const QUICK_BETS = [0.001, 0.01, 0.1, 1.0];

const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣', '⭐', '🔔'];
const REEL_HEIGHT = 3; // symbols visible per reel

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#111',
    color: '#fff',
    minHeight: '100vh',
    padding: '16px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    width: '100%',
  },
  backBtn: {
    background: '#1a1a2e',
    color: '#fff',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  title: {
    fontSize: '22px',
    fontWeight: 700,
    margin: 0,
  },
  balanceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    padding: '10px 14px',
    backgroundColor: '#1a1a2e',
    borderRadius: '10px',
    border: '1px solid #2a2a3e',
    width: '100%',
    boxSizing: 'border-box',
  },
  label: { fontSize: '13px', color: '#888' },
  value: { fontSize: '16px', fontWeight: 600 },
  section: {
    marginBottom: '20px',
    width: '100%',
  },
  sectionTitle: {
    fontSize: '14px',
    color: '#aaa',
    marginBottom: '8px',
    fontWeight: 500,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #2a2a3e',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    fontSize: '16px',
    boxSizing: 'border-box',
    outline: 'none',
  },
  quickBetRow: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
    flexWrap: 'wrap' as const,
  },
  quickBetBtn: {
    flex: 1,
    minWidth: '60px',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid #2a2a3e',
    backgroundColor: '#1a1a2e',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '13px',
    textAlign: 'center' as const,
  },
  reelContainer: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    margin: '24px 0',
    padding: '16px',
    backgroundColor: '#1a1a2e',
    borderRadius: '12px',
    border: '2px solid #2a2a3e',
  },
  reelColumn: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    alignItems: 'center',
    backgroundColor: '#0a0a1a',
    borderRadius: '8px',
    padding: '8px 12px',
    minWidth: '50px',
  },
  reelSymbol: {
    fontSize: '36px',
    lineHeight: 1.2,
    width: '50px',
    textAlign: 'center' as const,
    transition: 'transform 0.15s ease',
  },
  spinBtn: {
    width: '100%',
    padding: '14px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #eab308, #f59e0b)',
    color: '#fff',
    fontSize: '18px',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '8px',
    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
  },
  spinBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  comboName: {
    fontSize: '16px',
    fontWeight: 600,
    marginTop: '12px',
    padding: '8px 16px',
    borderRadius: '8px',
    backgroundColor: '#1a1a2e',
    border: '1px solid #2a2a3e',
  },
  resultOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.85)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '24px',
    boxSizing: 'border-box' as const,
  },
  resultCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: '16px',
    border: '2px solid #2a2a3e',
    padding: '32px 24px',
    maxWidth: '340px',
    width: '100%',
    textAlign: 'center' as const,
  },
  resultWin: { borderColor: '#22c55e' },
  resultLoss: { borderColor: '#ef4444' },
  resultAmount: {
    fontSize: '36px',
    fontWeight: 700,
    margin: '12px 0',
  },
  resultLabel: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '4px',
  },
  resultDetail: {
    fontSize: '13px',
    color: '#aaa',
    margin: '4px 0',
  },
  resultHash: {
    fontSize: '11px',
    color: '#555',
    wordBreak: 'break-all' as const,
    marginTop: '12px',
  },
  overlayBtn: {
    marginTop: '16px',
    padding: '12px 32px',
    borderRadius: '10px',
    border: 'none',
    background: '#eab308',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};

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
          reel.map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)])
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
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>← Back</button>
        <h1 style={styles.title}>Slots</h1>
      </div>

      {/* Bet Amount */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Bet Amount</div>
        <input
          style={styles.input}
          type="number"
          step="0.001"
          min="0.001"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
        />
        <div style={styles.quickBetRow}>
          {QUICK_BETS.map((qb) => (
            <button
              key={qb}
              style={{
                ...styles.quickBetBtn,
                ...(parseFloat(amount) === qb ? { borderColor: '#fff', color: '#fff' } : {}),
              }}
              onClick={() => handleQuickBet(qb)}
            >
              {qb}
            </button>
          ))}
        </div>
      </div>

      {/* Reels Display */}
      <div style={styles.reelContainer}>
        {displayReels.map((reel, reelIdx) => (
          <div key={reelIdx} style={styles.reelColumn}>
            {reel.map((sym, symIdx) => (
              <div
                key={symIdx}
                style={{
                  ...styles.reelSymbol,
                  opacity: animating ? 0.6 + Math.random() * 0.4 : 1,
                  transform: animating
                    ? `translateY(${Math.sin(reelIdx + symIdx + spinPhase) * 4}px)`
                    : 'translateY(0)',
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
        style={{
          ...styles.spinBtn,
          ...(loading || animating ? styles.spinBtnDisabled : {}),
        }}
        onClick={handleSpin}
        disabled={loading || animating}
      >
        {loading ? 'Spinning...' : animating ? 'Spinning...' : '🎰 Spin'}
      </button>

      {/* Combo display when result exists */}
      {result && !animating && result.combo && (
        <div style={styles.comboName}>
          {result.combo}
          {result.payoutMultiplier && (
            <span style={{ marginLeft: '8px', color: '#eab308' }}>
              ×{result.payoutMultiplier}
            </span>
          )}
        </div>
      )}

      {error && (
        <div style={{ color: '#ef4444', textAlign: 'center', marginTop: '8px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {/* Result Overlay */}
      {result && !animating && (
        <div style={styles.resultOverlay} onClick={closeResult}>
          <div
            style={{
              ...styles.resultCard,
              ...(result.playerWon ? styles.resultWin : styles.resultLoss),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.resultLabel}>
              {result.playerWon ? '🎉 You Won!' : '😔 You Lost'}
            </div>
            <div
              style={{
                ...styles.resultAmount,
                color: result.playerWon ? '#22c55e' : '#ef4444',
              }}
            >
              {result.playerWon ? '+' : ''}{formatPayout(result.payout)}
            </div>
            {result.combo && (
              <div style={styles.resultDetail}>
                Combo: <strong>{result.combo}</strong>
                {result.payoutMultiplier && (
                  <span> ×{result.payoutMultiplier}</span>
                )}
              </div>
            )}
            <div style={styles.resultDetail}>
              {result.reels?.join(' | ')}
            </div>
            <div style={styles.resultHash}>
              Hash: {result.resultHash}
            </div>
            <button style={styles.overlayBtn} onClick={closeResult}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlotsGame;
