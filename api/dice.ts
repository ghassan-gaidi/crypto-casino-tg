import { generateSeed, hashSeed } from '../src/provably-fair'
import { getBalance, getActiveSeed, createServerSeed, incrementSeedNonce, recordBet, updateBalance } from '../src/supabase'
import { playDice } from '../src/games/dice'
import { ensureUser } from '../src/supabase'

interface DiceRequest {
  amount: number
  direction: 'under' | 'over'
  target: number
  initData?: { user?: { id: number; username?: string; first_name?: string } }
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const raw = await req.json() as Record<string, unknown>
    const body: DiceRequest = {
      amount: Number(raw.amount),
      direction: raw.direction as 'under' | 'over',
      target: Number(raw.target),
      initData: raw.initData as DiceRequest['initData'],
    }
    const { amount, direction, target, initData } = body

    // Validate
    if (!initData?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }
    if (isNaN(amount) || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid bet amount' }), { status: 400 })
    }
    if (target < 1 || target > 99) {
      return new Response(JSON.stringify({ error: 'Target must be 1-99' }), { status: 400 })
    }
    if (direction !== 'under' && direction !== 'over') {
      return new Response(JSON.stringify({ error: 'Direction must be under or over' }), { status: 400 })
    }

    const userId = initData.user.id
    await ensureUser(userId, initData.user.username, initData.user.first_name)

    // Check balance
    const bal = await getBalance(userId)
    if (Number(bal.balance_evm) < amount) {
      return new Response(JSON.stringify({ error: 'Insufficient balance' }), { status: 400 })
    }

    // Get/rotate seed
    let seed = await getActiveSeed()
    if (!seed || seed.current_nonce >= seed.max_nonce) {
      const newSeed = generateSeed()
      const newHash = hashSeed(newSeed)
      seed = await createServerSeed(newSeed, newHash)
    }

    // Auto client seed
    const clientSeed = generateSeed()

    // Play
    const result = playDice({
      serverSeed: seed.seed,
      clientSeed,
      nonce: seed.current_nonce,
      target,
      direction,
      betAmount: amount,
    })

    // Record bet
    await recordBet({
      userId,
      game: 'dice',
      chain: 'evm',
      betAmount: amount,
      payout: result.payout,
      outcome: { roll: result.roll, target, direction },
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
        roll: result.roll,
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
    console.error('Dice error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 })
  }
}
