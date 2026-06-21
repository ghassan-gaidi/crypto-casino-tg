"use strict";
const { rouletteResult, roulettePayoutMultiplier } = require("../provably-fair");

/**
 * Roulette Game — Provably Fair (European: 0–36)
 * ───────────────────────────────────────────────
 * Wraps the provably-fair rouletteResult and roulettePayoutMultiplier
 * into a playable round.
 *
 * @param {Object} params
 * @param {string}  params.serverSeed
 * @param {string}  params.clientSeed
 * @param {number}  params.nonce
 * @param {string}  params.betType   – 'number', 'color', 'odd_even', 'high_low', 'dozen', 'column'
 * @param {number|string} params.betValue – e.g. 17, 'red', 'odd', 'low', 1 (for dozen 1-3), 2 (for column 1-3)
 * @param {number}  params.betAmount – in ETH (or native token units)
 * @returns {{ number: number, color: string, playerWon: boolean, payoutMultiplier: number, payout: number, resultHash: string }}
 */
function playRoulette(params) {
  const result = rouletteResult(params.serverSeed, params.clientSeed, params.nonce);
  const multiplier = roulettePayoutMultiplier(params.betType, params.betValue, result);
  const playerWon = multiplier > 0;
  const payout = playerWon
    ? Math.round(params.betAmount * multiplier * 1e8) / 1e8
    : 0;

  return {
    number: result.number,
    color: result.color,
    playerWon,
    payoutMultiplier: multiplier,
    payout,
    resultHash: result.resultHash,
  };
}

module.exports = { playRoulette };
