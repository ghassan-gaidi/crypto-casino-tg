import { diceRoll, dicePayout, diceOutcome } from '../provably-fair'

interface DiceBetParams {
  serverSeed: string
  clientSeed: string
  nonce: number
  target: number    // 1–99
  direction: 'under' | 'over'
  betAmount: number
}

interface DiceBetResult {
  roll: number
  playerWon: boolean
  payoutMultiplier: number
  payout: number
  resultHash: string
}

export function playDice(params: DiceBetParams): DiceBetResult {
  const { roll, resultHash } = diceRoll(params.serverSeed, params.clientSeed, params.nonce)
  const playerWon = diceOutcome(roll, params.target, params.direction)
  const multiplier = dicePayout(params.target, params.direction)
  const payout = playerWon ? Math.round(params.betAmount * multiplier * 1e8) / 1e8 : 0

  return {
    roll,
    playerWon,
    payoutMultiplier: Math.round(multiplier * 100) / 100,
    payout,
    resultHash,
  }
}
