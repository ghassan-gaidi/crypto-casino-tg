import { useEffect, useState } from 'react'

interface Referral {
  id: number
  username?: string
  first_name?: string
  reward_earned: number
  created_at: string
}

interface Props {
  onBack: () => void
  userId?: number
  username?: string
}

const BASE = import.meta.env.VITE_API_URL || ''

export default function ReferralsPage({ onBack, userId, username }: Props) {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [count, setCount] = useState(0)
  const [totalEarned, setTotalEarned] = useState(0)
  const [referrer, setReferrer] = useState<{ username?: string; first_name?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    fetch(`${BASE}/api/refs`, { headers: { 'x-user-id': String(userId) } })
      .then(r => r.json())
      .then(d => {
        setReferrals(d.referrals || [])
        setCount(d.count || 0)
        setTotalEarned(d.total_earned || 0)
        setReferrer(d.referrer || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [userId])

  const referralCode = username || (userId ? String(userId) : '')
  const referralLink = referralCode ? `https://t.me/${(window as any).BOT_USERNAME || 'cr00k_bot'}?start=ref_${referralCode}` : ''

  const copyLink = () => {
    if (!referralLink) return
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="page">
      <div className="header">
        <button className="btn btn-ghost" onClick={onBack}>← BACK</button>
        <div className="t-title">REFERRALS</div>
        <div style={{width:60}} />
      </div>

      <div className="divider">YOUR REFERRAL LINK</div>

      <div className="term-box">
        {loading ? (
          <div className="text-center text-dim">LOADING...</div>
        ) : (
          <>
            <div className="t-small text-dim" style={{letterSpacing:1}}>SHARE THIS LINK</div>
            <div className="input" style={{marginTop:8,fontSize:10,wordBreak:'break-all',cursor:'pointer'}} onClick={copyLink}>
              {referralLink || 'Not available'}
            </div>
            <button className="btn btn-primary mt-sm" style={{width:'100%'}} onClick={copyLink}>
              {copied ? '✓ COPIED' : '◇ COPY LINK'}
            </button>

            <div className="stat-row mt-md">
              <div className="stat-item">
                <div className="stat-value">{count}</div>
                <div className="stat-label">REFERRALS</div>
              </div>
              <div className="stat-item">
                <div className="stat-value" style={{color:'var(--green)'}}>{totalEarned.toFixed(6)}</div>
                <div className="stat-label">EARNED (ETH)</div>
              </div>
            </div>

            {referrer && (
              <div style={{marginTop:12,borderTop:'1px solid var(--border)',paddingTop:12}}>
                <div className="t-small text-dim" style={{letterSpacing:1}}>REFERRED BY</div>
                <div style={{marginTop:4,color:'var(--white)',fontSize:13}}>
                  {referrer.username ? `@${referrer.username}` : referrer.first_name || 'Unknown'}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {referrals.length > 0 && (
        <>
          <div className="divider">YOUR REFERRALS</div>
          <div className="term-box" style={{padding:0,overflow:'hidden'}}>
            {referrals.map(r => (
              <div key={r.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 12px',borderBottom:'1px solid var(--border)',fontSize:12}}>
                <div style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>
                  {r.username ? `@${r.username}` : r.first_name || `User #${r.id}`}
                </div>
                <div style={{color:'var(--green)',fontWeight:600,fontVariantNumeric:'tabular-nums',marginLeft:12}}>
                  +{r.reward_earned.toFixed(6)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="term-box mt-md">
        <div className="t-small text-dim" style={{letterSpacing:1}}>HOW IT WORKS</div>
        <div className="text-muted mt-sm" style={{fontSize:11,lineHeight:1.5}}>
          Share your link with friends. When they play and the house wins, you earn 20% of the house edge as referral rewards — paid instantly to your balance.
        </div>
      </div>

      <div className="text-center text-muted mt-lg" style={{fontSize:9,letterSpacing:3}}>
        ─── END REFERRALS ───
      </div>
    </div>
  )
}
