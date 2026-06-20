import { JsonRpcProvider, Wallet } from 'ethers'
import { db } from './supabase'

// ── EVM (Base) ──

export function getEvmProvider(): JsonRpcProvider {
  return new JsonRpcProvider(process.env.BASE_RPC_URL!)
}

export function getEvmSigner(): Wallet {
  return new Wallet(process.env.HOT_WALLET_PK!, getEvmProvider())
}

/**
 * Check if a transaction has enough confirmations on Base
 */
export async function checkEvmTxConfirmations(
  txHash: string,
  minConfirmations = 12,
): Promise<{ confirmed: boolean; confirmations: number }> {
  const provider = getEvmProvider()
  const receipt = await provider.getTransactionReceipt(txHash)
  if (!receipt) return { confirmed: false, confirmations: 0 }
  const currentBlock = await provider.getBlockNumber()
  const confirmations = currentBlock - receipt.blockNumber + 1
  return { confirmed: confirmations >= minConfirmations, confirmations }
}

/**
 * Verify a deposit TX: check it sent funds to the hot wallet and has enough confirmations
 */
export async function verifyDepositTx(txHash: string): Promise<{
  valid: boolean
  from?: string
  to?: string
  value?: string
  confirmations?: number
  error?: string
}> {
  try {
    const provider = getEvmProvider()
    const tx = await provider.getTransaction(txHash)
    if (!tx) return { valid: false, error: 'Transaction not found' }

    const receipt = await provider.getTransactionReceipt(txHash)
    if (!receipt) return { valid: false, error: 'Transaction not yet confirmed' }

    const currentBlock = await provider.getBlockNumber()
    const confirmations = currentBlock - receipt.blockNumber + 1

    // Check it went to the hot wallet
    const hotWallet = (process.env.HOT_WALLET_PK
      ? new Wallet(process.env.HOT_WALLET_PK!).address
      : '').toLowerCase()

    if (!tx.to || tx.to.toLowerCase() !== hotWallet) {
      return { valid: false, error: `Transaction did not go to the casino hot wallet` }
    }

    return {
      valid: true,
      from: tx.from,
      to: tx.to,
      value: tx.value.toString(),
      confirmations,
    }
  } catch (err: any) {
    return { valid: false, error: err.message }
  }
}

/**
 * Send ETH from hot wallet
 */
export async function sendEvmTx(
  to: string,
  valueWei: bigint,
): Promise<string> {
  const signer = getEvmSigner()
  const tx = await signer.sendTransaction({
    to,
    value: valueWei,
  })
  return tx.hash
}

// ── Deposit polling ──

const HOT_WALLET_CACHE: { address: string } = { address: '' }

function getHotWalletAddress(): string {
  if (!HOT_WALLET_CACHE.address && process.env.HOT_WALLET_PK) {
    HOT_WALLET_CACHE.address = new Wallet(process.env.HOT_WALLET_PK).address.toLowerCase()
  }
  return HOT_WALLET_CACHE.address
}

/**
 * Scan recent blocks for incoming native ETH transfers to the hot wallet.
 * Returns deposits not yet credited that have enough confirmations.
 */
export async function detectEvmDeposits(): Promise<Array<{
  txHash: string
  from: string
  to: string
  value: string
  blockNumber: number
}>> {
  const provider = getEvmProvider()
  const hotWallet = getHotWalletAddress()
  if (!hotWallet) return []

  const latestBlock = await provider.getBlockNumber()
  const fromBlock = Math.max(0, latestBlock - 100) // scan last 100 blocks

  // Get existing processed TXs to avoid duplicates
  const { data: processed } = await db
    .from('tg_deposits')
    .select('tx_hash')
    .eq('chain', 'evm')
  const processedSet = new Set((processed || []).map(r => r.tx_hash.toLowerCase()))

  const deposits: Array<{ txHash: string; from: string; to: string; value: string; blockNumber: number }> = []

  // Scan blocks in batches to avoid overwhelming the RPC
  const batchSize = 10
  for (let i = fromBlock; i <= latestBlock; i += batchSize) {
    const endBlock = Math.min(i + batchSize - 1, latestBlock)
    const blocks = await Promise.all(
      Array.from({ length: endBlock - i + 1 }, (_, j) => provider.getBlock(i + j, true))
    )

    for (const block of blocks) {
      if (!block?.transactions) continue
      for (const tx of block.transactions) {
        const txObj = tx as any
        const txTo = typeof txObj.to === 'string' ? txObj.to.toLowerCase() : ''
        if (txTo === hotWallet && !processedSet.has(txObj.hash?.toLowerCase())) {
          const receipt = await provider.getTransactionReceipt(txObj.hash)
          if (receipt && receipt.status === 1) {
            deposits.push({
              txHash: txObj.hash,
              from: txObj.from.toLowerCase(),
              to: txTo,
              value: txObj.value?.toString() || '0',
              blockNumber: block.number,
            })
          }
        }
      }
    }
  }

  return deposits
}

// ── Solana ──

// Placeholder — will use @solana/web3.js + @solana/spl-token

// ── TON ──

// Placeholder — will use @ton/ton + @ton/connect
