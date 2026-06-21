"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playSlots = playSlots;
const provably_fair_1 = require("../provably-fair");
function playSlots(params) {
  const result = provably_fair_1.slotsResult(params.serverSeed, params.clientSeed, params.nonce);
  const multiplier = result.multiplier;
  const playerWon = multiplier > 0;
  const payout = playerWon ? Math.round(params.betAmount * multiplier * 1e8) / 1e8 : 0;
  return {
    reels: result.reels,
    combo: result.combo,
    playerWon,
    payoutMultiplier: multiplier,
    payout,
    resultHash: result.resultHash,
  };
}
module.exports = { playSlots };
