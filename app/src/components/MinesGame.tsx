import React, { useState, useCallback } from 'react';

interface MinesGameProps {
  onBack: () => void;
  userId?: number;
}

interface MinesResult {
  safe: boolean;
  payout: number;
  multiplier: number;
  minePositions: number[];
  numMines: number;
  revealCount: number;
  resultHash: string;
  nonce: number;
  clientSeed: string;
}

interface TileState {
  index: number;
  revealed: boolean;
  isMine: boolean;
}

const INITIAL_BALANCE = 10000;
const QUICK_BETS = [100, 250, 500, 1000, 2500];
const GRID_SIZE = 25; // 5x5

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a1628, #111d3a, #0f0c29)',
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
    marginBottom: '16px',
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
    background: 'linear-gradient(90deg, #00b894, #00cec9)',
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
  controls: {
    width: '100%',
    maxWidth: '460px',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid rgba(255,255,255,0.08)',
    marginBottom: '16px',
    boxSizing: 'border-box',
  },
  inputGroup: {
    marginBottom: '14px',
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
    marginBottom: '14px',
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
  minesRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center' as const,
    marginBottom: '14px',
  },
  minesInput: {
    flex: 1,
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(0,0,0,0.35)',
    color: '#fff',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  minesRangeValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#00b894',
    minWidth: '36px',
    textAlign: 'center' as const,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '8px',
    width: '100%',
    maxWidth: '400px',
    margin: '0 auto',
  },
  tile: {
    aspectRatio: '1',
    borderRadius: '12px',
    border: '2px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontWeight: '700',
    minHeight: '60px',
  },
  tileHidden: {
    background: 'linear-gradient(135deg, rgba(0,184,148,0.15), rgba(0,206,201,0.08))',
    border: '2px solid rgba(0,184,148,0.25)',
  },
  tileGem: {
    background: 'linear-gradient(135deg, #00b894, #00cec9)',
    border: '2px solid rgba(0,206,201,0.6)',
    color: '#fff',
    boxShadow: '0 0 20px rgba(0,184,148,0.3)',
  },
  tileMine: {
    background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
    border: '2px solid rgba(231,76,60,0.6)',
    color: '#fff',
    boxShadow: '0 0 20px rgba(231,76,60,0.3)',
  },
  tileDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  infoText: {
    fontSize: '13px',
    color: '#888',
    textAlign: 'center' as const,
    marginBottom: '14px',
    lineHeight: '1.4',
  },
  gridContainer: {
    width: '100%',
    maxWidth: '460px',
    padding: '0 8px',
    boxSizing: 'border-box',
  },
  actionRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
    width: '100%',
    maxWidth: '460px',
  },
  playButton: {
    flex: 1,
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #00b894, #00cec9)',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    letterSpacing: '1px',
    transition: 'opacity 0.2s',
  },
  cashoutButton: {
    flex: 1,
    padding: '14px',
    borderRadius: '12px',
    border: '1px solid rgba(0,184,148,0.4)',
    background: 'rgba(0,184,148,0.1)',
    color: '#00b894',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
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
    fontSize: '32px',
    fontWeight: '800',
    margin: '12px 0',
    color: '#f1c40f',
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
  },
  hashRow: {
    fontSize: '11px',
    color: '#666',
    wordBreak: 'break-all' as const,
    marginTop: '10px',
    lineHeight: '1.5',
  },
};

