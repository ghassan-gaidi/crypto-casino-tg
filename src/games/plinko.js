"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playPlinko = playPlinko;
const provably_fair_1 = require("../provably-fair");
function playPlinko(params) {
  const result = provably_fair_1.plinkoResult(params.serverSeed, params.clientSeed, params.nonce, params.rows, params.risk);
  const playerWon = result.multiplier >= 1;
  const payout = playerWon ? Math.round(params.betAmount * result.multiplier * 1e8) / 1e8 : 0;
  return {
    slot: result.slot,
    multiplier: result.multiplier,
    playerWon,
    payout,
    resultHash: result.resultHash,
  };
}
module.exports = { playPlinko };
