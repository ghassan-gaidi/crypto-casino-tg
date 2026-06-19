import { getActiveSeed } from '../src/supabase'

export default async function handler(req: Request) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const seed = await getActiveSeed()
    if (!seed) {
      return new Response(JSON.stringify({ seedHash: null, nonce: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        seedHash: seed.seed_hash,
        nonce: seed.current_nonce,
        maxNonce: seed.max_nonce,
        status: seed.status,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('Seed error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 })
  }
}
