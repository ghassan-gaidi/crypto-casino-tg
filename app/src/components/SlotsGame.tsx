import React, { useState, useEffect } from 'react';
import { useGameFeedback } from '../hooks';
import { useGameKeyboard } from '../hooks/keyboard';
import ShareWin from './ShareWin';
import HotCold from './HotCold';
import PayoutBadge from './PayoutBadge';
import AnimatedNumber from './AnimatedNumber';
import { showWinToast } from './WinToast';
import { isRateLimited, RateLimitBanner } from '../rate-limit-ui';
import BetMultipliers from './BetMultipliers';
import FairnessPanel from './FairnessPanel';
import GameLiveBets from './GameLiveBets';

interface SlotsGameProps {
  onBack: () => void;
  userId?: number;
}

const QUICK_BETS = [0.001, 0.01, 0.1, 1.0];

const SYMBOL_ICONS: Record<string, string> = {
  'CHERRY': '/icons/slot-cherry.svg',
  'LEMON': '/icons/slot-lemon.svg',
  'ORANGE': '/icons/slot-orange.svg',
  'GRAPE': '/icons/slot-grape.svg',
  'BELL': '/icons/slot-bell.svg',
  'DIAMOND': '/icons/slot-diamond.svg',
  'STAR': '/icons/slot-star.svg',
  'SEVEN': '/icons/slot-seven.svg',
};

const SYMBOLS_LIST = Object.keys(SYMBOL_ICONS);

function SlotSymbol({ symbol, size = 28, glow = false }: { symbol: string; size?: number; glow?: boolean }) {
  const src = SYMBOL_ICONS[symbol];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size,
      filter: glow ? 'drop-shadow(0 0 6px rgba(220,38,54,0.4))' : 'none',
      transition: 'filter 0.2s',
    }}>
      {src ? (
        <img src={src} alt={symbol} width={size} height={size} style={{ display: 'block' }} />
      ) : (
        <span style={{ fontSize: size * 0.7, lineHeight: 1, fontFamily: "'JetBrains Mono',monospace", color: '#DC2626' }}>
          {symbol[0]}
        </span>
      )}
    </span>
  );
}

function formatPayout(amount: number): string {
  return amount.toFixed(6);
}

