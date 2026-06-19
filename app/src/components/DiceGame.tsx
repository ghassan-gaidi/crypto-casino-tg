import { useState } from 'react'

interface Props {
  onBack: () => void
  userId?: number
}

export default function DiceGame({ onBack }: Props) {
  const [betAmount, setBetAmount] = useState('0.01')
  const [direction, setDirection] = useState<'under' | 'over'>('under')
  const [target, setTarget] = useState(50)
  const [result, setResult] = useState<{
    roll: number
    playerWon: boolean
    payout: number
    payoutMultiplier: number
    resultHash: string
    nonce: number
    clientSeed: string
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const quickBets = ['0.001', '0.01', '0.1', '1.0']

  const placeBet = async () => {
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch(`/api/dice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(betAmount),
          direction,
          target,
          initData: window.Telegram?.WebApp?.initDataUnsafe,
        }),
      })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      console.error('Bet failed', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      {/* Back */}
      <button onClick={onBack} style={{
        background: 'none', border: 'none', color: '#888', cursor: 'pointer',
        fontSize: 14, padding: '8px 0', display: 'block',
      }}>
        ← Back
      </button>

      <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '8px 0 24px' }}>
        🎲 Dice
      </h2>

      {/* Quick bet amounts */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {quickBets.map(amt => (
          <button
            key={amt}
            onClick={() => setBetAmount(amt)}
            style={{
              padding: '6px 14px',
              background: betAmount === amt ? '#1a3a5c' : '#111',
              border: `1px solid ${betAmount === amt ? '#2a6a9c' : '#1a1a2e'}`,
              borderRadius: 8,
              color: betAmount === amt ? '#6af' : '#888',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            {amt}
          </button>
        ))}
      </div>

      {/* Bet input */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13, color: '#888', display: 'block', marginBottom: 4 }}>
          Bet Amount
        </label>
        <input
          type="number"
          step="0.001"
          value={betAmount}
          onChange={e => setBetAmount(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            background: '#111',
            border: '1px solid #1a1a2e',
            borderRadius: 8,
            color: '#fff',
            fontSize: 16,
          }}
        />
      </div>

      {/* Direction toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setDirection('under')}
          style={{
            flex: 1, padding: 12,
            background: direction === 'under' ? '#1a3a2e' : '#111',
            border: `1px solid ${direction === 'under' ? '#2a6a4c' : '#1a1a2e'}`,
            borderRadius: 8,
            color: direction === 'under' ? '#4caf50' : '#888',
            cursor: 'pointer', fontSize: 15, fontWeight: 600,
          }}
        >
          UNDER
        </button>
        <button
          onClick={() => setDirection('over')}
          style={{
            flex: 1, padding: 12,
            background: direction === 'over' ? '#3a1a1e' : '#111',
            border: `1px solid ${direction === 'over' ? '#9c2a2a' : '#1a1a2e'}`,
            borderRadius: 8,
            color: direction === 'over' ? '#f44336' : '#888',
            cursor: 'pointer', fontSize: 15, fontWeight: 600,
          }}
        >
          OVER
        </button>
      </div>

      {/* Target slider */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 13, color: '#888', display: 'block' }}>
          Target: <strong style={{ color: '#fff' }}>{target}</strong>
        </label>
        <input
          type="range"
          min={1}
          max={99}
          value={target}
          onChange={e => setTarget(parseInt(e.target.value))}
          style={{ width: '100%', marginTop: 8 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#555' }}>
          <span>1</span>
          <span>99</span>
        </div>
      </div>

      {/* Payout info */}
      <div style={{
        padding: 12,
        background: '#111',
        borderRadius: 8,
        marginBottom: 16,
        border: '1px solid #1a1a2e',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
          <span style={{ color: '#888' }}>Win chance</span>
          <span style={{ color: '#fff' }}>{direction === 'under' ? target : 100 - target}%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginTop: 4 }}>
          <span style={{ color: '#888' }}>Payout</span>
          <span style={{ color: '#4caf50' }}>
            {(99 / (direction === 'under' ? target : 100 - target) * 0.98).toFixed(2)}x
          </span>
        </div>
      </div>

      {/* Place bet */}
      <button
        onClick={placeBet}
        disabled={loading}
        style={{
          width: '100%',
          padding: 16,
          background: loading ? '#333' : '#1a5c3a',
          border: 'none',
          borderRadius: 12,
          color: '#fff',
          fontSize: 18,
          fontWeight: 700,
          cursor: loading ? 'default' : 'pointer',
        }}
      >
        {loading ? 'Rolling...' : '🎲 Roll Dice'}
      </button>

      {/* Result */}
      {result && (
        <div style={{
          marginTop: 24,
          padding: 20,
          background: result.playerWon ? '#0a2a1a' : '#2a0a0a',
          borderRadius: 12,
          border: `1px solid ${result.playerWon ? '#1a4a2a' : '#4a1a1a'}`,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>
            {result.playerWon ? '🎉' : '😔'}
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, color: result.playerWon ? '#4caf50' : '#f44336' }}>
            {result.roll.toFixed(2)}
          </div>
          <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
            {result.playerWon
              ? `You won ${result.payout.toFixed(4)} (${result.payoutMultiplier.toFixed(2)}x)`
              : `You lost ${betAmount}`}
          </div>
        </div>
      )}
    </div>
  )
}
