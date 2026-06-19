import { getBalance, ensureUser } from '../src/supabase'

export default async function handler(req: Request) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const url = new URL(req.url)
    const userId = Number(url.searchParams.get('userId'))
    const username = url.searchParams.get('username') || undefined
    const firstName = url.searchParams.get('firstName') || undefined

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId required' }), { status: 400 })
    }

    await ensureUser(userId, username, firstName)
    const bal = await getBalance(userId)

    return new Response(
      JSON.stringify({
        balance: Number(bal.balance).toFixed(8),
        evm: Number(bal.balance_evm).toFixed(8),
        sol: Number(bal.balance_sol).toFixed(8),
        ton: Number(bal.balance_ton).toFixed(8),
      }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('Balance error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 })
  }
}
