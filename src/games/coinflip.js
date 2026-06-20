"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playCoinflip = playCoinflip;
const provably_fair_1 = require("../provably-fair");
function playCoinflip(params) {
    const { result, resultHash } = (0, provably_fair_1.coinflipResult)(params.serverSeed, params.clientSeed, params.nonce);
    const playerWon = result === params.pick;
    const multiplier = (0, provably_fair_1.coinflipPayout)();
    const payout = playerWon ? Math.round(params.betAmount * multiplier * 1e8) / 1e8 : 0;
    return {
        result,
        playerWon,
        payoutMultiplier: multiplier,
        payout,
        resultHash,
    };
}
