/**
 * Shared rate limit error handler for all game components.
 * Returns a rate limit banner component if the error is a 429, or null.
 */

interface RateLimitInfo {
  error: string
  retryAfterMs: number
  retryAfterSeconds: number
}

export function isRateLimited(data: any): data is RateLimitInfo {
  return data?.error === 'Too many requests' && typeof data?.retryAfterSeconds === 'number'
}

export function RateLimitBanner({ data }: { data: RateLimitInfo }) {
  return (
    <div style={{
      border: '1px solid var(--red)',
      background: 'rgba(255,0,0,0.05)',
      padding: '10px 14px',
      marginTop: 12,
      fontSize: 12,
      fontFamily: 'var(--font)',
      color: 'var(--red)',
    }}>
      <div style={{ fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>
        ◼ RATE LIMITED
      </div>
      <div style={{ color: 'var(--text)', fontSize: 11 }}>
        Too many requests. Wait {data.retryAfterSeconds}s before trying again.
      </div>
    </div>
  )
}
