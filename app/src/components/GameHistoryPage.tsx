import { useEffect, useState } from 'react'

interface Bet {
  id: string
  game: string
  bet_amount: number
  payout: number
  player_won: boolean
  created_at: string
}

interface Stats {
  total_bets: number
  wins: number
  losses: number
  profit: number
  total_wagered: number
  total_payout: number
  win_rate: string
  games: Record<string, { plays: number; wins: number; profit: number }>
}

interface Props {
  onBack: () => void
  userId?: number
}

const BASE = import.meta.env.VITE_API_URL || ''

const GAME_ICONS: Record<string, string> = {
  dice: '◆', coinflip: '◑', crash: '↗', mines: '⛏',
  plinko: '▼', slots: '≡', roulette: '◎', limbo: '↑', jackpot: '★'
}

const GAME_COLORS: Record<string, string> = {
  dice: '#0ff', coinflip: '#f0f', crash: '#ff0',
  mines: '#f00', plinko: '#0f0', slots: '#ff0',
  roulette: '#f00', limbo: '#0ff', jackpot: '#f0f'
}

export default function GameHistoryPage({ onBack, userId }: Props) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    fetch(`${BASE}/api/history`, { headers: { 'x-user-id': String(userId) } })
      .then(r => r.json())
      .then(d => { setStats(d.stats); setBets(d.bets || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [userId])

  return (
    <div className="page">
      <div className="header">
        <button className="btn btn-ghost" onClick={onBack}>← BACK</button>
        <div className="t-title">HISTORY</div>
        <div style={{width:60}} />
      </div>

      <div className="divider">YOUR STATS</div>

      {loading ? (
        <div className="text-center text-dim" style={{padding:40}}>LOADING...</div>
      ) : !stats ? (
        <div className="term-box text-center" style={{padding:24}}>
          <div className="t-sub">NO DATA</div>
        </div>
      ) : (
        <>
          <div className="term-box">
            <div className="stat-row">
              <div className="stat-item">
                <div className="stat-value">{stats.total_bets}</div>
                <div className="stat-label">TOTAL BETS</div>
              </div>
              <div className="stat-item">
                <div className="stat-value" style={{color:'var(--cyan)'}}>{stats.win_rate}%</div>
                <div className="stat-label">WIN RATE</div>
              </div>
            </div>
            <div className="stat-row" style={{marginTop:8}}>
              <div className="stat-item">
                <div className="stat-value" style={{color: stats.profit >= 0 ? 'var(--green)' : 'var(--red)'}}>
                  {stats.profit >= 0 ? '+' : ''}{stats.profit.toFixed(6)}
                </div>
                <div className="stat-label">PROFIT (ETH)</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.total_wagered.toFixed(4)}</div>
                <div className="stat-label">WAGERED</div>
              </div>
            </div>
          </div>

          {Object.keys(stats.games).length > 0 && (
            <>
              <div className="divider">BY GAME</div>
              <div className="term-box" style={{padding:0,overflow:'hidden'}}>
                {Object.entries(stats.games).sort(([,a],[,b]) => b.plays - a.plays).map(([game, g]) => (
                  <div key={game} style={{display:'grid',gridTemplateColumns:'24px 1fr 60px 80px',padding:'8px 12px',borderBottom:'1px solid var(--border)',fontSize:12,alignItems:'center'}}>
                    <div style={{color: GAME_COLORS[game] || 'var(--text)'}}>{GAME_ICONS[game] || '?'}</div>
                    <div style={{color:'var(--white)',textTransform:'uppercase',fontSize:11}}>{game}</div>
                    <div style={{color:'var(--text)',fontSize:11,textAlign:'center'}}>{g.plays}×</div>
                    <div style={{color: g.profit >= 0 ? 'var(--green)' : 'var(--red)',textAlign:'right',fontWeight:600,fontVariantNumeric:'tabular-nums'}}>
                      {g.profit >= 0 ? '+' : ''}{g.profit.toFixed(6)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {bets.length > 0 && (
            <>
              <div className="divider">RECENT BETS</div>
              <div className="term-box" style={{padding:0,overflow:'hidden'}}>
                {bets.map(b => (
                  <div key={b.id} style={{display:'grid',gridTemplateColumns:'20px 1fr 60px 70px',padding:'8px 12px',borderBottom:'1px solid var(--border)',fontSize:12,alignItems:'center'}}>
                    <div style={{color: GAME_COLORS[b.game] || 'var(--text)'}}>{GAME_ICONS[b.game] || '?'}</div>
                    <div style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      <span style={{color:'var(--text)',textTransform:'uppercase',fontSize:10}}>{b.game}</span>
                    </div>
                    <div style={{color:'var(--text)',fontVariantNumeric:'tabular-nums',fontSize:11}}>{b.bet_amount.toFixed(4)}</div>
                    <div style={{textAlign:'right',color: b.player_won ? 'var(--green)' : 'var(--red)',fontWeight:600,fontVariantNumeric:'tabular-nums'}}>
                      {b.player_won ? '+' : '-'}{(b.player_won ? b.payout - b.bet_amount : b.bet_amount).toFixed(4)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <div className="text-center text-muted mt-lg" style={{fontSize:9,letterSpacing:3}}>
        ─── END HISTORY ───
      </div>
    </div>
  )
}
