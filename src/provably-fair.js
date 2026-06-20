"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSeed = generateSeed;
exports.hashSeed = hashSeed;
exports.computeResult = computeResult;
exports.bytesToFloat = bytesToFloat;
exports.diceRoll = diceRoll;
exports.coinflipResult = coinflipResult;
exports.verifyDiceRoll = verifyDiceRoll;
exports.verifyCoinflip = verifyCoinflip;
exports.dicePayout = dicePayout;
exports.coinflipPayout = coinflipPayout;
exports.diceOutcome = diceOutcome;
const node_crypto_1 = __importDefault(require("node:crypto"));
/**
 * Provably Fair System
 * ─────────────────────
 * Standard crypto casino provably fair:
 * 1. Server generates a seed, publishes SHA-256(seed) (the "commit")
 * 2. Client provides their own seed (or auto-generated)
 * 3. Each bet increments a nonce (starting at 0)
 * 4. Result = HMAC-SHA256(serverSeed, `${clientSeed}:${nonce}`)
 * 5. Result bytes are converted to a float [0, 1) or a number
 * 6. After the seed is retired, the server reveals the original seed
 *    so players can verify against the published hash
 */
function generateSeed() {
    return node_crypto_1.default.randomBytes(32).toString('hex');
}
function hashSeed(seed) {
    return node_crypto_1.default.createHash('sha256').update(seed).digest('hex');
}
function computeResult(serverSeed, clientSeed, nonce) {
    const hmac = node_crypto_1.default.createHmac('sha256', serverSeed);
    hmac.update(`${clientSeed}:${nonce}`);
    return hmac.digest();
}
/**
 * Convert HMAC bytes to a float in [0, 1).
 * Uses the first 8 bytes as a 64-bit big-endian integer divided by 2^64.
 */
function bytesToFloat(bytes) {
    const hex = bytes.subarray(0, 8).toString('hex');
    const int = BigInt(`0x${hex}`);
    return Number(int) / Number(BigInt(2) ** BigInt(64));
}
/**
 * Dice roll: map float to a roll between 0.00 and 100.00 (2 decimal places)
 * Classic crypto dice: roll < threshold means player wins (under), roll > threshold means over
 */
function diceRoll(serverSeed, clientSeed, nonce) {
    const bytes = computeResult(serverSeed, clientSeed, nonce);
    const float = bytesToFloat(bytes);
    const roll = Math.round(float * 10001) / 100; // 0.00 – 100.00
    return {
        roll: Math.min(roll, 100.00),
        resultHash: bytes.toString('hex'),
    };
}
/**
 * Coinflip: 0 = heads, 1 = tails
 */
function coinflipResult(serverSeed, clientSeed, nonce) {
    const bytes = computeResult(serverSeed, clientSeed, nonce);
    const result = bytes[0] % 2 === 0 ? 'heads' : 'tails';
    return {
        result,
        resultHash: bytes.toString('hex'),
    };
}
/**
 * Verify a result after the server seed is revealed.
 * Returns the same structure as diceRoll/coinflipResult so the player can compare.
 */
function verifyDiceRoll(serverSeed, clientSeed, nonce) {
    return diceRoll(serverSeed, clientSeed, nonce);
}
function verifyCoinflip(serverSeed, clientSeed, nonce) {
    return coinflipResult(serverSeed, clientSeed, nonce);
}
// ── Payout calculations ──
/**
 * Dice: payout multiplier based on target & direction.
 * House edge: 2%
 *
 * UNDER X: payout = (99 / X) * (1 - edge)
 * OVER X:  payout = (99 / (100 - X)) * (1 - edge)
 */
function dicePayout(target, direction) {
    const edge = 0.02;
    const divisor = direction === 'under' ? target : 100 - target;
    if (divisor <= 0)
        return 0;
    return (99 / divisor) * (1 - edge);
}
/**
 * Coinflip: 2x multiplier (minus house edge) = 1.96x
 */
function coinflipPayout() {
    return 2 * (1 - 0.02);
}
/**
 * Check dice bet outcome
 */
function diceOutcome(roll, target, direction) {
    return direction === 'under' ? roll < target : roll > target;
}
