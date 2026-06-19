import { useState, useEffect } from 'react'

interface Props {
  onBack: () => void
  userId?: number
  username?: string
}

export default function BalancePage({ onBack, userId, username }: Props) {
  const [balance, setBalance] = useState<{ evm: string; sol: string; ton: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    fetch(`/api/balance?userId=${userId}&username=${username || ''}`)
      .then(r => r.json())
      .then(data => {
        if (data.evm !== undefined) setBalance(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [userId, username])

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <button onClick={onBack} style={{
        background: 'none', border: 'none', color: '#888', cursor: 'pointer',
        fontSize: 14, padding: '8px 0', display: 'block',
      }}>
        ← Back
      </button>

      <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '8px 0 24px' }}>
        💰 Balance
      </h2>

      {loading ? (
        <div style={{ color: '#888', textAlign: 'center', padding: 40 }}>
          Loading...
        </div>
      ) : balance ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            padding: 16, background: '#111', borderRadius: 12,
            border: '1px solid #1a1a2e',
          }}>
            <div style={{ fontSize: 13, color: '#888' }}>ETH (Base)</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginTop: 4 }}>
              {Number(balance.evm).toFixed(6)}
            </div>
          </div>
          <div style={{
            padding: 16, background: '#111', borderRadius: 12,
            border: '1px solid #1a1a2e', opacity: 0.5,
          }}>
            <div style={{ fontSize: 13, color: '#888' }}>SOL (Solana)</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginTop: 4 }}>
              {Number(balance.sol).toFixed(6)}
            </div>
          </div>
          <div style={{
            padding: 16, background: '#111', borderRadius: 12,
            border: '1px solid #1a1a2e', opacity: 0.5,
          }}>
            <div style={{ fontSize: 13, color: '#888' }}>TON (Telegram)</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginTop: 4 }}>
              {Number(balance.ton).toFixed(6)}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ color: '#888', textAlign: 'center', padding: 40 }}>
          Could not load balance. Make sure you're logged in via Telegram.
        </div>
      )}
    </div>
  )
}
