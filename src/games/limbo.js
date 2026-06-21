"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playLimbo = playLimbo;
const provably_fair_1 = require("../provably-fair");
/**
 * Limbo — Provably Fair
 * ──────────────────────
 * A multiplier flies up. Player sets a target multiplier.
 * If actual multiplier >= target, player wins at (target * 0.98)x.
 * If actual multiplier < target, player loses.
 */
function playLimbo(params) {
  const result = provably_fair_1.limboResult(params.serverSeed, params.clientSeed, params.nonce);
  const playerWon = result.multiplier >= params.targetMultiplier;
  const payoutMultiplier = playerWon ? provably_fair_1.limboPayoutMultiplier(params.targetMultiplier) : 0;
  const payout = playerWon
    ? Math.round(params.betAmount * payoutMultiplier * 1e8) / 1e8
    : 0;
  return {
    multiplier: result.multiplier,
    targetMultiplier: params.targetMultiplier,
    playerWon,
    payoutMultiplier: Math.round(payoutMultiplier * 100) / 100,
    payout,
    resultHash: result.resultHash,
  };
}
module.exports = { playLimbo };
