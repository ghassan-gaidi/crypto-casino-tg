import { useState } from 'react'
import { useGameFeedback } from '../hooks';
import { isRateLimited, RateLimitBanner } from '../rate-limit-ui';

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

export default function RouletteGame({ onBack }: RouletteGameProps) {
  const [amount, setAmount] = useState('0.01');
  const [betType, setBetType] = useState<BetType>('number');
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<'red' | 'black' | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useGameFeedback(result)
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
      const initData = (window as any).Telegram?.WebApp?.initData || '';
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

  const numberGridRows: number[][] = [];
  for (let i = 1; i <= 36; i += 6) {
    numberGridRows.push([i, i + 1, i + 2, i + 3, i + 4, i + 5]);
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="header">
        <button className="btn-back" onClick={onBack}>BACK</button>
        <span className="header-title">ROULETTE</span>
        <span className="header-balance"></span>
      </div>

      {/* Bet Amount */}
      <div className="term-box">
        <div className="term-box-hd"><span>AMOUNT</span></div>
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

      {/* Bet Type Selector */}
      <div className="term-box">
        <div className="term-box-hd"><span>BET TYPE</span></div>
        <div className="term-box-bd">
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
      </div>

      {/* Number Picker */}
      {betType === 'number' && (
        <div className="term-box">
          <div className="term-box-hd"><span>PICK A NUMBER</span></div>
          <div className="term-box-bd">
            <div
              className={"chip text-center mb-sm" + (selectedNumber === 0 ? " active" : "")}
              onClick={() => setSelectedNumber(0)}
            >
              0
            </div>
            <div className="chips number-grid">
              {numberGridRows.flat().map((n) => {
                const col = numberColor(n);
                return (
                  <button
                    key={n}
                    className={
                      "chip" +
                      (selectedNumber === n ? " active" : "") +
                      (col === 'red' ? " chip-red" : col === 'green' ? " chip-green" : "")
                    }
                    onClick={() => setSelectedNumber(n)}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            {selectedNumber !== null && (
              <div className="text-center text-dim t-small mt-sm">
                Selected: <span className={"stat-val" + (numberColor(selectedNumber) === 'red' ? " red" : numberColor(selectedNumber) === 'green' ? " green" : "")}>{selectedNumber}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Color Selector */}
      {betType === 'color' && (
        <div className="term-box">
          <div className="term-box-hd"><span>PICK A COLOR</span></div>
          <div className="term-box-bd">
            <div className="chips">
              <button
                className={"chip chip-red" + (selectedColor === 'red' ? " active" : "")}
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
        </div>
      )}

      {/* Section Selector */}
      {betType === 'section' && (
        <div className="term-box">
          <div className="term-box-hd"><span>PICK A SECTION</span></div>
          <div className="term-box-bd">
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
        </div>
      )}

      {/* Wheel / Spin Display */}
      <div className="term-box">
        <div className="term-box-hd"><span>WHEEL</span></div>
        <div className="term-box-bd">
          {showSpinNumber !== null ? (
            <div className="roulette-display">
              <div className={"roulette-number " + numberColor(showSpinNumber)}>
                {showSpinNumber}
              </div>
              <div className={"roulette-color-label " + numberColor(showSpinNumber)}>
                {numberColor(showSpinNumber).toUpperCase()}
              </div>
            </div>
          ) : (
            <div className="roulette-display">
              <div className="text-dim mb-sm">
                {loading || animating ? 'SPINNING...' : 'PLACE YOUR BET & SPIN'}
              </div>
              <div className={"roulette-number" + (loading || animating ? "" : " text-muted")}>
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

      {error && <div className="overlay-error">{error}</div>}

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

      {isRateLimited(result) && <RateLimitBanner data={result} />}
      {/* Result Overlay */}
      {result && !animating && (
        <div className="overlay" onClick={closeResult}>
          <div
            className={"result " + (result.playerWon ? "result-win" : "result-lose")}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={"result-label " + (result.playerWon ? "win" : "lose")}>
              {result.playerWon ? 'YOU WON' : 'YOU LOST'}
            </div>
            <div className={"result-number roulette-number " + numberColor(result.spin)}>
              {result.spin}
            </div>
            <div className={"roulette-color-label " + numberColor(result.spin)}>
              {numberColor(result.spin).toUpperCase()}
            </div>
            <div className={"t-display text-center mt-sm mb-sm " + (result.playerWon ? "text-green" : "text-red")}>
              {result.playerWon ? '+' : ''}{formatPayout(result.payout)}
            </div>
            {result.payoutMultiplier && (
              <div className="result-detail">
                Payout: x{result.payoutMultiplier}
              </div>
            )}
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
}