const MinesGame: React.FC<MinesGameProps> = ({ onBack, userId }) => {
  const [betAmount, setBetAmount] = useState<number>(500);
  const [numMines, setNumMines] = useState<number>(3);
  const [loading, setLoading] = useState<boolean>(false);
  const [gameActive, setGameActive] = useState<boolean>(false);
  const [tiles, setTiles] = useState<TileState[]>([]);
  const [result, setResult] = useState<MinesResult | null>(null);
  const [balance, setBalance] = useState<number>(INITIAL_BALANCE);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);

  const initTiles = useCallback(() => {
    return Array.from({ length: GRID_SIZE }, (_, i) => ({
      index: i,
      revealed: false,
      isMine: false,
    }));
  }, []);

  const handleQuickBet = useCallback((amount: number) => {
    setBetAmount(amount);
  }, []);

  const startGame = useCallback(async () => {
    if (loading || betAmount <= 0 || betAmount > balance) return;

    setLoading(true);
    setResult(null);
    setCurrentMultiplier(1.0);

    try {
      const initData = (window as any).Telegram?.WebApp?.initDataUnsafe || {};
      const res = await fetch('/api/mines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: betAmount,
          numMines,
          action: 'start',
          initData,
          userId,
        }),
      });
      const data: MinesResult = await res.json();
      setResult(data);
      setTiles(initTiles());

      if (!data.safe) {
        const newTiles = initTiles();
        data.minePositions.forEach((pos) => {
          newTiles[pos].isMine = true;
        });
        data.minePositions.slice(0, 1).forEach((pos) => {
          newTiles[pos].revealed = true;
        });
        setTiles(newTiles);
        setGameActive(false);
        setBalance((prev) => prev - betAmount);
        setCurrentMultiplier(0);
      } else {
        const newTiles = initTiles();
        newTiles[0].revealed = true;
        newTiles[0].isMine = false;
        setTiles(newTiles);
        setGameActive(true);
        setBalance((prev) => prev - betAmount);
        setCurrentMultiplier(data.multiplier);
      }

      setResult({
        ...data,
        safe: data.safe,
        payout: data.payout,
        multiplier: data.multiplier,
        minePositions: data.minePositions,
        numMines: data.numMines,
        revealCount: data.revealCount,
        resultHash: data.resultHash,
        nonce: data.nonce,
        clientSeed: data.clientSeed,
      });
    } catch (err) {
      console.error('Mines API error:', err);
    } finally {
      setLoading(false);
    }
  }, [betAmount, numMines, loading, balance, userId, initTiles]);

  const revealTile = useCallback(
    async (index: number) => {
      if (loading || !gameActive || tiles[index].revealed) return;

      setLoading(true);
      try {
        const initData = (window as any).Telegram?.WebApp?.initDataUnsafe || {};
        const res = await fetch('/api/mines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: betAmount,
            numMines,
            action: 'reveal',
            tileIndex: index,
            initData,
            userId,
          }),
        });
        const data: MinesResult = await res.json();
        setResult(data);

        if (data.safe) {
          const newTiles = [...tiles];
          newTiles[index].revealed = true;
          newTiles[index].isMine = false;
          setTiles(newTiles);
          setCurrentMultiplier(data.multiplier);
          setBalance((prev) => prev + data.payout);
        } else {
          const newTiles = [...tiles];
          data.minePositions.forEach((pos) => {
            newTiles[pos].isMine = true;
            newTiles[pos].revealed = true;
          });
          setTiles(newTiles);
          setGameActive(false);
          setCurrentMultiplier(0);
        }
      } catch (err) {
        console.error('Mines reveal error:', err);
      } finally {
        setLoading(false);
      }
    },
    [loading, gameActive, tiles, betAmount, numMines, userId]
  );

  const autoCashout = useCallback(async () => {
    if (loading || !gameActive) return;

    setLoading(true);
    try {
      const initData = (window as any).Telegram?.WebApp?.initDataUnsafe || {};
      const revealedSoFar = tiles.filter((t) => t.revealed && !t.isMine).length;
      const res = await fetch('/api/mines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: betAmount,
          numMines,
          action: 'cashout',
          revealedSoFar,
          initData,
          userId,
        }),
      });
      const data: MinesResult = await res.json();
      setResult(data);
      setGameActive(false);

      if (data.safe) {
        setBalance((prev) => prev + data.payout);
        setCurrentMultiplier(data.multiplier);
      }

      const newTiles = [...tiles];
      data.minePositions.forEach((pos) => {
        newTiles[pos].isMine = true;
        newTiles[pos].revealed = true;
      });
      setTiles(newTiles);
    } catch (err) {
      console.error('Mines cashout error:', err);
    } finally {
      setLoading(false);
    }
  }, [loading, gameActive, tiles, betAmount, numMines, userId]);

  const handleCloseResult = useCallback(() => {
    setResult(null);
    setGameActive(false);
    setTiles(initTiles());
  }, [initTiles]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={onBack}>
          ← Back
        </button>
        <h1 style={styles.title}>⛏️ Mines</h1>
        <div style={styles.balanceBox}>💰 {balance.toLocaleString()}</div>
      </div>

      <div style={styles.controls}>
        <p style={styles.infoText}>
          Pick tiles to reveal gems. Hit a mine and you lose. Choose how many mines are hidden and try your luck!
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
                  ? { background: 'rgba(0,184,148,0.25)', borderColor: '#00b894', color: '#00b894' }
                  : {}),
              }}
              onClick={() => handleQuickBet(amount)}
            >
              {amount}
            </button>
          ))}
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Number of Mines (1-24)</label>
          <div style={styles.minesRow}>
            <input
              style={styles.minesInput}
              type="range"
              min={1}
              max={24}
              value={numMines}
              onChange={(e) => setNumMines(parseInt(e.target.value))}
            />
            <span style={styles.minesRangeValue}>{numMines}</span>
          </div>
        </div>
      </div>

      <div style={styles.gridContainer}>
        <div style={styles.grid}>
          {tiles.length > 0 &&
            tiles.map((tile) => {
              let tileStyle: React.CSSProperties = { ...styles.tile, ...styles.tileHidden };
              let content = '💎';

              if (tile.revealed) {
                if (tile.isMine) {
                  tileStyle = { ...styles.tile, ...styles.tileMine };
                  content = '💣';
                } else {
                  tileStyle = { ...styles.tile, ...styles.tileGem };
                  content = '💎';
                }
              }

              return (
                <button
                  key={tile.index}
                  style={{
                    ...tileStyle,
                    ...(loading || !gameActive ? styles.tileDisabled : {}),
                  }}
                  onClick={() => revealTile(tile.index)}
                  disabled={loading || !gameActive || tile.revealed}
                >
                  {tile.revealed ? content : ''}
                </button>
              );
            })}
          {tiles.length === 0 &&
            Array.from({ length: GRID_SIZE }).map((_, i) => (
              <div
                key={i}
                style={{ ...styles.tile, ...styles.tileHidden, cursor: 'default' }}
              >
                💎
              </div>
            ))}
        </div>
      </div>

      <div style={styles.actionRow}>
        <button
          style={{
            ...styles.playButton,
            ...(loading || betAmount <= 0 || betAmount > balance || gameActive
              ? styles.buttonDisabled
              : {}),
          }}
          onClick={startGame}
          disabled={loading || betAmount <= 0 || betAmount > balance || gameActive}
        >
          {loading ? '⏳ Playing...' : gameActive ? '🎮 In Game' : '⛏️ Start Game'}
        </button>
        {gameActive && (
          <button
            style={{
              ...styles.cashoutButton,
              ...(loading ? styles.buttonDisabled : {}),
            }}
            onClick={autoCashout}
            disabled={loading}
          >
            💰 Cash Out (×{currentMultiplier.toFixed(2)})
          </button>
        )}
      </div>

      {result && !gameActive && (
        <div style={styles.resultOverlay} onClick={handleCloseResult}>
          <div style={styles.resultCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.resultEmoji}>{result.safe ? '💰' : '💥'}</div>
            <div
              style={{
                ...styles.resultTitle,
                ...(result.safe ? styles.resultWin : styles.resultLose),
              }}
            >
              {result.safe ? '🎉 YOU WON!' : '💣 HIT A MINE!'}
            </div>

            {result.safe && (
              <>
                <div style={styles.resultMultiplier}>
                  ×{result.multiplier.toFixed(2)}
                </div>
                <div style={styles.resultPayout}>
                  +{result.payout.toLocaleString()}
                </div>
              </>
            )}

            <div style={styles.resultDetail}>
              Mines: {result.numMines} | Revealed: {result.revealCount}
            </div>

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

export default MinesGame;
