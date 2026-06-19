import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!

export const db = createClient(supabaseUrl, supabaseKey)

// ── Users ──
export async function ensureUser(telegramId: number, username?: string, firstName?: string) {
  const { data, error } = await db
    .from('tg_users')
    .upsert({ id: telegramId, username, first_name: firstName }, { onConflict: 'id' })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Wallet Connections ──
export async function connectWallet(
  userId: number,
  chain: 'evm' | 'solana' | 'ton',
  address: string,
  signature?: string,
) {
  const { data, error } = await db
    .from('tg_wallet_connections')
    .upsert({ user_id: userId, chain, address, signature }, { onConflict: 'user_id,chain' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getWalletConnection(userId: number, chain: 'evm' | 'solana' | 'ton') {
  const { data } = await db
    .from('tg_wallet_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('chain', chain)
    .single()
  return data
}

export async function getUserWallets(userId: number) {
  const { data } = await db.from('tg_wallet_connections').select('*').eq('user_id', userId)
  return data ?? []
}

// ── Balances ──
export async function getBalance(userId: number) {
  const { data } = await db.from('tg_balances').select('*').eq('user_id', userId).single()
  return data ?? { user_id: userId, balance: 0, balance_evm: 0, balance_sol: 0, balance_ton: 0 }
}

export async function updateBalance(
  userId: number,
  chain: 'evm' | 'solana' | 'ton',
  delta: number,
) {
  const col = chain === 'evm' ? 'balance_evm' : chain === 'solana' ? 'balance_sol' : 'balance_ton'
  const { data, error } = await db.rpc('tg_update_balance', {
    p_user_id: userId,
    p_chain_col: col,
    p_delta: delta,
  })
  if (error) throw error
  return data
}

// ── Deposits ──
export async function createDeposit(
  userId: number,
  chain: 'evm' | 'solana' | 'ton',
  txHash: string,
  fromAddress: string,
  toAddress: string,
  amount: number,
) {
  const { data, error } = await db
    .from('tg_deposits')
    .insert({
      user_id: userId,
      chain,
      tx_hash: txHash,
      from_address: fromAddress,
      to_address: toAddress,
      amount,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function confirmDeposit(txHash: string) {
  const { data, error } = await db
    .from('tg_deposits')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
    .eq('tx_hash', txHash)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Withdrawals ──
export async function createWithdrawal(
  userId: number,
  chain: 'evm' | 'solana' | 'ton',
  toAddress: string,
  amount: number,
) {
  const { data, error } = await db
    .from('tg_withdrawals')
    .insert({ user_id: userId, chain, to_address: toAddress, amount })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function completeWithdrawal(id: string, txHash: string) {
  const { data, error } = await db
    .from('tg_withdrawals')
    .update({ status: 'completed', tx_hash: txHash, completed_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Bets ──
export async function recordBet(params: {
  userId: number
  game: 'dice' | 'coinflip'
  chain: 'evm' | 'solana' | 'ton'
  betAmount: number
  payout: number
  outcome: unknown
  serverSeed: string
  clientSeed: string
  nonce: number
  resultHash: string
  playerWon: boolean
}) {
  const { data, error } = await db
    .from('tg_bets')
    .insert({
      user_id: params.userId,
      game: params.game,
      chain: params.chain,
      bet_amount: params.betAmount,
      payout: params.payout,
      outcome: params.outcome,
      server_seed: params.serverSeed,
      client_seed: params.clientSeed,
      nonce: params.nonce,
      result_hash: params.resultHash,
      player_won: params.playerWon,
      settled: true,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Server Seeds ──
export async function getActiveSeed() {
  const { data } = await db
    .from('tg_server_seeds')
    .select('*')
    .eq('status', 'active')
    .single()
  return data
}

export async function createServerSeed(seed: string, seedHash: string) {
  const { data, error } = await db
    .from('tg_server_seeds')
    .insert({ seed, seed_hash: seedHash, max_nonce: 10000 })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function incrementSeedNonce(seedId: string) {
  const { data, error } = await db.rpc('tg_increment_seed_nonce', { p_seed_id: seedId })
  if (error) throw error
  return data
}

export async function revealSeed(seedId: string) {
  const { data, error } = await db
    .from('tg_server_seeds')
    .update({ status: 'revealed', revealed_at: new Date().toISOString() })
    .eq('id', seedId)
    .select()
    .single()
  if (error) throw error
  return data
}
