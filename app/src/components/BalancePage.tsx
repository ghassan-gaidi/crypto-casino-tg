import { useState, useEffect, useCallback } from 'react'
import AnimatedNumber from './AnimatedNumber'

interface Props {
  onBack: () => void
  userId?: number
  username?: string
}

type Tab = 'balance' | 'deposit' | 'withdraw' | 'history'
type Chain = 'evm' | 'sol' | 'ton'

const CHAIN_META: Record<Chain, { symbol: string; name: string; network: string; minDep: string; minWd: string; placeholder: string; color: string }> = {
  evm: { symbol: 'ETH', name: 'ETH', network: 'BASE', minDep: '0.0001', minWd: '0.0005', placeholder: '0x...', color: '#627EEA' },
  sol: { symbol: 'SOL', name: 'SOL', network: 'SOLANA', minDep: '0.001', minWd: '0.005', placeholder: 'Solana address...', color: '#14F195' },
  ton: { symbol: 'TON', name: 'TON', network: 'TON', minDep: '0.1', minWd: '0.5', placeholder: '0:hex or base64...', color: '#0098EA' },
}

// Admin wallet addresses — users send crypto here, we keep revenue
const ADMIN_WALLETS: Record<Chain, string> = {
  evm: '0x29021dd5306D7b3b6608a2bc8276D33c1200C7Ef',
  sol: '2wZ7mvMaEc9sRPTj1y5iiGnT9q9B8XhKT6yWhxBwS7Nc',
  ton: '0:05e21ca19f552360c239599c137a46669aae789417ef4f1a4e3e560939d7aa39',
}

function ChainIcon({ chain, size = 12 }: { chain: Chain; size?: number }) {
  switch (chain) {
    case 'evm':
      return (
        <svg width={size} height={size} viewBox="0 0 12 12" fill="none" style={{ display: 'block' }}>
          <path d="M6 0L11 3V9L6 12L1 9V3L6 0Z" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <path d="M6 3L8 4.5V7.5L6 9L4 7.5V4.5L6 3Z" fill="currentColor" opacity="0.5" />
        </svg>
      )
    case 'sol':
      return (
        <svg width={size} height={size} viewBox="0 0 12 12" fill="none" style={{ display: 'block' }}>
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="6" cy="6" r="1.5" fill="currentColor" />
        </svg>
      )
    case 'ton':
      return (
        <svg width={size} height={size} viewBox="0 0 12 12" fill="none" style={{ display: 'block' }}>
          <path d="M6 0L11 6L6 12L1 6L6 0Z" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <path d="M6 2L9.5 6H8L6 9L4 6H2.5L6 2Z" fill="currentColor" opacity="0.5" />
        </svg>
      )
  }
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
      <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ display: 'block', flexShrink: 0 }}>
      <path d="M12 3L2 21h20L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none" />
      <path d="M12 9v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  )
}

