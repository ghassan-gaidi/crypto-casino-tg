import React, { useState, useCallback, useEffect } from 'react';
import { useGameFeedback } from '../hooks';
import { useGameKeyboard } from '../hooks/keyboard';
import ShareWin from './ShareWin';
import HotCold from './HotCold';
import { showWinToast } from './WinToast';
import { isRateLimited, RateLimitBanner } from '../rate-limit-ui';

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

const QUICK_BETS = [100, 250, 500, 1000, 2500];
const GRID_SIZE = 25; // 5x5

const MinesGame: React.FC<MinesGameProps> = ({ onBack, userId }) => {
  const [betAmount, setBetAmount] = useState<number>(500);
  const [numMines, setNumMines] = useState<number>(3);
  const [loading, setLoading] = useState<boolean>(false);
  const [gameActive, setGameActive] = useState<boolean>(false);
  const [tiles, setTiles] = useState<TileState[]>([]);
  const [result, setResult] = useState<MinesResult | null>(null);

  useGameFeedback(result);
  const [gameHistory, setGameHistory] = useState<boolean[]>([]);
  const [balance, setBalance] = useState<number>(0);

  // Fetch real balance
  useEffect(() => {
    if (!userId) return;
    fetch(`/api/balance?userId=${userId}`)
      .then(r => r.json())
      .then(data => {
        if (data.evm !== undefined) setBalance(Number(data.evm));
      })
      .catch(() => {});
  }, [userId]);
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
      const initData = (window as any).Telegram?.WebApp?.initData || '';
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
      setGameHistory(prev => [...prev.slice(-9), data.safe ?? false]);
      if (data.safe) showWinToast('mines', betAmount, data.multiplier ?? 1, '⛏')
      setTiles(initTiles());

      if (!data.safe) {
        const newTiles = initTiles();
        data.minePositions.forEach((pos) => {
          if (newTiles[pos]) newTiles[pos]!.isMine = true;
        });
        data.minePositions.slice(0, 1).forEach((pos) => {
          if (newTiles[pos]) newTiles[pos]!.revealed = true;
        });
        setTiles(newTiles);
        setGameActive(false);
        setBalance((prev) => prev - betAmount);
        setCurrentMultiplier(0);
      } else {
        const newTiles = initTiles();
        if (newTiles[0]) {
          newTiles[0]!.revealed = true;
          newTiles[0]!.isMine = false;
        }
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
      if (loading || !gameActive || !tiles[index] || tiles[index]!.revealed) return;

      setLoading(true);
      try {
        const initData = (window as any).Telegram?.WebApp?.initData || '';
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
        setGameHistory(prev => [...prev.slice(-9), data.safe ?? false]);

        if (data.safe) {
          const newTiles = [...tiles];
          if (newTiles[index]) {
            newTiles[index]!.revealed = true;
            newTiles[index]!.isMine = false;
          }
          setTiles(newTiles);
          setCurrentMultiplier(data.multiplier);
          setBalance((prev) => prev + data.payout);
        } else {
          const newTiles = [...tiles];
          data.minePositions.forEach((pos) => {
            if (newTiles[pos]) {
              newTiles[pos]!.isMine = true;
              newTiles[pos]!.revealed = true;
            }
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
      const initData = (window as any).Telegram?.WebApp?.initData || '';
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
      setGameHistory(prev => [...prev.slice(-9), data.safe ?? false]);
      setGameActive(false);

      if (data.safe) {
        setBalance((prev) => prev + data.payout);
        setCurrentMultiplier(data.multiplier);
      }

      const newTiles = [...tiles];
      data.minePositions.forEach((pos) => {
        if (newTiles[pos]) {
          newTiles[pos]!.isMine = true;
          newTiles[pos]!.revealed = true;
        }
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

  const revealedCount = tiles.filter((t) => t.revealed && !t.isMine).length;
  const maxReveals = GRID_SIZE - numMines;
  const multPercent = maxReveals > 0 ? (revealedCount / maxReveals) * 100 : 0;
  useGameKeyboard({ onBet: startGame, onQuickBet: (v) => setBetAmount(parseFloat(v)), disabled: loading });

  return (
    <div className="page">
      <div className="header">
        <button className="btn-back" onClick={onBack}>
          Back
        </button>
        <span className="header-title">MINES</span>
        <span className="header-balance">{balance.toLocaleString()}</span>
      </div>

      <div className="s-title">BET AMOUNT</div>
      <div className="term-box mb-md">
        <div className="term-box-bd">
          <input
            className="input"
            type="number"
            min={1}
            max={balance}
            value={betAmount}
            onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 0))}
            placeholder="Bet amount"
          />
        </div>
      </div>

      <div className="chips">
        {QUICK_BETS.map((amt) => (
          <button
            key={amt}
            className={"chip" + (betAmount === amt ? " active" : "")}
            onClick={() => handleQuickBet(amt)}
          >
            {amt}
          </button>
        ))}
      </div>

      <div className="s-title">MINES: {numMines}</div>
      <div className="term-box mb-md">
        <div className="term-box-bd">
          <input
            type="range"
            min={1}
            max={24}
            value={numMines}
            onChange={(e) => setNumMines(parseInt(e.target.value))}
            className="input"
          />
        </div>
      </div>

      <div className="stats mb-md">
        <div className="stat-row">
          <span className="stat-label">MINES</span>
          <span className="stat-val">{numMines}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">SAFE TILES</span>
          <span className="stat-val">{GRID_SIZE - numMines}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">REVEALED</span>
          <span className="stat-val green">{revealedCount}</span>
        </div>
        {currentMultiplier > 1 && (
          <div className="stat-row">
            <span className="stat-label">MULTIPLIER</span>
            <span className="stat-val green">×{currentMultiplier.toFixed(2)}</span>
          </div>
        )}
      </div>

      {gameActive && (
        <div className="mult-bar mb-md">
          <div className="mult-fill" style={{ width: `${Math.min(multPercent, 100)}%` }} />
        </div>
      )}

      <div className="grid-5 mb-md">
        {tiles.length > 0
          ? tiles.map((tile) => {
              let tileClass = "tile";
              let content = '';

              if (tile.revealed) {
                if (tile.isMine) {
                  tileClass += " revealed-mine";
                  content = '💣';
                } else {
                  tileClass += " revealed-safe";
                  content = '💎';
                }
              } else if (loading || !gameActive) {
                tileClass += " disabled";
              }

              return (
                <button
                  key={tile.index}
                  className={tileClass}
                  onClick={() => revealTile(tile.index)}
                  disabled={loading || !gameActive || tile.revealed}
                >
                  {content}
                </button>
              );
            })
          : Array.from({ length: GRID_SIZE }).map((_, i) => (
              <div key={i} className="tile disabled">
                ·
              </div>
            ))}
      </div>

      <button
        className="btn btn-green"
        onClick={startGame}
        disabled={loading || betAmount <= 0 || betAmount > balance || gameActive}
      >
        {loading ? '⏳ PROCESSING...' : gameActive ? 'IN GAME' : '▶ START'}
      </button>

      {gameActive && (
        <button
          className={"btn btn-ghost active mt-md"}
          onClick={autoCashout}
          disabled={loading}
        >
          CASH OUT ×{currentMultiplier.toFixed(2)}
        </button>
      )}

      {isRateLimited(result) && <RateLimitBanner data={result} />}
      {result && !gameActive && (
        <>
          <div className="divider">RESULT</div>
          <div className={"result " + (result.safe ? 'result-win' : 'result-lose')}>
            <div className={"result-label " + (result.safe ? 'win' : 'lose')}>
              {result.safe ? 'WIN' : 'LOSE'}
            </div>
            <div className="result-number">
              {result.safe ? `+${result.payout.toLocaleString()}` : `-${betAmount.toLocaleString()}`}
            </div>
            <div className="result-detail">
              Mines: {result.numMines} · Revealed: {result.revealCount} · Multiplier: ×{result.multiplier.toFixed(2)}
            </div>
            <div className="result-hash">
              Hash: {result.resultHash.slice(0, 20)}...<br />
              Nonce: {result.nonce} · Seed: {result.clientSeed.slice(0, 12)}...
            {result.safe && result.multiplier >= 2 && (
              <ShareWin game="mines" payout={result.payout} multiplier={result.multiplier} betAmount={betAmount} />
            )}
            </div>
          </div>

          <button className="btn btn-ghost mt-md" onClick={handleCloseResult}>
            NEW GAME
          </button>
          <HotCold history={gameHistory} />
        </>
      )}
    </div>
  );
};

export default MinesGame;
