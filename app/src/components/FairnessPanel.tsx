/* ═══════════════════════════════════════════════════════════════
   FairnessPanel — Provably fair verification UI
   Shows seed hash, nonce, past revealed seeds, verification
   ═══════════════════════════════════════════════════════════════ */

import { useState, useEffect } from 'react'

interface RevealedSeed {
  id: string
  seed_hash: string
  seed: string
  current_nonce: number
  revealed_at: string
}

interface FairnessData {
  seedHash: string | null
  nonce: number
  maxNonce: number
  revealedSeeds: RevealedSeed[]
}

interface Props {
  userId?: number
  gameName: string
}

export default function FairnessPanel({ userId, gameName }: Props) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<FairnessData | null>(null)
  const [loading, setLoading] = useState(false)
  const [rotating, setRotating] = useState(false)
  const [verifyInput, setVerifyInput] = useState({ serverSeed: '', clientSeed: '', nonce: '' })
  const [verifyResult, setVerifyResult] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !userId) return
    setLoading(true)
    fetch(`/api/fairness?userId=${userId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [open, userId])

  const rotateSeed = async () => {
    if (!userId || rotating) return
    setRotating(true)
    try {
      await fetch('/api/fairness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const r = await fetch(`/api/fairness?userId=${userId}`)
      const d = await r.json()
      setData(d)
    } catch {}
    setRotating(false)
  }

  return (
    <div style={{ marginTop: 12 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'none', border: 'none', color: 'var(--cyan)',
          fontFamily: 'var(--font)', fontSize: 10, cursor: 'pointer',
          letterSpacing: 1, padding: '4px 0', opacity: 0.7,
        }}
      >
        {open ? '▼ HIDE' : '▶'} FAIRNESS
      </button>

      {open && (
        <div style={{
          marginTop: 8, padding: 12,
          border: '1px solid var(--border)', background: 'var(--surface)',
        }}>
          {loading ? (
            <div style={{ color: 'var(--text-dim)', fontSize: 11 }}>LOADING...</div>
          ) : data ? (
            <>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1.5, marginBottom: 4 }}>SEED HASH (SHA-256)</div>
                <div style={{
                  fontFamily: 'var(--font)', fontSize: 10, color: 'var(--yellow)',
                  wordBreak: 'break-all', lineHeight: 1.5,
                  padding: '6px 8px', background: 'var(--bg)', border: '1px solid var(--border)',
                }}>
                  {data.seedHash || 'No active seed'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1.5 }}>NONCE</div>
                  <div style={{ fontSize: 14, color: 'var(--white)', fontWeight: 700 }}>{data.nonce} / {data.maxNonce}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1.5 }}>GAME</div>
                  <div style={{ fontSize: 14, color: 'var(--white)', fontWeight: 700 }}>{gameName.toUpperCase()}</div>
                </div>
              </div>

              <button
                onClick={rotateSeed}
                disabled={rotating}
                style={{
                  width: '100%', padding: '8px 0', marginBottom: 12,
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  color: 'var(--cyan)', fontFamily: 'var(--font)',
                  fontSize: 10, letterSpacing: 1, cursor: 'pointer',
                }}
              >
                {rotating ? 'ROTATING...' : 'ROTATE SEED PAIR'}
              </button>

              {data.revealedSeeds.length > 0 && (
                <div>
                  <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1.5, marginBottom: 6 }}>PAST REVEALED SEEDS</div>
                  {data.revealedSeeds.map(s => (
                    <div key={s.id} style={{
                      padding: '6px 8px', marginBottom: 4,
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      fontSize: 10,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--green)' }}>NONCE: {s.current_nonce}</span>
                        <span style={{ color: 'var(--text-dim)' }}>{new Date(s.revealed_at).toLocaleDateString()}</span>
                      </div>
                      <div style={{ color: 'var(--yellow)', wordBreak: 'break-all', marginTop: 4, fontSize: 9 }}>
                        {s.seed}
                      </div>
                      <div style={{ color: 'var(--text-dim)', fontSize: 9, marginTop: 2 }}>
                        HASH: {s.seed_hash.slice(0, 32)}...
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1.5, marginBottom: 8 }}>MANUAL VERIFICATION</div>
                <input
                  className="input"
                  placeholder="Server Seed (revealed)"
                  value={verifyInput.serverSeed}
                  onChange={e => setVerifyInput(p => ({ ...p, serverSeed: e.target.value }))}
                  style={{ width: '100%', boxSizing: 'border-box', marginBottom: 6, fontSize: 10 }}
                />
                <input
                  className="input"
                  placeholder="Client Seed"
                  value={verifyInput.clientSeed}
                  onChange={e => setVerifyInput(p => ({ ...p, clientSeed: e.target.value }))}
                  style={{ width: '100%', boxSizing: 'border-box', marginBottom: 6, fontSize: 10 }}
                />
                <input
                  className="input"
                  placeholder="Nonce"
                  type="number"
                  value={verifyInput.nonce}
                  onChange={e => setVerifyInput(p => ({ ...p, nonce: e.target.value }))}
                  style={{ width: '100%', boxSizing: 'border-box', marginBottom: 6, fontSize: 10 }}
                />
                <button
                  onClick={() => {
                    const serverSeed = verifyInput.serverSeed
                    const clientSeed = verifyInput.clientSeed
                    const nonce = parseInt(verifyInput.nonce)
                    if (!serverSeed || !clientSeed || isNaN(nonce)) {
                      setVerifyResult('Fill in all fields')
                      return
                    }
                    setVerifyResult(`HMAC-SHA256("${serverSeed}", "${clientSeed}:${nonce}") — use a tool like hmac.online to verify`)
                  }}
                  style={{
                    width: '100%', padding: '8px 0',
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    color: 'var(--green)', fontFamily: 'var(--font)',
                    fontSize: 10, letterSpacing: 1, cursor: 'pointer',
                  }}
                >
                  VERIFY
                </button>
                {verifyResult && (
                  <div style={{
                    marginTop: 6, padding: 8, fontSize: 10,
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    color: 'var(--cyan)', wordBreak: 'break-all',
                  }}>
                    {verifyResult}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--text-dim)', fontSize: 11 }}>NO SEED DATA</div>
          )}
        </div>
      )}
    </div>
  )
}
