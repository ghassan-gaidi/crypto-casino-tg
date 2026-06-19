import { generateSeed, hashSeed } from '../src/provably-fair'
import { getActiveSeed, createServerSeed, incrementSeedNonce, recordBet, updateBalance, ensureUser, getBalance } from '../src/supabase'
import { playCoinflip } from '../src/games/coinflip'

interface WithdrawRequest {
  amount: number
  chain: 'evm' | 'solana' | 'ton'
  address: string
  initData?: { user?: { id: number; username?: string; first_name?: string } }
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const raw = await req.json() as { amount?: number; chain?: string; address?: string; initData?: unknown }
    const body: WithdrawRequest = {
      amount: Number(raw.amount),
      chain: raw.chain as 'evm' | 'solana' | 'ton',
      address: raw.address as string,
      initData: raw.initData as { user?: { id: number; username?: string; first_name?: string } } | undefined,
    }

    const { amount, chain, address, initData } = body

    if (!initData?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }
    if (isNaN(amount) || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), { status: 400 })
    }
    if (!address || address.length < 10) {
      return new Response(JSON.stringify({ error: 'Invalid address' }), { status: 400 })
    }
    if (!['evm', 'solana', 'ton'].includes(chain)) {
      return new Response(JSON.stringify({ error: 'Invalid chain' }), { status: 400 })
    }

    const userId = initData.user.id
    await ensureUser(userId, initData.user.username, initData.user.first_name)

    const bal = await getBalance(userId)
    const balKey = chain === 'evm' ? 'balance_evm' : chain === 'solana' ? 'balance_sol' : 'balance_ton'
    const currentBal = Number((bal as Record<string, unknown>)[balKey] ?? 0)

    if (amount > currentBal) {
      return new Response(JSON.stringify({ error: 'Insufficient balance' }), { status: 400 })
    }

    // Create withdrawal record and deduct balance
    const { createWithdrawal } = await import('../src/supabase')
    await createWithdrawal(userId, chain, address, amount)
    await updateBalance(userId, chain, -amount)

    return new Response(
      JSON.stringify({
        success: true,
        chain,
        amount,
        address: `${address.slice(0, 8)}...${address.slice(-4)}`,
        status: 'pending',
      }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('Withdraw error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 })
  }
}
