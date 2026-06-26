export type GameId = 'dice' | 'coinflip' | 'crash' | 'mines' | 'plinko' | 'slots' | 'roulette' | 'limbo' | 'jackpot'
export type NavIconName = 'home' | 'wallet' | 'history' | 'rank'

interface IconProps {
  size?: number
  className?: string
}

export function GameIcon({ game, size = 24, className = '' }: IconProps & { game: GameId }) {
  switch (game) {
    case 'dice':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="16" cy="8" r="1.5" />
          <circle cx="8" cy="16" r="1.5" />
          <circle cx="16" cy="16" r="1.5" />
        </svg>
      )
    case 'coinflip':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 4v16" />
          <path d="M4 12h16" />
        </svg>
      )
    case 'crash':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 20 10 12 14 16 20 8" />
          <polyline points="14 8 20 8 20 14" />
        </svg>
      )
    case 'mines':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l3 5 5 1-3.5 4 1 5-4.5-2.5L7 19l1-5L4.5 9l5-1z" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      )
    case 'plinko':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 6l12 12" />
          <path d="M14 6l4 4" />
          <circle cx="18" cy="4" r="1.5" />
          <circle cx="8" cy="16" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
        </svg>
      )
    case 'slots':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="4" />
          <line x1="8" y1="8" x2="8" y2="16" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="16" y1="8" x2="16" y2="16" />
        </svg>
      )
    case 'roulette':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="2" />
          <line x1="12" y1="4" x2="12" y2="8" />
          <line x1="12" y1="16" x2="12" y2="20" />
          <line x1="4" y1="12" x2="8" y2="12" />
          <line x1="16" y1="12" x2="20" y2="12" />
        </svg>
      )
    case 'limbo':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 18l6-10 6 6" />
          <path d="M12 8v10" />
        </svg>
      )
    case 'jackpot':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 4l2.5 5.5L21 10l-4 4 1 6-5-3-5 3 1-6-4-4 6.5-0.5L12 4z" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      )
    default:
      return <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8" /></svg>
  }
}

export function NavIcon({ name, size = 20, className = '' }: IconProps & { name: NavIconName }) {
  switch (name) {
    case 'home':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-5H9v5H4a1 1 0 0 1-1-1v-8.5z" />
        </svg>
      )
    case 'wallet':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7h16v10H4z" />
          <path d="M8 7V5a2 2 0 0 1 2-2h8" />
          <circle cx="17" cy="14" r="1" />
        </svg>
      )
    case 'history':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 1 9 9" />
          <path d="M12 7v5l4 2" />
        </svg>
      )
    case 'rank':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
        </svg>
      )
  }
}
