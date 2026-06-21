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

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a0a2e, #2d1b4e, #1a0a2e)',
    color: '#e0e0e0',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    padding: '20px',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: '460px',
    marginBottom: '20px',
  },
  backButton: {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: '#e0e0e0',
    padding: '8px 16px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background 0.2s',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    background: 'linear-gradient(90deg, #a29bfe, #6c5ce7)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
    letterSpacing: '1px',
  },
  balanceBox: {
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '12px',
    padding: '8px 18px',
    border: '1px solid rgba(255,255,255,0.1)',
    fontSize: '16px',
    fontWeight: '600',
    color: '#f1c40f',
    textAlign: 'center' as const,
  },
  gameArea: {
    width: '100%',
    maxWidth: '460px',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(255,255,255,0.08)',
    boxSizing: 'border-box',
  },
  inputGroup: {
    marginBottom: '16px',
  },
  label: {
    fontSize: '13px',
    color: '#aaa',
    marginBottom: '6px',
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(0,0,0,0.35)',
    color: '#fff',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  quickBets: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
    marginBottom: '16px',
  },
  quickBetBtn: {
    flex: '1 0 auto',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    color: '#ccc',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    minWidth: '60px',
    textAlign: 'center' as const,
    transition: 'all 0.2s',
  },
  playButton: {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #a29bfe, #6c5ce7)',
    color: '#fff',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
    letterSpacing: '1px',
    transition: 'opacity 0.2s',
    marginTop: '8px',
  },
  playButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  infoText: {
    fontSize: '13px',
    color: '#888',
    textAlign: 'center' as const,
    marginBottom: '16px',
    lineHeight: '1.4',
  },
  rocketDisplay: {
    width: '100%',
    maxWidth: '460px',
    height: '120px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.06)',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative' as const,
  },
  rocketInner: {
    textAlign: 'center' as const,
    transition: 'transform 0.3s',
  },
  rocketEmoji: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '4px',
  },
  rocketLabel: {
    fontSize: '14px',
    color: '#888',
  },
  resultOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(6px)',
  },
  resultCard: {
    background: 'linear-gradient(135deg, #1a1a3e, #2c2c54)',
    borderRadius: '20px',
    padding: '32px 28px',
    width: '90%',
    maxWidth: '380px',
    textAlign: 'center' as const,
    border: '1px solid rgba(255,255,255,0.15)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  },
  resultEmoji: {
    fontSize: '56px',
    marginBottom: '12px',
  },
  resultTitle: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '8px',
  },
  resultWin: {
    color: '#2ecc71',
  },
  resultLose: {
    color: '#e74c3c',
  },
  resultDetail: {
    fontSize: '16px',
    color: '#bbb',
    marginBottom: '6px',
  },
  resultMultiplier: {
    fontSize: '44px',
    fontWeight: '800',
    margin: '12px 0',
    color: '#f1c40f',
    textShadow: '0 0 30px rgba(241,196,15,0.3)',
  },
  resultPayout: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#2ecc71',
    marginBottom: '16px',
  },
  closeButton: {
    padding: '12px 40px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'opacity 0.2s',
  },
  hashRow: {
    fontSize: '11px',
    color: '#666',
    wordBreak: 'break-all' as const,
    marginTop: '10px',
    lineHeight: '1.5',
  },
};

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
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={onBack}>
          ← Back
        </button>
        <h1 style={styles.title}>🚀 Limbo</h1>
        <div style={styles.balanceBox}>💰 {balance.toLocaleString()}</div>
      </div>

      <div style={styles.rocketDisplay}>
        <div style={styles.rocketInner}>
          <span style={styles.rocketEmoji}>🚀</span>
          <span style={styles.rocketLabel}>
            {result
              ? `Crashed at ×${result.crashPoint.toFixed(2)}`
              : 'Set your target and launch!'}
          </span>
        </div>
      </div>

      <div style={styles.gameArea}>
        <p style={styles.infoText}>
          Set a target multiplier. The rocket flies higher and higher — if it passes your target before crashing, you win!
        </p>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Bet Amount</label>
          <input
            style={styles.input}
            type="number"
            min={1}
            max={balance}
            value={betAmount}
            onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 0))}
            placeholder="Enter bet amount"
          />
        </div>

        <div style={styles.quickBets}>
          {QUICK_BETS.map((amount) => (
            <button
              key={amount}
              style={{
                ...styles.quickBetBtn,
                ...(betAmount === amount
                  ? {
                      background: 'rgba(108,92,231,0.25)',
                      borderColor: '#6c5ce7',
                      color: '#a29bfe',
                    }
                  : {}),
              }}
              onClick={() => handleQuickBet(amount)}
            >
              {amount}
            </button>
          ))}
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Target Multiplier (1.01 - 10,000)</label>
          <input
            style={styles.input}
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

        <button
          style={{
            ...styles.playButton,
            ...(loading || betAmount <= 0 || betAmount > balance
              ? styles.playButtonDisabled
              : {}),
          }}
          onClick={handlePlay}
          disabled={loading || betAmount <= 0 || betAmount > balance}
        >
          {loading ? '🚀 Flying...' : '🚀 Play'}
        </button>
      </div>

      {result && (
        <div style={styles.resultOverlay} onClick={handleCloseResult}>
          <div style={styles.resultCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.resultEmoji}>🚀</div>
            <div
              style={{
                ...styles.resultTitle,
                ...(result.playerWon ? styles.resultWin : styles.resultLose),
              }}
            >
              {result.playerWon
                ? '✨ YOU WON!'
                : result.crashPoint > 1
                ? '💥 CRASHED!'
                : '💥 CRASHED!'}
            </div>

            <div style={styles.resultMultiplier}>
              ×{result.crashPoint.toFixed(2)}
            </div>

            <div style={styles.resultDetail}>
              Target: ×{targetMultiplier.toFixed(2)}
              {result.playerWon && (
                <span style={{ color: '#2ecc71', marginLeft: '8px' }}>
                  ✓ Passed
                </span>
              )}
            </div>

            {result.playerWon && (
              <div style={styles.resultPayout}>
                +{result.payout.toLocaleString()} (×{result.payoutMultiplier.toFixed(2)})
              </div>
            )}

            <div style={styles.hashRow}>
              Hash: {result.resultHash.slice(0, 20)}...<br />
              Nonce: {result.nonce} | Seed: {result.clientSeed.slice(0, 12)}...
            </div>

            <button style={styles.closeButton} onClick={handleCloseResult}>
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LimboGame;
