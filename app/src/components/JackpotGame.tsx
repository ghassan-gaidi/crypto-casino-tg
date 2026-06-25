import React, { useState, useCallback, useEffect } from 'react';
import { isRateLimited, RateLimitBanner } from '../rate-limit-ui';
import { sndWin, sndCoin, sndLose } from '../sounds';
import { hapticSuccess, hapticError } from '../haptic';
import { confetti } from '../confetti';
import { tapButton } from '../hooks';
import { useGameKeyboard } from '../hooks/keyboard';
import HotCold from './HotCold';
import AnimatedNumber from './AnimatedNumber';
import { showWinToast } from './WinToast';
import BetMultipliers from './BetMultipliers';
import FairnessPanel from './FairnessPanel';
import GameLiveBets from './GameLiveBets';

interface JackpotGameProps {
  onBack: () => void;
  userId?: number;
}

interface JackpotRound {
  round_id: string;
  prize_pool: number;
  entry_count: number;
  status: string;
}

interface JackpotEntryResult {
  success: boolean;
  round_id: string;
  prize_pool: number;
  entries: number;
}

const QUICK_BETS = [100, 500, 1000, 2500, 5000];

const JackpotGame: React.FC<JackpotGameProps> = ({ onBack, userId }) => {
  const [betAmount, setBetAmount] = useState<number>(500);
  const [loading, setLoading] = useState<boolean>(false);
  const [enterLoading, setEnterLoading] = useState<boolean>(false);
  const [round, setRound] = useState<JackpotRound | null>(null);
  const [entryResult, setEntryResult] = useState<JackpotEntryResult | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [entryHistory, setEntryHistory] = useState<boolean[]>([]);

  // Keyboard shortcuts: space = enter round, 1-5 = quick bets
  const quickBetMap: Record<string, number> = { '0.001': 100, '0.01': 500, '0.1': 1000, '1.0': 2500 };
  const handleQuickBetFromKey = useCallback((amt: string) => {
    const mapped = quickBetMap[amt];
    if (mapped !== undefined) {
      tapButton();
      setBetAmount(mapped);
    }
  }, []);

  // Fetch real balance from API
  useEffect(() => {
    if (!userId) return;
    fetch(`/api/balance?userId=${userId}`)
      .then(r => r.json())
      .then(data => {
        if (data.evm !== undefined) setBalance(Number(data.evm));
      })
      .catch(() => {});
  }, [userId]);

  const fetchRound = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const initData = (window as any).Telegram?.WebApp?.initData || '';
      const res = await fetch('/api/jackpot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'status',
          initData,
          userId,
        }),
      });
      const data = await res.json();
      if (data.round_id || data.status) {
        setRound(data as JackpotRound);
      }
    } catch (err) {
      console.error('Jackpot status error:', err);
      setFetchError('Failed to fetch round status');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRound();
  }, [fetchRound]);

  const handleQuickBet = useCallback((amount: number) => {
    setBetAmount(amount);
  }, []);

  const handleEnter = useCallback(async () => {
    if (enterLoading || betAmount <= 0 || betAmount > balance) return;

    setEnterLoading(true);
    setEntryResult(null);
    try {
      const initData = (window as any).Telegram?.WebApp?.initData || '';
      const res = await fetch('/api/jackpot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: betAmount,
          action: 'enter',
          initData,
          userId,
        }),
      });
      const data: JackpotEntryResult = await res.json();
      setEntryResult(data);
      if (data.success) {
        sndWin();
        sndCoin();
        hapticSuccess();
        confetti(1500);
        showWinToast('jackpot', betAmount, 2, '★');
        setEntryHistory(prev => [...prev.slice(-9), true]);
        setBalance((prev) => prev - betAmount);
        fetchRound();
      } else {
        sndLose();
        hapticError();
        setEntryHistory(prev => [...prev.slice(-9), false]);
      }
    } catch (err) {
      console.error('Jackpot enter error:', err);
      sndLose();
      hapticError();
      setEntryHistory(prev => [...prev.slice(-9), false]);
      setEntryResult({ success: false, round_id: '', prize_pool: 0, entries: 0 });
    } finally {
      setEnterLoading(false);
    }
  }, [betAmount, enterLoading, balance, userId, fetchRound]);

  useGameKeyboard({
    onBet: handleEnter,
    onQuickBet: handleQuickBetFromKey,
    disabled: enterLoading,
    onHalfBet: () => { setBetAmount(Math.max(betAmount / 2, 1)) },
    onDoubleBet: () => { setBetAmount(Math.min(betAmount * 2, balance)) },
    onMaxBet: () => { setBetAmount(Math.max(balance, 1)) },
  });

  const handleCloseResult = useCallback(() => {
    setEntryResult(null);
  }, []);

  const getStatusLabel = (status: string): { label: string; colorClass: string } => {
    switch (status?.toLowerCase()) {
      case 'open':
      case 'accepting':
        return { label: 'OPEN', colorClass: 'text-green' };
      case 'drawing':
      case 'in_progress':
        return { label: 'DRAWING', colorClass: 'text-yellow' };
      case 'closed':
      case 'completed':
        return { label: 'CLOSED', colorClass: 'text-red' };
      default:
        return { label: status || 'UNKNOWN', colorClass: 'text-dim' };
    }
  };

  return (
    <div className="page">
      <div className="header">
        <button className="btn-back" onClick={onBack}>
          Back
        </button>
        <span className="header-title">JACKPOT</span>
        <span className="header-balance"><AnimatedNumber value={balance} decimals={4} /></span>
      </div>

      {/* Jackpot Pool */}
      <div className="jackpot-pool">
        <div className="jackpot-label">JACKPOT POOL</div>
        <div className="jackpot-amount">
          {round ? round.prize_pool.toLocaleString() : '—'}
        </div>
        {round && (
          <div className="jackpot-info">
            <span>ENTRIES: <span className="text-cyan">{round.entry_count}</span></span>
            <span>STATUS: <span className={getStatusLabel(round.status).colorClass}>{getStatusLabel(round.status).label}</span></span>
          </div>
        )}
        {round && (
          <div className="jackpot-round-id">
            ROUND: {round.round_id}
          </div>
        )}
      </div>

      {/* Refresh */}
      <button className="btn btn-green mb-md" onClick={fetchRound} disabled={loading}>
        {loading ? 'REFRESHING...' : 'REFRESH STATUS'}
      </button>

      {/* Loading / Error */}
      {loading && !round && (
        <div className="text-center text-dim mb-md">
          Loading round info...
        </div>
      )}

      {fetchError && (
        <div className="text-center text-red mb-md">
          {fetchError}
        </div>
      )}

      {/* Game Area */}
      <div className="term-box">
        <div className="term-box-hd">
          <span>ENTER ROUND</span>
        </div>
        <div className="term-box-bd">
          <div className="text-dim mb-md" style={{ fontSize: '13px', lineHeight: 1.4 }}>
            Buy entries into the current jackpot round. The more you bet, the higher your chance to win the entire prize pool.
          </div>

          {/* Quick Bet Chips */}
          <div className="chips">
            {QUICK_BETS.map((amt) => (
              <button
                key={amt}
                className={"chip" + (betAmount === amt ? " active" : "")}
                onClick={() => { tapButton(); handleQuickBet(amt); }}
              >
                {amt}
              </button>
            ))}
          </div>

          <BetMultipliers betAmount={betAmount} onSet={setBetAmount} balance={balance} />

          {/* Bet Input */}
          <div className="s-title">ENTRY AMOUNT</div>
          <div className="mb-md">
            <input
              className="input"
              type="number"
              min={1}
              max={balance}
              value={betAmount}
              onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 0))}
              placeholder="Enter entry amount"
            />
          </div>

          {/* Enter Button */}
          <button
            className="btn btn-green btn-pulse"
            onClick={handleEnter}
            disabled={enterLoading || betAmount <= 0 || betAmount > balance}
          >
            {enterLoading ? 'ENTERING...' : 'ENTER ROUND'}
          </button>
        </div>
      </div>

      {isRateLimited(entryResult) && <RateLimitBanner data={entryResult} />}
      {/* Entry Result Overlay */}
      {entryResult && (
        <div className="overlay" onClick={handleCloseResult}>
          <div
            className={"result " + (entryResult.success ? "result-win" : "result-lose") + " animate-in"}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="result-number" style={{ fontSize: '40px', marginBottom: '8px' }}>
              {entryResult.success ? 'WIN' : 'LOSE'}
            </div>

            {entryResult.success ? (
              <>
                <div className="result-label win">
                  ENTRY CONFIRMED
                </div>
                <div className="result-number">
                  {entryResult.prize_pool.toLocaleString()}
                </div>
                <div className="jackpot-result-info">
                  <span className="stat-label">PRIZE POOL</span>
                  <span className="stat-val text-yellow">{entryResult.prize_pool.toLocaleString()}</span>
                </div>
                <div className="jackpot-result-info">
                  <span className="stat-label">TOTAL ENTRIES</span>
                  <span className="stat-val text-cyan">{entryResult.entries}</span>
                </div>
                <div className="text-center text-green mt-sm mb-sm">
                  GOOD LUCK
                </div>
              </>
            ) : (
              <div className="result-label lose">
                COULD NOT PROCESS ENTRY.
                <br />
                <span className="text-dim" style={{ fontSize: '12px' }}>
                  The round may be closed or your balance insufficient.
                </span>
              </div>
            )}

            <HotCold history={entryHistory} />

            <button
              className="btn btn-green mt-md"
              onClick={handleCloseResult}
            >
              {entryResult.success ? 'CONTINUE' : 'TRY AGAIN'}
            </button>
          </div>
        </div>
      )}
      <GameLiveBets />
      <FairnessPanel userId={userId} gameName="jackpot" />
    </div>
  );
};

export default JackpotGame;
