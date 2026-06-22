import React, { useState, useCallback } from 'react';

interface PlinkoGameProps {
  onBack: () => void;
  userId?: number;
}

const QUICK_BETS = [0.001, 0.01, 0.1, 1.0];
const ROWS_OPTIONS = [8, 12, 16] as const;
const RISK_OPTIONS = ['low', 'medium', 'high'] as const;

const RISK_COLORS: Record<string, string> = {
  low: '#0f0',
  medium: '#ff0',
  high: '#f00',
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
    <div className="page">
      {/* Header */}
      <div className="header">
        <button className="btn-back" onClick={onBack}>Back</button>
        <span className="header-title">PLINKO</span>
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
                className={"pick-btn" + (risk === r ? " active" : "")}
                style={
                  risk === r
                    ? { borderColor: RISK_COLORS[r], color: RISK_COLORS[r], background: RISK_COLORS[r] + '0a' }
                    : {}
                }
                onClick={() => setRisk(r)}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Plinko Board Visualization */}
      <div className="term-box">
        <div className="term-box-hd"><span>BOARD</span></div>
        <div className="term-box-bd" style={{ padding: '16px 0', overflow: 'hidden' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {pegRows.map((row, rowIdx) => (
              <div
                key={rowIdx}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '20px',
                  marginBottom: '6px',
                }}
              >
                {row.map((peg) => {
                  const isActive = dropSlot !== null && rowIdx === rows - 1 && peg.col === dropSlot;
                  return (
                    <div
                      key={peg.key}
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: isActive ? '#0f0' : '#1a1a1a',
                        boxShadow: isActive ? '0 0 8px rgba(0,255,0,.4)' : 'none',
                        transition: 'all .3s',
                      }}
                    />
                  );
                })}
              </div>
            ))}

            {/* Slot labels */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '24px',
                marginTop: '8px',
                padding: '0 8px',
              }}
            >
              {Array.from({ length: rows + 1 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: '28px',
                    height: '20px',
                    textAlign: 'center',
                    fontSize: dropSlot === i ? '18px' : '14px',
                    fontWeight: 600,
                    color: dropSlot === i ? '#0f0' : '#2a2a2a',
                  }}
                >
                  {dropSlot === i ? '●' : '○'}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Play Button */}
      <button
        className={"btn btn-green" + (loading ? " disabled" : "")}
        onClick={handlePlay}
        disabled={loading}
      >
        {loading ? 'DROPPING...' : 'DROP BALL'}
      </button>

      {error && (
        <div className="text-red text-center mt-sm" style={{ fontSize: '11px' }}>
          {error}
        </div>
      )}

      {/* Result Overlay */}
      {result && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={closeResult}
        >
          <div
            className={"result " + (result.playerWon ? "result-win" : "result-lose")}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={"result-label " + (result.playerWon ? "win" : "lose")}>
              {result.playerWon ? 'WIN' : 'LOSE'}
            </div>
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
            <button className="btn btn-green mt-md" onClick={closeResult}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlinkoGame;
