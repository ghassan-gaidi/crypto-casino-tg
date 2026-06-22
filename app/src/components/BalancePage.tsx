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
      <button className="btn-back" onClick={onBack}>Back</button>
      <div className="s-title" style={{marginTop:12}}>BALANCE</div>

      <div className="divider">WALLETS</div>

      {loading ? (
        <div className="text-center text-dim" style={{padding:'40px 0'}}>
          ▌ LOADING ▐
        </div>
      ) : balance ? (
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          {/* ETH */}
          <div className="term-box">
            <div className="term-box-hd"><span>ETH · BASE</span></div>
            <div className="term-box-bd">
              <div className="flex items-center justify-between">
                <div>
                  <div className="t-label">BALANCE</div>
                </div>
                <div style={{fontSize:20,fontWeight:700,color:'var(--yellow)',fontVariantNumeric:'tabular-nums'}}>
                  {Number(balance.evm).toFixed(6)}
                </div>
              </div>
            </div>
          </div>

          {/* SOL */}
          <div className="term-box" style={{opacity:.5}}>
            <div className="term-box-hd"><span>SOL · SOLANA</span></div>
            <div className="term-box-bd">
              <div className="flex items-center justify-between">
                <div>
                  <div className="t-label">BALANCE</div>
                </div>
                <div style={{fontSize:20,fontWeight:700,color:'var(--white)',fontVariantNumeric:'tabular-nums'}}>
                  {Number(balance.sol).toFixed(6)}
                </div>
              </div>
            </div>
          </div>

          {/* TON */}
          <div className="term-box" style={{opacity:.5}}>
            <div className="term-box-hd"><span>TON · TELEGRAM</span></div>
            <div className="term-box-bd">
              <div className="flex items-center justify-between">
                <div>
                  <div className="t-label">BALANCE</div>
                </div>
                <div style={{fontSize:20,fontWeight:700,color:'var(--white)',fontVariantNumeric:'tabular-nums'}}>
                  {Number(balance.ton).toFixed(6)}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-dim" style={{padding:'40px 0'}}>
          COULD NOT LOAD BALANCE<br/>
          <span className="t-small text-muted">ENSURE TELEGRAM LOGIN</span>
        </div>
      )}

      <div className="text-center text-muted mt-lg" style={{fontSize:9,letterSpacing:3}}>
        ─── END TRANSMISSION ───
      </div>
    </div>
  )
}
