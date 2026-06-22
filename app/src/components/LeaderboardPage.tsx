import { useEffect, useState } from 'react'

interface LeaderboardEntry {
  rank: number
  user_id: number
  username?: string
  first_name?: string
  profit: number
}

interface Props {
  onBack: () => void
  userId?: number
}

const BASE = import.meta.env.VITE_API_URL || ''

export default function LeaderboardPage({ onBack }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${BASE}/api/leaderboard`)
      .then(r => r.json())
      .then(d => { setEntries(d.leaderboard || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="page">
      <div className="header">
        <button className="btn btn-ghost" onClick={onBack}>← BACK</button>
        <div className="t-title">LEADERBOARD</div>
        <div style={{width:60}} />
      </div>

      <div className="divider">TOP PLAYERS</div>

      {loading ? (
        <div className="text-center text-dim" style={{padding:40}}>LOADING...</div>
      ) : entries.length === 0 ? (
        <div className="term-box text-center" style={{padding:24}}>
          <div className="t-sub">NO DATA YET</div>
          <div className="text-muted mt-sm" style={{fontSize:11}}>Play games to climb the leaderboard</div>
        </div>
      ) : (
        <div className="term-box" style={{padding:0,overflow:'hidden'}}>
          <div className="lb-header" style={{display:'grid',gridTemplateColumns:'40px 1fr 100px',padding:'10px 12px',borderBottom:'1px solid var(--border)',fontSize:10,letterSpacing:2,color:'var(--text)'}}>
            <div>#</div>
            <div>PLAYER</div>
            <div style={{textAlign:'right'}}>PROFIT</div>
          </div>
          {entries.map(e => (
            <div key={e.user_id} className="lb-row" style={{display:'grid',gridTemplateColumns:'40px 1fr 100px',padding:'10px 12px',borderBottom:'1px solid var(--border)',fontSize:12}}>
              <div style={{color: e.rank <= 3 ? 'var(--yellow)' : 'var(--text)',fontWeight:e.rank<=3?700:400}}>
                {e.rank <= 3 ? ['1ST','2ND','3RD'][e.rank-1] : e.rank}
              </div>
              <div style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {e.username ? `@${e.username}` : e.first_name || `#${e.user_id}`}
              </div>
              <div style={{textAlign:'right',color: e.profit >= 0 ? 'var(--green)' : 'var(--red)',fontWeight:600,fontVariantNumeric:'tabular-nums'}}>
                {e.profit >= 0 ? '+' : ''}{e.profit.toFixed(6)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-center text-muted mt-lg" style={{fontSize:9,letterSpacing:3}}>
        ─── END LEADERBOARD ───
      </div>
    </div>
  )
}
