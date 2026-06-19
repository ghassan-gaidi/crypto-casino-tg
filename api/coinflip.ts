import { generateSeed, hashSeed } from '../src/provably-fair'
import { getBalance, getActiveSeed, createServerSeed, incrementSeedNonce, recordBet, updateBalance } from '../src/supabase'
import { playCoinflip } from '../src/games/coinflip'
import { ensureUser } from '../src/supabase'

interface CoinflipRequest {
  amount: number
  pick: 'heads' | 'tails'
  initData?: { user?: { id: number; username?: string; first_name?: string } }
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const raw = await req.json() as { amount?: number; pick?: string; initData?: unknown }
    const body: CoinflipRequest = {
      amount: Number(raw.amount),
      pick: raw.pick as 'heads' | 'tails',
      initData: raw.initData as { user?: { id: number; username?: string; first_name?: string } } | undefined,
    }
    const { amount, pick, initData } = body

    if (!initData?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }
    if (isNaN(amount) || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid bet amount' }), { status: 400 })
    }
    if (pick !== 'heads' && pick !== 'tails') {
      return new Response(JSON.stringify({ error: 'Pick must be heads or tails' }), { status: 400 })
    }

    const userId = initData.user.id
    await ensureUser(userId, initData.user.username, initData.user.first_name)

    const bal = await getBalance(userId)
    if (Number(bal.balance_evm) < amount) {
      return new Response(JSON.stringify({ error: 'Insufficient balance' }), { status: 400 })
    }

    let seed = await getActiveSeed()
    if (!seed || seed.current_nonce >= seed.max_nonce) {
      const newSeed = generateSeed()
      const newHash = hashSeed(newSeed)
      seed = await createServerSeed(newSeed, newHash)
    }

    const clientSeed = generateSeed()

    const result = playCoinflip({
      serverSeed: seed.seed,
      clientSeed,
      nonce: seed.current_nonce,
      pick,
      betAmount: amount,
    })

    await recordBet({
      userId,
      game: 'coinflip',
      chain: 'evm',
      betAmount: amount,
      payout: result.payout,
      outcome: { result: result.result, pick },
      serverSeed: seed.seed,
      clientSeed,
      nonce: seed.current_nonce,
      resultHash: result.resultHash,
      playerWon: result.playerWon,
    })

    // Update balance: deduct bet, add payout
    const delta = result.payout - amount
    await updateBalance(userId, 'evm', delta)

    await incrementSeedNonce(seed.id)

    return new Response(
      JSON.stringify({
        result: result.result,
        playerWon: result.playerWon,
        payout: result.payout,
        payoutMultiplier: result.payoutMultiplier,
        resultHash: result.resultHash,
        nonce: seed.current_nonce,
        clientSeed,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('Coinflip error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 })
  }
}