export default function BalancePage({ onBack, userId, username }: Props) {
  const [tab, setTab] = useState<Tab>('balance')
  const [chain, setChain] = useState<Chain>('evm')
  const [balance, setBalance] = useState<{ evm: string; sol: string; ton: string } | null>(null)
  const [loading, setLoading] = useState(true)

  // Deposit state
  const [txHash, setTxHash] = useState('')
  const [depositStatus, setDepositStatus] = useState('')
  const [depositError, setDepositError] = useState('')
  const [copied, setCopied] = useState(false)

  // Withdraw state
  const [wdAmount, setWdAmount] = useState('')
  const [wdAddress, setWdAddress] = useState('')
  const [wdStatus, setWdStatus] = useState('')
  const [wdError, setWdError] = useState('')
  const [wdLoading, setWdLoading] = useState(false)

  // History state
  const [deposits, setDeposits] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])

  const initData = typeof window !== 'undefined'
    ? (window as any).Telegram?.WebApp?.initData || ''
    : ''

  const fetchBalance = useCallback(() => {
    if (!userId) return
    fetch(`/api/balance?userId=${userId}&username=${username || ''}`)
      .then(r => r.json())
      .then(data => { if (data.evm !== undefined) setBalance(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [userId, username])

  useEffect(() => { fetchBalance() }, [fetchBalance])

  const verifyTx = async () => {
    if (!txHash.trim()) return
    setDepositStatus('Verifying...')
    setDepositError('')
    const meta = CHAIN_META[chain]
    try {
      const r = await fetch('/api/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, txHash: txHash.trim(), chain }),
      })
      const d = await r.json()
      if (d.success) {
        setDepositStatus(d.status === 'confirmed'
          ? `Credited ${d.amount} ${meta.symbol}`
          : `Detected — ${d.confirmations}/${d.required || 3} confirmations`)
        fetchBalance()
        if (d.status === 'confirmed') setTxHash('')
      } else {
        setDepositError(d.error || 'Verification failed')
        setDepositStatus('')
      }
    } catch {
      setDepositError('Network error')
      setDepositStatus('')
    }
  }

  const requestWithdraw = async () => {
    if (!wdAmount || !wdAddress) return
    setWdLoading(true)
    setWdError('')
    setWdStatus('')
    const meta = CHAIN_META[chain]
    try {
      const r = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, amount: parseFloat(wdAmount), toAddress: wdAddress, chain }),
      })
      const d = await r.json()
      if (d.success) {
        setWdStatus(`Withdrawal submitted — ${d.amount} ${meta.symbol} → ${d.to_address.slice(0, 10)}...`)
        setWdAmount('')
        setWdAddress('')
        fetchBalance()
      } else {
        setWdError(d.error || 'Withdrawal failed')
      }
    } catch {
      setWdError('Network error')
    }
    setWdLoading(false)
  }

  const loadHistory = async () => {
    if (!userId) return
    try {
      const r = await fetch(`/api/balance?userId=${userId}&username=${username || ''}`)
      const d = await r.json()
      if (d.deposits) setDeposits(d.deposits)
      if (d.withdrawals) setWithdrawals(d.withdrawals)
    } catch {}
  }

  const handleTab = (t: Tab) => {
    setTab(t)
    if (t === 'history') loadHistory()
  }

  const copyAddr = () => {
    navigator.clipboard.writeText(ADMIN_WALLETS[chain])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const meta = CHAIN_META[chain]
  const currentBal = balance ? Number(balance[chain]).toFixed(6) : '—'

  return (
    <div className="page">
      <div className="header">
        <button className="btn-back" onClick={onBack}>Back</button>
        <span className="header-title">WALLET</span>
        <span className="header-balance">
          {balance ? (
            <AnimatedNumber value={Number(balance[chain])} decimals={6} />
          ) : currentBal}
        </span>
      </div>

      {/* TAB BAR */}
      <div className="chips">
        {(['balance', 'deposit', 'withdraw', 'history'] as Tab[]).map(t => (
          <button key={t} className={`chip${tab === t ? ' active' : ''}`}
            onClick={() => handleTab(t)}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* CHAIN SELECTOR (deposit/withdraw) */}
      {(tab === 'deposit' || tab === 'withdraw') && (
        <div className="chips" style={{ marginTop: 8 }}>
          {(['evm', 'sol', 'ton'] as Chain[]).map(c => (
            <button key={c} className={`chip${chain === c ? ' active' : ''}`}
              onClick={() => { setChain(c); setTxHash(''); setDepositStatus(''); setDepositError(''); setWdAmount(''); setWdAddress(''); setWdStatus(''); setWdError(''); setCopied(false) }}
              style={{ fontSize: 10, padding: '4px 8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <span style={{ display: 'flex', alignItems: 'center', color: CHAIN_META[c].color }}>
                <ChainIcon chain={c} size={10} />
              </span>
              {CHAIN_META[c].symbol}
            </button>
          ))}
        </div>
      )}

      {/* BALANCE TAB */}
      {tab === 'balance' && (
        loading ? (
          <div className="text-center text-dim" style={{ padding: 40 }}>▌ LOADING ▐</div>
        ) : balance ? (
          <div className="flex flex-col gap-sm">
            {(['evm', 'sol', 'ton'] as Chain[]).map(c => (
              <div key={c} className="term-box">
                <div className="term-box-hd">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ display: 'flex', alignItems: 'center', color: CHAIN_META[c].color }}>
                      <ChainIcon chain={c} size={10} />
                    </span>
                    {CHAIN_META[c].symbol} · {CHAIN_META[c].network}
                  </span>
                </div>
                <div className="term-box-bd">
                  <div className="stat-row">
                    <span className="stat-label">BALANCE</span>
                    <span className="stat-val" style={{ color: c === chain ? 'var(--yellow)' : undefined }}>
                      <AnimatedNumber value={Number(balance[c])} decimals={6} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-dim" style={{ padding: 40 }}>
            COULD NOT LOAD BALANCE<br/>
            <span className="t-small text-muted">ENSURE TELEGRAM LOGIN</span>
          </div>
        )
      )}

      {/* DEPOSIT TAB — shows admin wallet address directly */}
      {tab === 'deposit' && (
        <div className="flex flex-col gap-sm">
          <div className="term-box">
            <div className="term-box-hd"><span>DEPOSIT {meta.symbol}</span></div>
            <div className="term-box-bd">
              <div className="t-label" style={{ marginBottom: 8 }}>SEND {meta.symbol} ({meta.network}) TO</div>
              <div style={{
                padding: '10px 12px', border: '1px solid var(--border)',
                background: 'var(--bg)', fontFamily: 'var(--mono)',
                fontSize: 11, color: 'var(--white)', wordBreak: 'break-all',
                lineHeight: 1.6, marginBottom: 8,
              }}>
                {ADMIN_WALLETS[chain]}
              </div>
              <button className="btn btn-sm" onClick={copyAddr}
                style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {copied ? '✓ COPIED' : <><CopyIcon /> COPY ADDRESS</>}
              </button>
              <div className="t-small text-muted" style={{ marginTop: 8 }}>
                MIN DEPOSIT: {meta.minDep} {meta.symbol} · {chain === 'evm' ? '3 CONFIRMATIONS' : '1 CONFIRMATION'}
              </div>
              <div className="t-small" style={{ marginTop: 6, color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <WarningIcon /> SEND ONLY {meta.symbol} ON {meta.network}
              </div>
            </div>
          </div>

          <div className="term-box">
            <div className="term-box-hd"><span>VERIFY TX</span></div>
            <div className="term-box-bd">
              <div className="t-label" style={{ marginBottom: 8 }}>PASTE YOUR {meta.symbol} TX HASH</div>
              <input className="input" placeholder={chain === 'evm' ? '0x...' : 'TX signature...'}
                value={txHash} onChange={e => setTxHash(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', marginBottom: 8 }} />
              <button className="btn btn-green btn-sm" onClick={verifyTx}
                style={{ width: '100%' }} disabled={!txHash.trim()}>
                VERIFY & CREDIT
              </button>
              {depositStatus && <div style={{ marginTop: 8, fontSize: 11, color: 'var(--green)' }}>{depositStatus}</div>}
              {depositError && <div style={{ marginTop: 8, fontSize: 11, color: 'var(--red)' }}>{depositError}</div>}
            </div>
          </div>
        </div>
      )}

      {/* WITHDRAW TAB */}
      {tab === 'withdraw' && (
        <div className="flex flex-col gap-sm">
          <div className="term-box">
            <div className="term-box-hd"><span>WITHDRAW {meta.symbol}</span></div>
            <div className="term-box-bd">
              <div className="stat-row" style={{ marginBottom: 12 }}>
                <span className="stat-label">AVAILABLE</span>
                <span className="stat-val" style={{ color: 'var(--yellow)' }}>
                  {balance ? Number(balance[chain]).toFixed(6) : '—'} {meta.symbol}
                </span>
              </div>

              <div className="t-label" style={{ marginBottom: 6 }}>AMOUNT ({meta.symbol})</div>
              <input className="input" type="number" step="0.0001" min={meta.minWd}
                placeholder="0.0" value={wdAmount}
                onChange={e => setWdAmount(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', marginBottom: 10 }} />

              <div className="t-label" style={{ marginBottom: 6 }}>TO {meta.symbol} ADDRESS</div>
              <input className="input" placeholder={meta.placeholder} value={wdAddress}
                onChange={e => setWdAddress(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', marginBottom: 10 }} />

              <button className="btn btn-green btn-sm" onClick={requestWithdraw}
                style={{ width: '100%' }} disabled={wdLoading || !wdAmount || !wdAddress}>
                {wdLoading ? 'PROCESSING...' : 'REQUEST WITHDRAWAL'}
              </button>

              <div className="t-small text-muted" style={{ marginTop: 8 }}>
                MIN WITHDRAWAL: {meta.minWd} {meta.symbol} · PROCESSED WITHIN 5 MIN
              </div>

              {wdStatus && <div style={{ marginTop: 8, fontSize: 11, color: 'var(--green)' }}>{wdStatus}</div>}
              {wdError && <div style={{ marginTop: 8, fontSize: 11, color: 'var(--red)' }}>{wdError}</div>}
            </div>
          </div>
        </div>
      )}

      {/* HISTORY TAB */}
      {tab === 'history' && (
        <div className="flex flex-col gap-sm">
          <div className="term-box">
            <div className="term-box-hd"><span>DEPOSITS</span></div>
            <div className="term-box-bd">
              {deposits.length === 0 ? (
                <div className="text-center text-dim" style={{ padding: 16, fontSize: 11 }}>NO DEPOSITS</div>
              ) : deposits.map((d: any) => (
                <div key={d.id} className="stat-row">
                  <div>
                    <div className="stat-label">{new Date(d.detected_at).toLocaleDateString()}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
                      {d.chain?.toUpperCase() || 'EVM'} · {d.tx_hash?.slice(0, 14)}...
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className={`stat-val ${d.status === 'confirmed' ? 'green' : 'red'}`}>
                      {d.status === 'confirmed' ? '+' : ''}{Number(d.amount).toFixed(4)}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 2 }}>
                      {d.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="term-box">
            <div className="term-box-hd"><span>WITHDRAWALS</span></div>
            <div className="term-box-bd">
              {withdrawals.length === 0 ? (
                <div className="text-center text-dim" style={{ padding: 16, fontSize: 11 }}>NO WITHDRAWALS</div>
              ) : withdrawals.map((w: any) => (
                <div key={w.id} className="stat-row">
                  <div>
                    <div className="stat-label">{new Date(w.requested_at).toLocaleDateString()}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
                      {w.chain?.toUpperCase() || 'EVM'} · → {w.to_address?.slice(0, 14)}...
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className={`stat-val ${w.status === 'completed' ? 'green' : w.status === 'failed' ? 'red' : ''}`}>
                      -{Number(w.amount).toFixed(4)}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 2 }}>
                      {w.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="divider" style={{ marginTop: 20 }}>END TRANSMISSION</div>
    </div>
  )
}
