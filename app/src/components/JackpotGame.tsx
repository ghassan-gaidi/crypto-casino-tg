import React, { useState, useCallback, useEffect } from 'react';

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

const INITIAL_BALANCE = 10000;
const QUICK_BETS = [100, 500, 1000, 2500, 5000];

const JackpotGame: React.FC<JackpotGameProps> = ({ onBack, userId }) => {
  const [betAmount, setBetAmount] = useState<number>(500);
  const [loading, setLoading] = useState<boolean>(false);
  const [enterLoading, setEnterLoading] = useState<boolean>(false);
  const [round, setRound] = useState<JackpotRound | null>(null);
  const [entryResult, setEntryResult] = useState<JackpotEntryResult | null>(null);
  const [balance, setBalance] = useState<number>(INITIAL_BALANCE);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchRound = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const initData = (window as any).Telegram?.WebApp?.initDataUnsafe || {};
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
      const initData = (window as any).Telegram?.WebApp?.initDataUnsafe || {};
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
        setBalance((prev) => prev - betAmount);
        fetchRound();
      }
    } catch (err) {
      console.error('Jackpot enter error:', err);
      setEntryResult({ success: false, round_id: '', prize_pool: 0, entries: 0 });
    } finally {
      setEnterLoading(false);
    }
  }, [betAmount, enterLoading, balance, userId, fetchRound]);

  const handleCloseResult = useCallback(() => {
    setEntryResult(null);
  }, []);

  const getStatusBadge = (status: string): { cls: string; label: string } => {
    switch (status?.toLowerCase()) {
      case 'open':
      case 'accepting':
        return { cls: 'result-label win', label: 'OPEN' };
      case 'drawing':
      case 'in_progress':
        return { cls: 'result-label', label: 'DRAWING' };
      case 'closed':
      case 'completed':
        return { cls: 'result-label lose', label: 'CLOSED' };
      default:
        return { cls: 'result-label', label: status || 'UNKNOWN' };
    }
  };

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '16px' }}>
        <button className="btn-back" onClick={onBack}>
          ← BACK
        </button>
        <h1 className="s-title">🎰 JACKPOT</h1>
        <div style={{ color: 'var(--green)', fontWeight: 700 }}>
          {balance.toLocaleString()} COINS
        </div>
      </div>

      {/* Jackpot Pool */}
      <div className="jackpot-pool" style={{ marginBottom: '16px' }}>
        <div className="jackpot-label">JACKPOT POOL</div>
        <div className="jackpot-amount">
          {round ? round.prize_pool.toLocaleString() : '—'}
        </div>
        {round && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '8px', fontSize: '13px', color: 'var(--muted)' }}>
            <span>ENTRIES: <span style={{ color: 'var(--cyan)' }}>{round.entry_count}</span></span>
            <span>STATUS: <span style={{ color: getStatusBadge(round.status).label === 'OPEN' ? 'var(--green)' : getStatusBadge(round.status).label === 'CLOSED' ? 'var(--red)' : 'var(--yellow)' }}>{getStatusBadge(round.status).label}</span></span>
          </div>
        )}
        {round && (
          <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--muted)', textAlign: 'center', wordBreak: 'break-all' }}>
            ROUND: {round.round_id}
          </div>
        )}
      </div>

      {/* Refresh */}
      <button className="btn btn-green" onClick={fetchRound} disabled={loading} style={{ width: '100%', marginBottom: '16px', opacity: loading ? 0.5 : 1 }}>
        {loading ? 'REFRESHING...' : '⟳ REFRESH STATUS'}
      </button>

      {/* Loading / Error */}
      {loading && !round && (
        <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
          Loading round info...
        </p>
      )}

      {fetchError && (
        <p style={{ textAlign: 'center', color: 'var(--red)', fontSize: '14px' }}>
          {fetchError}
        </p>
      )}

      {/* Game Area */}
      <div className="term-box" style={{ marginBottom: '16px' }}>
        <div className="term-box-hd">
          <span>ENTER ROUND</span>
        </div>
        <div className="term-box-bd">
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '12px', lineHeight: '1.4' }}>
            Buy entries into the current jackpot round. The more you bet, the higher your chance to win the entire prize pool.
          </p>

          {/* Quick Bet Chips */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {QUICK_BETS.map((amount) => (
              <button
                key={amount}
                className={"chip" + (betAmount === amount ? " active" : "")}
                onClick={() => handleQuickBet(amount)}
              >
                {amount}
              </button>
            ))}
          </div>

          {/* Bet Input */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
              ENTRY AMOUNT
            </label>
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
            className="btn btn-green"
            onClick={handleEnter}
            disabled={enterLoading || betAmount <= 0 || betAmount > balance}
            style={{ width: '100%', opacity: enterLoading || betAmount <= 0 || betAmount > balance ? 0.4 : 1 }}
          >
            {enterLoading ? '⟳ ENTERING...' : '🎰 ENTER ROUND'}
          </button>
        </div>
      </div>

      {/* Entry Result Overlay */}
      {entryResult && (
        <div
          className={"result " + (entryResult.success ? "result-win" : "result-lose")}
          onClick={handleCloseResult}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <div className="result-number" style={{ fontSize: '40px', marginBottom: '8px' }}>
              {entryResult.success ? '🎉' : '❌'}
            </div>

            {entryResult.success ? (
              <>
                <div className="result-label win" style={{ fontSize: '18px', marginBottom: '12px' }}>
                  ENTRY CONFIRMED
                </div>
                <div className="result-number">
                  🏆 {entryResult.prize_pool.toLocaleString()}
                </div>
                <div className="stat-row" style={{ marginTop: '12px', marginBottom: '12px' }}>
                  <div className="stat-row" style={{ width: '100%', justifyContent: 'space-between' }}>
                    <span className="stat-label">PRIZE POOL</span>
                    <span className="stat-val" style={{ color: 'var(--yellow)' }}>{entryResult.prize_pool.toLocaleString()}</span>
                  </div>
                </div>
                <div className="stat-row" style={{ marginBottom: '12px' }}>
                  <div className="stat-row" style={{ width: '100%', justifyContent: 'space-between' }}>
                    <span className="stat-label">TOTAL ENTRIES</span>
                    <span className="stat-val" style={{ color: 'var(--cyan)' }}>{entryResult.entries}</span>
                  </div>
                </div>
                <div style={{ color: 'var(--green)', fontSize: '14px', textAlign: 'center', marginBottom: '12px' }}>
                  GOOD LUCK! 🍀
                </div>
              </>
            ) : (
              <div className="result-label lose" style={{ fontSize: '16px', marginBottom: '12px' }}>
                COULD NOT PROCESS ENTRY.
                <br />
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  The round may be closed or your balance insufficient.
                </span>
              </div>
            )}

            <button
              className="btn btn-green"
              onClick={handleCloseResult}
              style={{ width: '100%' }}
            >
              {entryResult.success ? '🎯 CONTINUE' : 'TRY AGAIN'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JackpotGame;
