import { coinflipResult, coinflipPayout } from '../provably-fair'

interface CoinflipBetParams {
  serverSeed: string
  clientSeed: string
  nonce: number
  pick: 'heads' | 'tails'
  betAmount: number
}

interface CoinflipBetResult {
  result: 'heads' | 'tails'
  playerWon: boolean
  payoutMultiplier: number
  payout: number
  resultHash: string
}

export function playCoinflip(params: CoinflipBetParams): CoinflipBetResult {
  const { result, resultHash } = coinflipResult(params.serverSeed, params.clientSeed, params.nonce)
  const playerWon = result === params.pick
  const multiplier = coinflipPayout()
  const payout = playerWon ? Math.round(params.betAmount * multiplier * 1e8) / 1e8 : 0

  return {
    result,
    playerWon,
    payoutMultiplier: multiplier,
    payout,
    resultHash,
  }
}
