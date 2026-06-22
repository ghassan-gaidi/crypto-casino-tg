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
    <div className="page">
      <div className="header">
        <button className="btn-back" onClick={onBack}>Back</button>
        <span className="header-title">BALANCE</span>
        <span className="header-balance">
          {balance ? `${Number(balance.evm).toFixed(4)}` : '—'}
        </span>
      </div>

      <div className="divider">WALLETS</div>

      {loading ? (
        <div className="text-center text-dim mt-lg mb-lg">
          ▌ LOADING ▐
        </div>
      ) : balance ? (
        <div className="flex flex-col gap-sm">
          {/* ETH */}
          <div className="term-box">
            <div className="term-box-hd"><span>ETH · BASE</span></div>
            <div className="term-box-bd">
              <div className="flex items-center justify-between">
                <div>
                  <div className="t-label">BALANCE</div>
                </div>
                <div className="stat-val text-yellow">
                  {Number(balance.evm).toFixed(6)}
                </div>
              </div>
            </div>
          </div>

          {/* SOL */}
          <div className="term-box" style={{ opacity: 0.5 }}>
            <div className="term-box-hd"><span>SOL · SOLANA</span></div>
            <div className="term-box-bd">
              <div className="flex items-center justify-between">
                <div>
                  <div className="t-label">BALANCE</div>
                </div>
                <div className="stat-val">
                  {Number(balance.sol).toFixed(6)}
                </div>
              </div>
            </div>
          </div>

          {/* TON */}
          <div className="term-box" style={{ opacity: 0.5 }}>
            <div className="term-box-hd"><span>TON · TELEGRAM</span></div>
            <div className="term-box-bd">
              <div className="flex items-center justify-between">
                <div>
                  <div className="t-label">BALANCE</div>
                </div>
                <div className="stat-val">
                  {Number(balance.ton).toFixed(6)}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-dim mt-lg mb-lg">
          COULD NOT LOAD BALANCE<br/>
          <span className="t-small text-muted">ENSURE TELEGRAM LOGIN</span>
        </div>
      )}

      <div className="divider mt-lg">
        END TRANSMISSION
      </div>
    </div>
  )
}
