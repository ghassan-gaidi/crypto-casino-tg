import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'
import { TonConnectUI, THEME } from '@tonconnect/ui'
import { createWalletClient, createPublicClient, custom, getAddress, parseUnits, formatEther, http, type WalletClient } from 'viem'
import { base } from 'viem/chains'

export type Chain = 'evm' | 'sol' | 'ton'
export type WalletType = 'none' | 'evm-injected' | 'ton' | 'sol-phantom'

interface WalletState {
  type: WalletType
  chain: Chain
  address: string
  balance: string
}

interface Web3ContextType {
  wallet: WalletState | null
  connecting: boolean
  connectType: WalletType | null
  connectEVM: () => Promise<void>
  connectTON: () => Promise<void>
  connectSolana: () => Promise<void>
  disconnect: () => void
  refreshBalance: () => Promise<void>
  sendTransaction: (to: string, amount: string) => Promise<string | null>
}

const Web3Context = createContext<Web3ContextType>({
  wallet: null, connecting: false, connectType: null,
  connectEVM: async () => {}, connectTON: async () => {}, connectSolana: async () => {},
  disconnect: () => {}, refreshBalance: async () => {}, sendTransaction: async () => null,
})

export function useWeb3() { return useContext(Web3Context) }

const TON_MANIFEST_URL = 'https://crypto-casino-tg.vercel.app/tonconnect-manifest.json'
const TON_RPC = 'https://toncenter.com/api/v2/jsonRPC'
const SOL_RPC = 'https://api.mainnet-beta.solana.com'

/* ── Helpers ───────────────────────────────────────────────── */
function getInjectedEVM() {
  if (typeof window === 'undefined') return null
  return (window as any).ethereum ?? null
}

function getPhantom() {
  if (typeof window === 'undefined') return null
  const p = (window as any).solana
  return p?.isPhantom ? p : null
}

const publicClient = createPublicClient({ chain: base, transport: http('https://base-rpc.publicnode.com') })

