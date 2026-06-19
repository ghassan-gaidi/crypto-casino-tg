import { ethers } from 'ethers'
import { db } from './supabase'

// ── EVM (Base) ──

export function getEvmProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(process.env.BASE_RPC_URL!)
}

export function getEvmSigner(): ethers.Wallet {
  return new ethers.Wallet(process.env.HOT_WALLET_PK!, getEvmProvider())
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
 * Send ETH (or token) from hot wallet
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

// ── Solana ──

// Placeholder — will use @solana/web3.js + @solana/spl-token
// We'll add real Solana integration when we install the deps

// ── TON ──

// Placeholder — will use @ton/ton + @ton/connect
// Real TON integration when we install the deps

// ── Deposit detection ──

/**
 * Poll for deposits to a known deposit address.
 * This is called by the webhook or a cron job.
 */
export async function detectEvmDeposits(): Promise<Array<{
  txHash: string
  from: string
  to: string
  value: string
}>> {
  const provider = getEvmProvider()
  const depositAddresses = await db.from('deposit_addresses').select('*').eq('chain', 'evm')
  if (!depositAddresses.data?.length) return []

  const addresses = depositAddresses.data.map(a => a.address.toLowerCase())
  const latestBlock = await provider.getBlockNumber()
  const fromBlock = latestBlock - 50 // scan last 50 blocks

  const logs = await provider.getLogs({
    address: addresses,
    fromBlock,
    toBlock: 'latest',
  })

  // Filter for native ETH transfers (no contract address = native)
  const deposits: Array<{ txHash: string; from: string; to: string; value: string }> = []
  for (const log of logs) {
    // For native transfers we'd need to trace block transactions
    // or use a tx monitoring service
  }

  return deposits
}
