import React, { useState } from 'react';

interface RouletteGameProps {
  onBack: () => void;
  userId?: number;
}

const QUICK_BETS = [0.001, 0.01, 0.1, 1.0];

type BetType = 'number' | 'color' | 'section';

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

function numberColor(n: number): 'red' | 'black' | 'green' {
  if (n === 0) return 'green';
  return RED_NUMBERS.includes(n) ? 'red' : 'black';
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#111',
    color: '#fff',
    minHeight: '100vh',
    padding: '16px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
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
  betTypeRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  betTypeBtn: {
    flex: 1,
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #2a2a3e',
    backgroundColor: '#1a1a2e',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    textAlign: 'center' as const,
  },
  betTypeActive: {
    borderColor: '#fff',
    color: '#fff',
    backgroundColor: '#2a2a4e',
  },
  numberGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '6px',
    marginBottom: '12px',
  },
  numberCell: {
    padding: '12px 0',
    borderRadius: '8px',
    border: '1px solid #2a2a3e',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: 600,
    textAlign: 'center' as const,
    transition: 'all 0.15s ease',
  },
  numberCellRed: {
    backgroundColor: '#3a1a1a',
    borderColor: '#6b2a2a',
    color: '#ef4444',
  },
  numberCellBlack: {
    backgroundColor: '#1a1a2e',
    borderColor: '#333',
    color: '#fff',
  },
  numberCellGreen: {
    backgroundColor: '#1a2a1a',
    borderColor: '#2a4a2a',
    color: '#22c55e',
  },
  numberCellSelected: {
    borderColor: '#fff',
    boxShadow: '0 0 8px rgba(255,255,255,0.3)',
  },
  colorRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px',
  },
  colorBtn: {
    flex: 1,
    padding: '14px',
    borderRadius: '10px',
    border: '2px solid #2a2a3e',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
    textAlign: 'center' as const,
    transition: 'all 0.15s ease',
  },
  colorBtnRed: {
    backgroundColor: '#3a1a1a',
    color: '#ef4444',
  },
  colorBtnBlack: {
    backgroundColor: '#1a1a2e',
    color: '#fff',
  },
  colorBtnSelected: {
    borderColor: '#fff',
    boxShadow: '0 0 8px rgba(255,255,255,0.2)',
  },
  sectionRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  sectionBtn: {
    flex: 1,
    padding: '14px',
    borderRadius: '10px',
    border: '2px solid #2a2a3e',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    textAlign: 'center' as const,
  },
  sectionBtnActive: {
    borderColor: '#fff',
    backgroundColor: '#2a2a4e',
  },
  spinBtn: {
    width: '100%',
    padding: '14px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
    color: '#fff',
    fontSize: '18px',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '12px',
  },
  spinBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  wheelDisplay: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    margin: '24px 0',
    padding: '24px',
    backgroundColor: '#1a1a2e',
    borderRadius: '16px',
    border: '2px solid #2a2a3e',
    minHeight: '120px',
  },
  wheelNumber: {
    fontSize: '56px',
    fontWeight: 800,
    lineHeight: 1.2,
    transition: 'all 0.3s ease',
  },
  wheelColor: {
    fontSize: '16px',
    fontWeight: 500,
    marginTop: '4px',
    textTransform: 'uppercase' as const,
    letterSpacing: '2px',
  },
  wheelLabel: {
    fontSize: '13px',
    color: '#888',
    marginBottom: '8px',
  },
  spinAnimation: {
    fontSize: '48px',
    fontWeight: 800,
    animation: 'none',
    color: '#eab308',
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center' as const,
    marginTop: '8px',
    fontSize: '14px',
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

const SPINNING_STATES = ['●', '◎', '◉', '○'];

const RouletteGame: React.FC<RouletteGameProps> = ({ onBack }) => {
  const [amount, setAmount] = useState('0.01');
  const [betType, setBetType] = useState<BetType>('number');
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<'red' | 'black' | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [animating, setAnimating] = useState(false);
  const [spinIndex, setSpinIndex] = useState(0);
  const [showSpinNumber, setShowSpinNumber] = useState<number | null>(null);

  const handleQuickBet = (val: number) => {
    setAmount(val.toString());
  };

  const buildBetPayload = () => {
    switch (betType) {
      case 'number':
        return { betType: 'number', number: selectedNumber };
      case 'color':
        return { betType: 'color', color: selectedColor };
      case 'section':
        return { betType: 'section', section: selectedSection };
    }
  };

  const spinWheelAnimation = async (finalNumber: number) => {
    setAnimating(true);
    setShowSpinNumber(null);

    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 80 + i * 20));
      setSpinIndex(i);
      // Show random numbers
      setShowSpinNumber(Math.floor(Math.random() * 37));
    }

    // Snap to final
    setShowSpinNumber(finalNumber);
    setAnimating(false);
  };

  const handleSpin = async () => {
    // Validate
    if (betType === 'number' && selectedNumber === null) {
      setError('Pick a number');
      return;
    }
    if (betType === 'color' && selectedColor === null) {
      setError('Pick a color');
      return;
    }
    if (betType === 'section' && selectedSection === null) {
      setError('Pick a section');
      return;
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setShowSpinNumber(null);

    try {
      const initData = (window as any).Telegram?.WebApp?.initDataUnsafe || '';
      const payload = {
        amount: amt,
        initData,
        ...buildBetPayload(),
      };

      const res = await fetch('/api/roulette', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setResult(data);

      await spinWheelAnimation(data.spin);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const closeResult = () => {
    setResult(null);
  };

  const getNumberStyle = (n: number): React.CSSProperties => {
    const base: React.CSSProperties = { ...styles.numberCell };
    const col = numberColor(n);
    if (col === 'red') Object.assign(base, styles.numberCellRed);
    else if (col === 'black') Object.assign(base, styles.numberCellBlack);
    else Object.assign(base, styles.numberCellGreen);
    if (selectedNumber === n) Object.assign(base, styles.numberCellSelected);
    return base;
  };

  const getColorForNumber = (n: number): string => {
    const col = numberColor(n);
    if (col === 'red') return '#ef4444';
    if (col === 'black') return '#fff';
    return '#22c55e';
  };

  // Build number grid: 0 then 1-36 in rows of 6
  const numberGridRows: number[][] = [];
  for (let i = 1; i <= 36; i += 6) {
    numberGridRows.push([i, i + 1, i + 2, i + 3, i + 4, i + 5]);
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>← Back</button>
        <h1 style={styles.title}>Roulette</h1>
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

      {/* Bet Type Selector */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Bet Type</div>
        <div style={styles.betTypeRow}>
          {(['number', 'color', 'section'] as BetType[]).map((bt) => (
            <button
              key={bt}
              style={{
                ...styles.betTypeBtn,
                ...(betType === bt ? styles.betTypeActive : {}),
              }}
              onClick={() => setBetType(bt)}
            >
              {bt.charAt(0).toUpperCase() + bt.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Number Picker */}
      {betType === 'number' && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Pick a Number</div>
          {/* Zero */}
          <div
            style={{
              ...getNumberStyle(0),
              marginBottom: '6px',
            }}
            onClick={() => setSelectedNumber(0)}
          >
            0
          </div>
          {/* Grid 1-36 */}
          <div style={styles.numberGrid}>
            {numberGridRows.flat().map((n) => (
              <div
                key={n}
                style={getNumberStyle(n)}
                onClick={() => setSelectedNumber(n)}
              >
                {n}
              </div>
            ))}
          </div>
          {selectedNumber !== null && (
            <div style={{ textAlign: 'center', fontSize: '13px', color: '#888' }}>
              Selected: <strong style={{ color: getColorForNumber(selectedNumber) }}>{selectedNumber}</strong>
            </div>
          )}
        </div>
      )}

      {/* Color Selector */}
      {betType === 'color' && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Pick a Color</div>
          <div style={styles.colorRow}>
            <button
              style={{
                ...styles.colorBtn,
                ...styles.colorBtnRed,
                ...(selectedColor === 'red' ? styles.colorBtnSelected : {}),
              }}
              onClick={() => setSelectedColor('red')}
            >
              🔴 RED
            </button>
            <button
              style={{
                ...styles.colorBtn,
                ...styles.colorBtnBlack,
                ...(selectedColor === 'black' ? styles.colorBtnSelected : {}),
              }}
              onClick={() => setSelectedColor('black')}
            >
              ⚫ BLACK
            </button>
          </div>
        </div>
      )}

      {/* Section Selector */}
      {betType === 'section' && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Pick a Section</div>
          <div style={styles.sectionRow}>
            <button
              style={{
                ...styles.sectionBtn,
                ...(selectedSection === '1-12' ? styles.sectionBtnActive : {}),
              }}
              onClick={() => setSelectedSection('1-12')}
            >
              1st 12<br /><span style={{ fontSize: '11px', color: '#888' }}>1–12</span>
            </button>
            <button
              style={{
                ...styles.sectionBtn,
                ...(selectedSection === '13-24' ? styles.sectionBtnActive : {}),
              }}
              onClick={() => setSelectedSection('13-24')}
            >
              2nd 12<br /><span style={{ fontSize: '11px', color: '#888' }}>13–24</span>
            </button>
            <button
              style={{
                ...styles.sectionBtn,
                ...(selectedSection === '25-36' ? styles.sectionBtnActive : {}),
              }}
              onClick={() => setSelectedSection('25-36')}
            >
              3rd 12<br /><span style={{ fontSize: '11px', color: '#888' }}>25–36</span>
            </button>
          </div>
        </div>
      )}

      {/* Wheel / Spin Display */}
      <div style={styles.wheelDisplay}>
        {showSpinNumber !== null ? (
          <>
            <div style={styles.wheelLabel}>Result</div>
            <div
              style={{
                ...styles.wheelNumber,
                color: getColorForNumber(showSpinNumber),
              }}
            >
              {showSpinNumber}
            </div>
            <div
              style={{
                ...styles.wheelColor,
                color: getColorForNumber(showSpinNumber),
              }}
            >
              {numberColor(showSpinNumber).toUpperCase()}
            </div>
          </>
        ) : (
          <>
            <div style={styles.wheelLabel}>
              {loading || animating ? 'Spinning...' : 'Place your bet & spin'}
            </div>
            <div
              style={{
                ...styles.wheelNumber,
                color: '#555',
                fontSize: animating ? '48px' : '56px',
              }}
            >
              {loading || animating ? SPINNING_STATES[spinIndex % SPINNING_STATES.length] : '🎯'}
            </div>
          </>
        )}
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
        {loading ? 'Sending...' : animating ? 'Spinning...' : '🎡 Spin'}
      </button>

      {error && <div style={styles.errorText}>{error}</div>}

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
            <div style={styles.resultDetail}>
              Number: <strong style={{ color: getColorForNumber(result.spin) }}>{result.spin}</strong>
              {' '}({numberColor(result.spin).toUpperCase()})
            </div>
            {result.payoutMultiplier && (
              <div style={styles.resultDetail}>
                Payout: ×{result.payoutMultiplier}
              </div>
            )}
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

export default RouletteGame;
