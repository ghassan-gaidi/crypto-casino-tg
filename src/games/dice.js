"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playDice = playDice;
const provably_fair_1 = require("../provably-fair");
function playDice(params) {
    const { roll, resultHash } = (0, provably_fair_1.diceRoll)(params.serverSeed, params.clientSeed, params.nonce);
    const playerWon = (0, provably_fair_1.diceOutcome)(roll, params.target, params.direction);
    const multiplier = (0, provably_fair_1.dicePayout)(params.target, params.direction);
    const payout = playerWon ? Math.round(params.betAmount * multiplier * 1e8) / 1e8 : 0;
    return {
        roll,
        playerWon,
        payoutMultiplier: Math.round(multiplier * 100) / 100,
        payout,
        resultHash,
    };
}
