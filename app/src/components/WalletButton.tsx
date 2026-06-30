import { useState } from 'react'
import { useWeb3 } from '../Web3Provider'

export default function WalletButton() {
  const { wallet, connecting, connectEVM, connectTON, connectSolana, disconnect } = useWeb3()
  const [showMenu, setShowMenu] = useState(false)

  if (wallet) {
    const icon = wallet.type === 'ton' ? '💎' : wallet.type === 'evm-injected' ? '◆' : '◎'
    const sym = wallet.chain === 'evm' ? 'ETH' : wallet.chain === 'sol' ? 'SOL' : 'TON'
    const short = wallet.address.length > 10
      ? `${wallet.address.slice(0, 4)}..${wallet.address.slice(-4)}`
      : wallet.address
    const bal = parseFloat(wallet.balance)
    const dispBal = bal > 0 ? (bal < 0.001 ? '<0.001' : bal.toFixed(bal < 1 ? 4 : 2)) : '0'

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '3px 8px', borderRadius: 4,
          background: 'rgba(0,255,136,0.06)',
          border: '1px solid rgba(0,255,136,0.15)',
          fontSize: 9, fontFamily: 'var(--font-mono)',
          color: '#00FF88', letterSpacing: 0.5,
        }}>
          <span style={{ fontSize: 10 }}>{icon}</span>
          <span>{dispBal} {sym}</span>
          <span style={{ color: 'var(--text-dim)', marginLeft: 2 }}>{short}</span>
        </div>
        <button onClick={disconnect} style={{
          background: 'none', border: '1px solid var(--border)',
          borderRadius: 4, padding: '3px 6px',
          fontSize: 8, letterSpacing: 1, textTransform: 'uppercase',
          color: 'var(--text-dim)', cursor: 'pointer', fontFamily: 'var(--font)',
        }}>✕</button>
      </div>
    )
  }

  if (connecting) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '3px 8px', borderRadius: 4,
        background: 'rgba(220,38,54,0.08)',
        border: '1px solid rgba(220,38,54,0.2)',
        fontSize: 9, fontFamily: 'var(--font)',
        color: 'var(--cyan)', letterSpacing: 1,
        textTransform: 'uppercase',
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#DC2626', animation: 'pulse-cyan 1s infinite', display: 'inline-block' }} />
        CONNECTING...
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setShowMenu(!showMenu)} style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '3px 8px', borderRadius: 4,
        background: 'rgba(220,38,54,0.08)',
        border: '1px solid rgba(220,38,54,0.2)',
        fontSize: 9, fontFamily: 'var(--font)',
        color: '#DC2626', cursor: 'pointer',
        letterSpacing: 1, textTransform: 'uppercase',
      }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <circle cx="12" cy="13" r="1.5" fill="#DC2626" />
        </svg>
        CONNECT
      </button>

      {showMenu && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setShowMenu(false)} />
          <div style={{
            position: 'absolute', top: '100%', right: 0, zIndex: 999, marginTop: 4,
            background: '#101018', border: '1px solid #1E1E30', borderRadius: 4,
            padding: 4, minWidth: 160,
          }}>
            <WalletOption
              icon="◆" label="EVM (MetaMask)" color="#627EEA" onClick={() => { setShowMenu(false); connectEVM() }}
            />
            <WalletOption
              icon="◎" label="Solana (Phantom)" color="#14F195" onClick={() => { setShowMenu(false); connectSolana() }}
            />
            <WalletOption
              icon="💎" label="TON (Tonkeeper)" color="#0098EA" onClick={() => { setShowMenu(false); connectTON() }}
            />
          </div>
        </>
      )}
    </div>
  )
}

function WalletOption({ icon, label, color, onClick }: { icon: string; label: string; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 8, width: '100%',
      padding: '8px 10px', borderRadius: 4,
      background: 'none', border: 'none',
      fontSize: 11, fontFamily: 'var(--font)',
      color: '#D4D4E0', cursor: 'pointer',
      transition: 'background 0.15s',
    }}
    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220,38,54,0.08)')}
    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
    >
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span style={{ flex: 1, letterSpacing: 0.5 }}>{label}</span>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
    </button>
  )
}
