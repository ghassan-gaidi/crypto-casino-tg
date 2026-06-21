import React, { useState, useEffect, useCallback } from 'react';

interface PlinkoGameProps {
  onBack: () => void;
  userId?: number;
}

const QUICK_BETS = [0.001, 0.01, 0.1, 1.0];
const ROWS_OPTIONS = [8, 12, 16] as const;
const RISK_OPTIONS = ['low', 'medium', 'high'] as const;

const PLINKO_SIZE = 15; // pegs per row max
const PEG_RADIUS = 4;
const BALL_RADIUS = 7;

const RISK_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#ef4444',
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#111',
    color: '#fff',
    minHeight: '100vh',
    padding: '16px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    position: 'relative',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
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
  },
  label: {
    fontSize: '13px',
    color: '#888',
  },
  value: {
    fontSize: '16px',
    fontWeight: 600,
  },
  section: {
    marginBottom: '20px',
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
    boxSizing: 'border-box' as const,
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
  chipRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
  },
  chip: {
    padding: '10px 20px',
    borderRadius: '20px',
    border: '2px solid #333',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
  },
  chipActive: {
    border: '2px solid #fff',
    backgroundColor: '#2a2a4e',
  },
  playBtn: {
    width: '100%',
    padding: '14px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#22c55e',
    color: '#fff',
    fontSize: '18px',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '12px',
  },
  playBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  plinkoBoard: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '16px 0',
    overflow: 'hidden',
  },
  pegRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginBottom: '6px',
    position: 'relative' as const,
  },
  peg: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#3a3a5e',
  },
  ballIndicator: {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    backgroundColor: '#22c55e',
    position: 'absolute' as const,
    top: '-3px',
    transition: 'left 0.3s ease',
  },
  slotRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    marginTop: '8px',
    padding: '0 8px',
  },
  slot: {
    width: '28px',
    height: '20px',
    textAlign: 'center' as const,
    fontSize: '14px',
    fontWeight: 600,
    color: '#888',
  },
  slotHighlighted: {
    color: '#22c55e',
  },
  slotMultiplier: {
    fontSize: '10px',
    color: '#555',
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
  resultWin: {
    borderColor: '#22c55e',
  },
  resultLoss: {
    borderColor: '#ef4444',
  },
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
    background: '#22c55e',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};

function formatPayout(amount: number): string {
  return amount.toFixed(6);
}

const PlinkoGame: React.FC<PlinkoGameProps> = ({ onBack }) => {
  const [amount, setAmount] = useState('0.01');
  const [rows, setRows] = useState<number>(12);
  const [risk, setRisk] = useState<string>('medium');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [dropSlot, setDropSlot] = useState<number | null>(null);
  const [error, setError] = useState('');

  // Build peg rows for visualization
  const pegRows = Array.from({ length: rows }, (_, rowIdx) => {
    const pegCount = rowIdx + 1;
    return Array.from({ length: pegCount }, (_, pegIdx) => ({
      row: rowIdx,
      col: pegIdx,
      key: `${rowIdx}-${pegIdx}`,
    }));
  });

  const multiplierMap: Record<string, number[]> = {
    low: [/* 8 */ 13, 3, 1.4, 0.7, 0.4, 0.4, 0.7, 1.4, 3, 13],
    medium: [/* 12 */ 24, 6, 2, 0.9, 0.5, 0.3, 0.3, 0.5, 0.9, 2, 6, 24],
    high: [/* 16 */ 110, 26, 8, 2, 0.6, 0.3, 0.2, 0.2, 0.2, 0.2, 0.2, 0.3, 0.6, 2, 8, 26, 110],
  };

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

    try {
      const initData = (window as any).Telegram?.WebApp?.initDataUnsafe || '';
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
      setDropSlot(data.slot);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [amount, rows, risk]);

  const closeResult = () => {
    setResult(null);
    setDropSlot(null);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>← Back</button>
        <h1 style={styles.title}>Plinko</h1>
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

      {/* Rows Selector */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Rows</div>
        <div style={styles.chipRow}>
          {ROWS_OPTIONS.map((r) => (
            <button
              key={r}
              style={{
                ...styles.chip,
                ...(rows === r ? styles.chipActive : {}),
              }}
              onClick={() => setRows(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Risk Selector */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Risk</div>
        <div style={styles.chipRow}>
          {RISK_OPTIONS.map((r) => (
            <button
              key={r}
              style={{
                ...styles.chip,
                borderColor: RISK_COLORS[r],
                ...(risk === r ? { backgroundColor: RISK_COLORS[r] + '33', borderColor: RISK_COLORS[r], color: RISK_COLORS[r] as string } : {}),
              }}
              onClick={() => setRisk(r)}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Plinko Board Visualization */}
      <div style={styles.plinkoBoard}>
        {pegRows.map((row, rowIdx) => (
          <div key={rowIdx} style={styles.pegRow}>
            {row.map((peg) => (
              <div
                key={peg.key}
                style={{
                  ...styles.peg,
                  ...(dropSlot !== null && rowIdx === rows - 1 && peg.col === dropSlot
                    ? { backgroundColor: '#22c55e', boxShadow: '0 0 8px #22c55e' }
                    : {}),
                }}
              />
            ))}
          </div>
        ))}

        {/* Slot labels */}
        <div style={styles.slotRow}>
          {Array.from({ length: rows + 1 }, (_, i) => (
            <div
              key={i}
              style={{
                ...styles.slot,
                ...(dropSlot === i ? { ...styles.slotHighlighted, fontSize: '18px' } : {}),
              }}
            >
              {dropSlot === i ? '●' : '○'}
            </div>
          ))}
        </div>
      </div>

      {/* Play Button */}
      <button
        style={{ ...styles.playBtn, ...(loading ? styles.playBtnDisabled : {}) }}
        onClick={handlePlay}
        disabled={loading}
      >
        {loading ? 'Spinning...' : 'Drop Ball'}
      </button>

      {error && (
        <div style={{ color: '#ef4444', textAlign: 'center', marginTop: '8px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {/* Result Overlay */}
      {result && (
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
            <div style={styles.resultDetail}>
              Slot: <strong>{result.slot}</strong> | Rows: {result.rows} | Risk: {result.risk}
            </div>
            <div style={styles.resultDetail}>
              Multiplier: <strong>{result.multiplier}x</strong>
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

export default PlinkoGame;