export function Web3Provider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [connectType, setConnectType] = useState<WalletType | null>(null)
  const tonRef = useRef<TonConnectUI | null>(null)
  const wcRef = useRef<WalletClient | null>(null)

  // ── EVM ─────────────────────────────────────────────────
  const connectEVM = useCallback(async () => {
    const eth = getInjectedEVM()
    if (!eth) { alert('No EVM wallet found. Install MetaMask or Rabby.'); return }
    setConnecting(true); setConnectType('evm-injected')
    try {
      const walletClient = createWalletClient({ chain: base, transport: custom(eth) })
      const [address] = await walletClient.requestAddresses()
      if (!address) throw new Error('No accounts')
      const bal = await publicClient.getBalance({ address: getAddress(address) })
      wcRef.current = walletClient
      setWallet({ type: 'evm-injected', chain: 'evm', address, balance: formatEther(bal) })
    } catch (err: any) {
      if (err.code !== 4001) console.error('EVM:', err)
    } finally { setConnecting(false); setConnectType(null) }
  }, [])

  // ── TON ─────────────────────────────────────────────────
  const connectTON = useCallback(async () => {
    setConnecting(true); setConnectType('ton')
    try {
      if (!tonRef.current) {
        tonRef.current = new TonConnectUI({
          manifestUrl: TON_MANIFEST_URL, buttonRootId: 'ton-connect-button',
          uiPreferences: { theme: THEME.DARK },
        })
        tonRef.current.onStatusChange(async (w) => {
          if (w) {
            const addr = w.account.address
            setWallet(prev => prev?.type === 'ton' ? { ...prev, address: addr } : { type: 'ton', chain: 'ton', address: addr, balance: '0' })
            try { const r = await fetch(TON_RPC, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getAddressBalance', params: { address: addr } }) }); const d = await r.json(); if (d?.result) setWallet(prev => prev?.type === 'ton' ? { ...prev, balance: (Number(d.result) / 1e9).toFixed(4) } : null) } catch {}
          } else setWallet(prev => prev?.type === 'ton' ? null : prev)
        })
      }
      await tonRef.current.openModal()
    } catch (err) { console.error('TON:', err) }
    finally { setConnecting(false); setConnectType(null) }
  }, [])

  // ── Solana ──────────────────────────────────────────────
  const connectSolana = useCallback(async () => {
    const phantom = getPhantom()
    if (!phantom) { alert('No Solana wallet found. Install Phantom.'); return }
    setConnecting(true); setConnectType('sol-phantom')
    try {
      const resp = await phantom.connect()
      const pubKey = resp.publicKey.toString()
      try {
        const r = await fetch(SOL_RPC, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getBalance', params: [pubKey] }) })
        const d = await r.json()
        setWallet({ type: 'sol-phantom', chain: 'sol', address: pubKey, balance: ((d?.result?.value || 0) / 1e9).toFixed(4) })
      } catch { setWallet({ type: 'sol-phantom', chain: 'sol', address: pubKey, balance: '0' }) }
    } catch (err: any) { if (err.code !== 4001) console.error('Solana:', err) }
    finally { setConnecting(false); setConnectType(null) }
  }, [])

  const disconnect = useCallback(() => {
    if (wallet?.type === 'ton') tonRef.current?.disconnect()
    else if (wallet?.type === 'sol-phantom') getPhantom()?.disconnect()
    else if (wallet?.type === 'evm-injected') {
      // Injected wallets can't be disconnected programmatically, just clear state
    }
    wcRef.current = null; setWallet(null)
  }, [wallet])

  const refreshBalance = useCallback(async () => {
    if (!wallet) return
    try {
      if (wallet.chain === 'evm') {
        const bal = await publicClient.getBalance({ address: getAddress(wallet.address) })
        setWallet(prev => prev ? { ...prev, balance: formatEther(bal) } : null)
      } else if (wallet.chain === 'ton') {
        const r = await fetch(TON_RPC, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getAddressBalance', params: { address: wallet.address } }) })
        const d = await r.json()
        if (d?.result) setWallet(prev => prev ? { ...prev, balance: (Number(d.result) / 1e9).toFixed(4) } : null)
      } else if (wallet.chain === 'sol') {
        const r = await fetch(SOL_RPC, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getBalance', params: [wallet.address] }) })
        const d = await r.json()
        if (d?.result) setWallet(prev => prev ? { ...prev, balance: (d.result.value / 1e9).toFixed(4) } : null)
      }
    } catch {}
  }, [wallet])

  const sendTransaction = useCallback(async (to: string, amount: string) => {
    if (!wallet) return null
    try {
      if (wallet.type === 'evm-injected' && wcRef.current) {
        const hash = await wcRef.current.sendTransaction({
          to: getAddress(to),
          value: parseUnits(amount, 18),
          account: getAddress(wallet.address),
          chain: base,
        })
        return hash
      }
      if (wallet.type === 'ton' && tonRef.current) {
        const result = await tonRef.current.sendTransaction({
          validUntil: Date.now() + 5 * 60 * 1000,
          messages: [{ address: to, amount: (parseFloat(amount) * 1e9).toString() }],
        })
        return result.boc
      }
      if (wallet.type === 'sol-phantom') {
        const phantom = getPhantom()
        if (!phantom) return null
        const { SystemProgram, Transaction, PublicKey } = await import('@solana/web3.js')
        const tx = new Transaction().add(SystemProgram.transfer({
          fromPubkey: new PublicKey(wallet.address),
          toPubkey: new PublicKey(to),
          lamports: Math.round(parseFloat(amount) * 1e9),
        }))
        const { signature } = await phantom.signAndSendTransaction(tx)
        return signature
      }
    } catch (err) { console.error('TX error:', err); return null }
    return null
  }, [wallet])

  return (
    <Web3Context.Provider value={{
      wallet, connecting, connectType,
      connectEVM, connectTON, connectSolana,
      disconnect, refreshBalance, sendTransaction,
    }}>
      {children}
      <div id="ton-connect-button" style={{ display: 'none' }} />
    </Web3Context.Provider>
  )
}
