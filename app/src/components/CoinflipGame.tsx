import { useState } from 'react'

interface Props {
  onBack: () => void
  userId?: number
}

export default function CoinflipGame({ onBack }: Props) {
  const [betAmount, setBetAmount] = useState('0.01')
  const [pick, setPick] = useState<'heads' | 'tails' | null>(null)
  const [result, setResult] = useState<{
    result: 'heads' | 'tails'
    playerWon: boolean
    payout: number
    payoutMultiplier: number
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [flipping, setFlipping] = useState(false)

  const quickBets = ['0.001', '0.01', '0.1', '1.0']

  const placeBet = async () => {
    if (!pick) return
    setLoading(true)
    setFlipping(true)
    setResult(null)

    try {
      const res = await fetch(`/api/coinflip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(betAmount),
          pick,
          initData: window.Telegram?.WebApp?.initDataUnsafe,
        }),
      })
      const data = await res.json()
      // Simulate flip animation
      setTimeout(() => {
        setResult(data)
        setFlipping(false)
        setLoading(false)
      }, 800)
    } catch (err) {
      setFlipping(false)
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <button onClick={onBack} style={{
        background: 'none', border: 'none', color: '#888', cursor: 'pointer',
        fontSize: 14, padding: '8px 0', display: 'block',
      }}>
        ← Back
      </button>

      <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '8px 0 24px' }}>
        🪙 Coinflip
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

      {/* Pick */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setPick('heads')}
          style={{
            flex: 1, padding: 20,
            background: pick === 'heads' ? '#1a3a5c' : '#111',
            border: `1px solid ${pick === 'heads' ? '#2a6a9c' : '#1a1a2e'}`,
            borderRadius: 12,
            color: pick === 'heads' ? '#fff' : '#888',
            cursor: 'pointer', fontSize: 18, fontWeight: 600,
          }}
        >
          👑 Heads
        </button>
        <button
          onClick={() => setPick('tails')}
          style={{
            flex: 1, padding: 20,
            background: pick === 'tails' ? '#3a1a1e' : '#111',
            border: `1px solid ${pick === 'tails' ? '#9c2a2a' : '#1a1a2e'}`,
            borderRadius: 12,
            color: pick === 'tails' ? '#fff' : '#888',
            cursor: 'pointer', fontSize: 18, fontWeight: 600,
          }}
        >
          🪙 Tails
        </button>
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
          <span style={{ color: '#fff' }}>50%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginTop: 4 }}>
          <span style={{ color: '#888' }}>Payout</span>
          <span style={{ color: '#4caf50' }}>1.96x</span>
        </div>
      </div>

      {/* Place bet */}
      <button
        onClick={placeBet}
        disabled={loading || !pick}
        style={{
          width: '100%',
          padding: 16,
          background: loading ? '#333' : '#1a5c3a',
          border: 'none',
          borderRadius: 12,
          color: '#fff',
          fontSize: 18,
          fontWeight: 700,
          cursor: loading || !pick ? 'default' : 'pointer',
          opacity: !pick ? 0.5 : 1,
        }}
      >
        {loading ? 'Flipping...' : '🪙 Flip Coin'}
      </button>

      {/* Result */}
      {result && !flipping && (
        <div style={{
          marginTop: 24,
          padding: 20,
          background: result.playerWon ? '#0a2a1a' : '#2a0a0a',
          borderRadius: 12,
          border: `1px solid ${result.playerWon ? '#1a4a2a' : '#4a1a1a'}`,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>
            {result.result === 'heads' ? '👑' : '🪙'}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: result.playerWon ? '#4caf50' : '#f44336' }}>
            {result.result.toUpperCase()}
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
