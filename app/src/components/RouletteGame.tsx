import React, { useState } from 'react';

interface RouletteGameProps {
  onBack: () => void;
  userId?: number;
}

const QUICK_BETS = [0.001, 0.01, 0.1, 1.0];

type BetType = 'number' | 'color' | 'section';

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

function numberColor(n: number): 'red' | 'black' | 'green' {
  if (n === 0) return 'green';
  return RED_NUMBERS.includes(n) ? 'red' : 'black';
}

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
      setShowSpinNumber(Math.floor(Math.random() * 37));
    }

    setShowSpinNumber(finalNumber);
    setAnimating(false);
  };

  const handleSpin = async () => {
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

  // Build number grid: 0 then 1-36 in rows of 6
  const numberGridRows: number[][] = [];
  for (let i = 1; i <= 36; i += 6) {
    numberGridRows.push([i, i + 1, i + 2, i + 3, i + 4, i + 5]);
  }

  return (
    <div className="page">
      {/* Header */}
      <button className="btn-back" onClick={onBack}>&larr; BACK</button>

      <h1 className="s-title">ROULETTE</h1>

      {/* Bet Amount */}
      <div>
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
      </div>

      {/* Bet Type Selector */}
      <div>
        <div className="s-title">BET TYPE</div>
        <div className="chips">
          {(['number', 'color', 'section'] as BetType[]).map((bt) => (
            <button
              key={bt}
              className={"chip" + (betType === bt ? " active" : "")}
              onClick={() => setBetType(bt)}
            >
              {bt.charAt(0).toUpperCase() + bt.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Number Picker */}
      {betType === 'number' && (
        <div>
          <div className="s-title">PICK A NUMBER</div>
          {/* Zero */}
          <div
            className={"chip" + (selectedNumber === 0 ? " active" : "")}
            style={{ marginBottom: '6px', textAlign: 'center' }}
            onClick={() => setSelectedNumber(0)}
          >
            0
          </div>
          {/* Grid 1-36 */}
          <div className="chips" style={{ flexWrap: 'wrap' }}>
            {numberGridRows.flat().map((n) => {
              const col = numberColor(n);
              return (
                <button
                  key={n}
                  className={"chip" + (selectedNumber === n ? " active" : "")}
                  style={{
                    color: col === 'red' ? '#ef4444' : col === 'green' ? '#22c55e' : undefined,
                  }}
                  onClick={() => setSelectedNumber(n)}
                >
                  {n}
                </button>
              );
            })}
          </div>
          {selectedNumber !== null && (
            <div style={{ textAlign: 'center', fontSize: '13px', color: '#888', marginTop: '8px' }}>
              Selected: <strong style={{
                color: numberColor(selectedNumber) === 'red' ? '#ef4444'
                  : numberColor(selectedNumber) === 'green' ? '#22c55e' : '#fff'
              }}>{selectedNumber}</strong>
            </div>
          )}
        </div>
      )}

      {/* Color Selector */}
      {betType === 'color' && (
        <div>
          <div className="s-title">PICK A COLOR</div>
          <div className="chips">
            <button
              className={"chip" + (selectedColor === 'red' ? " active" : "")}
              style={{ color: '#ef4444' }}
              onClick={() => setSelectedColor('red')}
            >
              RED
            </button>
            <button
              className={"chip" + (selectedColor === 'black' ? " active" : "")}
              onClick={() => setSelectedColor('black')}
            >
              BLACK
            </button>
          </div>
        </div>
      )}

      {/* Section Selector */}
      {betType === 'section' && (
        <div>
          <div className="s-title">PICK A SECTION</div>
          <div className="chips">
            <button
              className={"chip" + (selectedSection === '1-12' ? " active" : "")}
              onClick={() => setSelectedSection('1-12')}
            >
              1ST 12 (1-12)
            </button>
            <button
              className={"chip" + (selectedSection === '13-24' ? " active" : "")}
              onClick={() => setSelectedSection('13-24')}
            >
              2ND 12 (13-24)
            </button>
            <button
              className={"chip" + (selectedSection === '25-36' ? " active" : "")}
              onClick={() => setSelectedSection('25-36')}
            >
              3RD 12 (25-36)
            </button>
          </div>
        </div>
      )}

      {/* Wheel / Spin Display */}
      <div className="term-box">
        <div className="term-box-hd"><span>WHEEL</span></div>
        <div className="term-box-bd">
          {showSpinNumber !== null ? (
            <div className="roulette-display">
              <div
                className={"roulette-number " + numberColor(showSpinNumber)}
              >
                {showSpinNumber}
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: 700,
                marginTop: '4px',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                color: numberColor(showSpinNumber) === 'red' ? '#ef4444'
                  : numberColor(showSpinNumber) === 'green' ? '#22c55e' : '#fff',
              }}>
                {numberColor(showSpinNumber).toUpperCase()}
              </div>
            </div>
          ) : (
            <div className="roulette-display">
              <div style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>
                {loading || animating ? 'SPINNING...' : 'PLACE YOUR BET & SPIN'}
              </div>
              <div
                className="roulette-number"
                style={{
                  color: '#555',
                  fontSize: animating ? '48px' : '56px',
                }}
              >
                {loading || animating ? SPINNING_STATES[spinIndex % SPINNING_STATES.length] : '—'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Spin Button */}
      <button
        className={"btn btn-green" + (loading || animating ? " disabled" : "")}
        onClick={handleSpin}
        disabled={loading || animating}
      >
        {loading ? 'SENDING...' : animating ? 'SPINNING...' : 'SPIN'}
      </button>

      {error && <div style={{ color: '#ef4444', textAlign: 'center', marginTop: '8px', fontSize: '14px' }}>{error}</div>}

      {/* Stats */}
      <div className="stats">
        <div className="stat-row">
          <span className="stat-label">BET</span>
          <span className="stat-val">{amount} TON</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">TYPE</span>
          <span className="stat-val">
            {betType === 'number' && selectedNumber !== null
              ? `Number ${selectedNumber}`
              : betType === 'color' && selectedColor
              ? selectedColor.toUpperCase()
              : betType === 'section' && selectedSection
              ? selectedSection
              : '—'}
          </span>
        </div>
      </div>

      {/* Result Overlay */}
      {result && !animating && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px',
          boxSizing: 'border-box',
        }} onClick={closeResult}>
          <div
            className={"result " + (result.playerWon ? "result-win" : "result-lose")}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={"result-label " + (result.playerWon ? "win" : "lose")}>
              {result.playerWon ? 'YOU WON' : 'YOU LOST'}
            </div>
            <div
              className="result-number"
              style={{
                color: numberColor(result.spin) === 'red' ? '#ef4444'
                  : numberColor(result.spin) === 'green' ? '#22c55e' : '#fff',
              }}
            >
              {result.spin}
            </div>
            <div style={{ fontSize: '13px', color: '#aaa', margin: '4px 0' }}>
              {numberColor(result.spin).toUpperCase()}
            </div>
            <div style={{
              fontSize: '28px',
              fontWeight: 700,
              margin: '12px 0',
              color: result.playerWon ? '#22c55e' : '#ef4444',
            }}>
              {result.playerWon ? '+' : ''}{formatPayout(result.payout)}
            </div>
            {result.payoutMultiplier && (
              <div style={{ fontSize: '13px', color: '#aaa', margin: '4px 0' }}>
                Payout: x{result.payoutMultiplier}
              </div>
            )}
            <div className="result-hash">
              {result.resultHash}
            </div>
            <button className="btn btn-green" onClick={closeResult} style={{ marginTop: '16px' }}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouletteGame;
