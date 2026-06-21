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

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a0a00, #2c1500, #1a0a00)',
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
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    background: 'linear-gradient(90deg, #f39c12, #e67e22, #f1c40f)',
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
  },
  roundCard: {
    width: '100%',
    maxWidth: '460px',
    background: 'linear-gradient(135deg, rgba(243,156,18,0.08), rgba(230,126,34,0.04))',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid rgba(243,156,18,0.2)',
    marginBottom: '16px',
    boxSizing: 'border-box',
  },
  roundHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  roundTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#f39c12',
    margin: 0,
    letterSpacing: '0.5px',
  },
  roundStatus: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  statusOpen: {
    background: 'rgba(46,204,113,0.15)',
    color: '#2ecc71',
    border: '1px solid rgba(46,204,113,0.3)',
  },
  statusClosed: {
    background: 'rgba(231,76,60,0.15)',
    color: '#e74c3c',
    border: '1px solid rgba(231,76,60,0.3)',
  },
  statusDrawing: {
    background: 'rgba(241,196,15,0.15)',
    color: '#f1c40f',
    border: '1px solid rgba(241,196,15,0.3)',
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-around',
    gap: '12px',
  },
  statBox: {
    flex: 1,
    textAlign: 'center' as const,
    padding: '12px 8px',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  statValue: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: '11px',
    color: '#999',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginTop: '4px',
  },
  prizePoolValue: {
    color: '#f1c40f',
  },
  entriesValue: {
    color: '#3498db',
  },
  roundId: {
    fontSize: '11px',
    color: '#666',
    textAlign: 'center' as const,
    marginTop: '12px',
    wordBreak: 'break-all' as const,
  },
  refreshButton: {
    width: '100%',
    padding: '10px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    color: '#aaa',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '12px',
    transition: 'all 0.2s',
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
  enterButton: {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #f39c12, #e67e22)',
    color: '#fff',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
    letterSpacing: '1px',
    transition: 'opacity 0.2s',
  },
  enterButtonDisabled: {
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
    background: 'linear-gradient(135deg, #2c1500, #4a2a00)',
    borderRadius: '20px',
    padding: '32px 28px',
    width: '90%',
    maxWidth: '380px',
    textAlign: 'center' as const,
    border: '1px solid rgba(243,156,18,0.2)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  },
  resultEmoji: {
    fontSize: '56px',
    marginBottom: '12px',
  },
  resultTitle: {
    fontSize: '24px',
    fontWeight: '700',
    marginBottom: '8px',
    color: '#f1c40f',
  },
  resultDetail: {
    fontSize: '16px',
    color: '#bbb',
    marginBottom: '6px',
  },
  resultHighlight: {
    fontSize: '28px',
    fontWeight: '800',
    margin: '12px 0',
    color: '#f1c40f',
  },
  closeButton: {
    padding: '12px 40px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #e67e22, #f39c12)',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
};

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
        // Refresh round info
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

  const getStatusStyle = (status: string): React.CSSProperties => {
    switch (status?.toLowerCase()) {
      case 'open':
      case 'accepting':
        return { ...styles.roundStatus, ...styles.statusOpen };
      case 'drawing':
      case 'in_progress':
        return { ...styles.roundStatus, ...styles.statusDrawing };
      case 'closed':
      case 'completed':
        return { ...styles.roundStatus, ...styles.statusClosed };
      default:
        return styles.roundStatus;
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'open':
      case 'accepting':
        return '🟢 Open';
      case 'drawing':
      case 'in_progress':
        return '🟡 Drawing';
      case 'closed':
      case 'completed':
        return '🔴 Closed';
      default:
        return status || 'Unknown';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={onBack}>
          ← Back
        </button>
        <h1 style={styles.title}>🎰 Jackpot</h1>
        <div style={styles.balanceBox}>💰 {balance.toLocaleString()}</div>
      </div>

      {/* Round Status Card */}
      <div style={styles.roundCard}>
        <div style={styles.roundHeader}>
          <h3 style={styles.roundTitle}>📍 Current Round</h3>
          {round && (
            <span style={getStatusStyle(round.status)}>
              {getStatusLabel(round.status)}
            </span>
          )}
        </div>

        {loading && !round && (
          <p style={{ textAlign: 'center', color: '#888', fontSize: '14px' }}>
            Loading round info...
          </p>
        )}

        {fetchError && (
          <p style={{ textAlign: 'center', color: '#e74c3c', fontSize: '14px' }}>
            {fetchError}
          </p>
        )}

        {round && (
          <>
            <div style={styles.statRow}>
              <div style={styles.statBox}>
                <div style={{ ...styles.statValue, ...styles.prizePoolValue }}>
                  {round.prize_pool.toLocaleString()}
                </div>
                <div style={styles.statLabel}>Prize Pool</div>
              </div>
              <div style={styles.statBox}>
                <div style={{ ...styles.statValue, ...styles.entriesValue }}>
                  {round.entry_count}
                </div>
                <div style={styles.statLabel}>Entries</div>
              </div>
            </div>
            <div style={styles.roundId}>
              Round ID: {round.round_id}
            </div>
          </>
        )}

        <button style={styles.refreshButton} onClick={fetchRound} disabled={loading}>
          {loading ? '🔄 Refreshing...' : '🔄 Refresh Status'}
        </button>
      </div>

      {/* Enter Round */}
      <div style={styles.gameArea}>
        <p style={styles.infoText}>
          Buy entries into the current jackpot round. The more you bet, the higher your chance to win the entire prize pool!
        </p>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Entry Amount</label>
          <input
            style={styles.input}
            type="number"
            min={1}
            max={balance}
            value={betAmount}
            onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 0))}
            placeholder="Enter entry amount"
          />
        </div>

        <div style={styles.quickBets}>
          {QUICK_BETS.map((amount) => (
            <button
              key={amount}
              style={{
                ...styles.quickBetBtn,
                ...(betAmount === amount
                  ? { background: 'rgba(243,156,18,0.25)', borderColor: '#f39c12', color: '#f39c12' }
                  : {}),
              }}
              onClick={() => handleQuickBet(amount)}
            >
              {amount}
            </button>
          ))}
        </div>

        <button
          style={{
            ...styles.enterButton,
            ...(enterLoading || betAmount <= 0 || betAmount > balance
              ? styles.enterButtonDisabled
              : {}),
          }}
          onClick={handleEnter}
          disabled={enterLoading || betAmount <= 0 || betAmount > balance}
        >
          {enterLoading ? '⏳ Entering...' : '🎰 Enter Round'}
        </button>
      </div>

      {/* Entry Result Overlay */}
      {entryResult && (
        <div style={styles.resultOverlay} onClick={handleCloseResult}>
          <div style={styles.resultCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.resultEmoji}>
              {entryResult.success ? '🎉' : '❌'}
            </div>
            <div style={styles.resultTitle}>
              {entryResult.success ? 'Entry Confirmed!' : 'Entry Failed'}
            </div>

            {entryResult.success && (
              <>
                <div style={styles.resultHighlight}>
                  🏆 {entryResult.prize_pool.toLocaleString()}
                </div>
                <div style={styles.resultDetail}>
                  Prize Pool: {entryResult.prize_pool.toLocaleString()}
                </div>
                <div style={styles.resultDetail}>
                  Total Entries: {entryResult.entries}
                </div>
                <div style={{ ...styles.resultDetail, color: '#f39c12', marginTop: '8px' }}>
                  Good luck! 🍀
                </div>
              </>
            )}

            {!entryResult.success && (
              <div style={{ ...styles.resultDetail, color: '#e74c3c', marginTop: '8px' }}>
                Could not process entry. The round may be closed or your balance insufficient.
              </div>
            )}

            <button style={styles.closeButton} onClick={handleCloseResult}>
              {entryResult.success ? '🎯 Continue' : 'Try Again'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JackpotGame;