const SlotsGame: React.FC<SlotsGameProps> = ({ onBack, userId }) => {
  const [amount, setAmount] = useState('0.01');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useGameFeedback(result);
  const [gameHistory, setGameHistory] = useState<boolean[]>([]);
  const [error, setError] = useState('');
  const [animating, setAnimating] = useState(false);
  const [displayReels, setDisplayReels] = useState<string[][]>([
    ['CHERRY', 'LEMON', 'ORANGE'],
    ['LEMON', 'ORANGE', 'GRAPE'],
    ['ORANGE', 'GRAPE', 'DIAMOND'],
  ]);
  const [spinPhase, setSpinPhase] = useState(0);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/balance?userId=${userId}`)
      .then(r => r.json())
      .then(data => { if (data.evm !== undefined) setBalance(parseFloat(data.evm) || 0); })
      .catch(() => setBalance(0));
  }, [userId]);

  const handleQuickBet = (val: number) => setAmount(val.toString());

  const spinAnimation = async (finalReels: string[][]) => {
    setAnimating(true);
    setSpinPhase(0);
    for (let phase = 0; phase < 8; phase++) {
      await new Promise((r) => setTimeout(r, 100 + phase * 30));
      setDisplayReels(
        finalReels.map(() =>
          [0, 1, 2].map(() => SYMBOLS_LIST[Math.floor(Math.random() * SYMBOLS_LIST.length)]!)
        )
      );
      setSpinPhase(phase);
    }
    setDisplayReels(finalReels);
    setAnimating(false);
  };

  const handleSpin = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { setError('Enter a valid amount'); return; }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const initData = (window as any).Telegram?.WebApp?.initData || '';
      const res = await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, initData }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setResult(data);
      setBalance(prev => prev !== null ? prev + data.payout - amt : prev);
      setGameHistory(prev => [...prev.slice(-9), data.won ?? data.playerWon ?? false]);
      if (data.won) showWinToast('slots', amount, data.payoutMultiplier ?? 1, '≡')

      const reels = data.reels || ['CHERRY,CHERRY,CHERRY', 'LEMON,LEMON,LEMON', 'ORANGE,ORANGE,ORANGE'];
      const parsedReels = reels.map((r: string) => {
        const sep = r.includes(',') ? ',' : (r.includes('-') ? '-' : '');
        return sep ? r.split(sep) : r.split('').filter((c: string) => c !== ',');
      });
      const paddedReels = parsedReels.map((r: string[]) =>
        r.length >= 3 ? r.slice(0, 3) : [...r, ...Array(3 - r.length).fill('CHERRY')]
      );
      await spinAnimation(paddedReels);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const closeResult = () => setResult(null);

  useGameKeyboard({
    onBet: handleSpin,
    onQuickBet: setAmount,
    disabled: loading,
    onHalfBet: () => { const c = parseFloat(amount) || 0; setAmount(Math.max(c / 2, 0.001).toFixed(4)) },
    onDoubleBet: () => { const c = parseFloat(amount) || 0; setAmount((balance != null ? Math.min(c * 2, balance) : c * 2).toFixed(4)) },
    onMaxBet: () => { setAmount((balance != null ? Math.max(balance, 0.001) : (parseFloat(amount) || 0) * 2).toFixed(4)) },
  });

  const formatCombo = (combo: string) => {
    if (!combo) return '';
    return combo.replace(/-/g, ' · ');
  };

  return (
    <div className="page">
      <div className="header">
        <button className="btn-back" onClick={onBack}>Back</button>
        <span className="header-title" style={{display:'flex',alignItems:'center',gap:6}}>
          <img src="/icons/icon-slots.svg" alt="" width="18" height="18" />
          SLOTS
        </span>
        <span className="header-balance">
          {balance !== null ? <AnimatedNumber value={balance} decimals={4} /> : '---'}
        </span>
      </div>

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
      <div className="chips mt-sm">
        {QUICK_BETS.map((qb) => (
          <button key={qb} className={"chip" + (parseFloat(amount) === qb ? " active" : "")} onClick={() => handleQuickBet(qb)}>{qb}</button>
        ))}
      </div>
      <BetMultipliers betAmount={amount} onSet={setAmount} balance={balance} />

      {/* Reels Display */}
      <div className="reels">
        {displayReels.map((reel, reelIdx) => (
          <div key={reelIdx} className={"reel" + (animating ? " spinning" : "")}>
            {reel.map((sym, symIdx) => (
              <div key={symIdx} className="reel-shadow" style={{
                padding: '2px 0',
                transform: animating ? `translateY(${Math.sin(reelIdx + symIdx + spinPhase) * 4}px)` : 'translateY(0)',
                transition: 'transform 0.15s ease',
              }}>
                <SlotSymbol symbol={sym} size={28} glow={!animating && reel.length === 3 && symIdx === 1} />
              </div>
            ))}
          </div>
        ))}
      </div>

      <button className="btn btn-green btn-pulse mt-sm" onClick={handleSpin} disabled={loading || animating}>
        {loading ? 'SPINNING...' : animating ? 'SPINNING...' : 'SPIN'}
      </button>

      {result && !animating && result.combo && (
        <div className="stats mt-md">
          <div className="stat-row">
            <span className="stat-label">COMBO</span>
            <span className="stat-val text-gold">{formatCombo(result.combo)}{result.payoutMultiplier && <> x{result.payoutMultiplier}</>}</span>
          </div>
        </div>
      )}

      {error && <div className="overlay-error mt-sm">{error}</div>}
      {isRateLimited(result) && <RateLimitBanner data={result} />}

      {result && !animating && (
        <div className={"result " + (result.playerWon ? "result-win" : "result-lose")} onClick={closeResult}>
          <div className={"result-label " + (result.playerWon ? "win" : "lose")}>
            {result.playerWon ? 'YOU WON' : 'YOU LOST'}
          </div>
          {result.playerWon && <PayoutBadge multiplier={result.payoutMultiplier || 1} />}
          <div className="result-number">{result.playerWon ? '+' : ''}{formatPayout(result.payout)}</div>
          {result.combo && (
            <div className="result-detail">
              COMBO: {formatCombo(result.combo)} {result.payoutMultiplier && <>x{result.payoutMultiplier}</>}
            </div>
          )}
          <div className="result-hash">HASH: {result.resultHash}</div>
          {result.playerWon && result.payoutMultiplier >= 2 && (
            <ShareWin game="slots" payout={result.payout} multiplier={result.payoutMultiplier} betAmount={parseFloat(amount)} />
          )}
          <HotCold history={gameHistory} />
          <button className="btn btn-ghost mt-md" onClick={(e) => { e.stopPropagation(); closeResult(); }}>CLOSE</button>
        </div>
      )}

      {/* Paytable */}
      <div className="term-box mt-lg">
        <div className="term-box-hd"><span>CASH PRIZES</span></div>
        <div className="term-box-bd">
          <div className="stat-row"><span className="stat-label"><SlotSymbol symbol="SEVEN" size={16} /> <SlotSymbol symbol="SEVEN" size={16} /> <SlotSymbol symbol="SEVEN" size={16} /></span><span className="stat-val text-green">x250</span></div>
          <div className="stat-row"><span className="stat-label"><SlotSymbol symbol="STAR" size={16} /> <SlotSymbol symbol="STAR" size={16} /> <SlotSymbol symbol="STAR" size={16} /></span><span className="stat-val text-green">x100</span></div>
          <div className="stat-row"><span className="stat-label"><SlotSymbol symbol="DIAMOND" size={16} /> <SlotSymbol symbol="DIAMOND" size={16} /> <SlotSymbol symbol="DIAMOND" size={16} /></span><span className="stat-val text-green">x50</span></div>
          <div className="stat-row"><span className="stat-label"><SlotSymbol symbol="BELL" size={16} /> <SlotSymbol symbol="BELL" size={16} /> <SlotSymbol symbol="BELL" size={16} /></span><span className="stat-val text-green">x20</span></div>
          <div className="stat-row"><span className="stat-label"><SlotSymbol symbol="CHERRY" size={16} /> <SlotSymbol symbol="CHERRY" size={16} /> <SlotSymbol symbol="CHERRY" size={16} /></span><span className="stat-val text-green">x10</span></div>
          <div className="stat-row"><span className="stat-label"><SlotSymbol symbol="LEMON" size={16} /> <SlotSymbol symbol="LEMON" size={16} /> <SlotSymbol symbol="LEMON" size={16} /></span><span className="stat-val text-green">x8</span></div>
          <div className="stat-row"><span className="stat-label"><SlotSymbol symbol="ORANGE" size={16} /> <SlotSymbol symbol="ORANGE" size={16} /> <SlotSymbol symbol="ORANGE" size={16} /></span><span className="stat-val text-green">x6</span></div>
          <div className="stat-row"><span className="stat-label"><SlotSymbol symbol="GRAPE" size={16} /> <SlotSymbol symbol="GRAPE" size={16} /> <SlotSymbol symbol="GRAPE" size={16} /></span><span className="stat-val text-green">x5</span></div>
        </div>
      </div>
      <GameLiveBets />
      <FairnessPanel userId={userId} gameName="slots" />
    </div>
  );
};

export default SlotsGame;
