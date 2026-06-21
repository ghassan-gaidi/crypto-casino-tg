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
exports.plinkoResult = plinkoResult;
exports.plinkoPayoutMultiplier = plinkoPayoutMultiplier;
exports.slotsResult = slotsResult;
exports.slotsPayout = slotsPayout;
exports.rouletteResult = rouletteResult;
exports.roulettePayoutMultiplier = roulettePayoutMultiplier;
exports.limboResult = limboResult;
exports.limboPayoutMultiplier = limboPayoutMultiplier;
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
 */
function diceRoll(serverSeed, clientSeed, nonce) {
    const bytes = computeResult(serverSeed, clientSeed, nonce);
    const float = bytesToFloat(bytes);
    const roll = Math.round(float * 10001) / 100;
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
function verifyDiceRoll(serverSeed, clientSeed, nonce) {
    return diceRoll(serverSeed, clientSeed, nonce);
}
function verifyCoinflip(serverSeed, clientSeed, nonce) {
    return coinflipResult(serverSeed, clientSeed, nonce);
}
// ── Payout calculations ──
function dicePayout(target, direction) {
    const edge = 0.02;
    const divisor = direction === 'under' ? target : 100 - target;
    if (divisor <= 0) return 0;
    return (99 / divisor) * (1 - edge);
}
function coinflipPayout() {
    return 2 * (1 - 0.02);
}
function diceOutcome(roll, target, direction) {
    return direction === 'under' ? roll < target : roll > target;
}

// ════════════════════════════════════════════════════════════════════
// Plinko
// ════════════════════════════════════════════════════════════════════

/**
 * Plinko: determine each pin bounce direction from HMAC bytes.
 * Rows of pins — the ball bounces left or right at each row.
 * Final slot index = sum of 0/1 decisions mod 2 at each row, then collapsed to a bucket.
 * Risk levels adjust payout table variance.
 */
const PLINKO_PAYOUTS = {
  low:   [ 16,   9,    2,   1.4,  1.2,  1.1,  1,   0.5,  1,   1.1,  1.2,  1.4,  2,    9,   16   ],
  medium: [ 110, 41,  10,   5,    3,    1.5,  1,   0.3,  1,   1.5,  3,    5,   10,   41,  110  ],
  high:   [ 1000, 130, 26,   9,    4,    2,    0.2, 0.2,  0.2, 2,    4,    9,   26,   130, 1000 ],
};

function plinkoResult(serverSeed, clientSeed, nonce, rows, risk) {
  const hash = computeResult(serverSeed, clientSeed, nonce);
  const payouts = PLINKO_PAYOUTS[risk] || PLINKO_PAYOUTS.medium;
  const buckets = payouts.length;

  // Each byte of hash determines a pin direction (0 = left, 1 = right)
  let position = 0;
  for (let row = 0; row < rows; row++) {
    const bit = (hash[row % hash.length] >> (row % 8)) & 1;
    position = (position + bit) % buckets;
  }

  const multiplier = payouts[position];
  return {
    slot: position,
    multiplier,
    resultHash: hash.toString('hex'),
    rows,
    risk,
  };
}

function plinkoPayoutMultiplier(risk, slot) {
  const payouts = PLINKO_PAYOUTS[risk] || PLINKO_PAYOUTS.medium;
  return payouts[slot] || 1;
}

// ════════════════════════════════════════════════════════════════════
// Slots (3-reel classic)
// ════════════════════════════════════════════════════════════════════

const SLOTS_SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '🔔', '💎', '⭐', '7️⃣'];
const SLOTS_PAYOUTS = {
  '🍒🍒🍒': 5, '🍋🍋🍋': 8, '🍊🍊🍊': 10, '🍇🍇🍇': 15,
  '🔔🔔🔔': 20, '💎💎💎': 50, '⭐⭐⭐': 100, '7️⃣7️⃣7️⃣': 250,
};

function slotsResult(serverSeed, clientSeed, nonce) {
  const hash = computeResult(serverSeed, clientSeed, nonce);
  const reels = [];
  const symbols = SLOTS_SYMBOLS;

  for (let i = 0; i < 3; i++) {
    const idx = hash[i % hash.length] % symbols.length;
    reels.push(symbols[idx]);
  }

  const combo = reels.join('');
  const baseMultiplier = SLOTS_PAYOUTS[combo] || 0;

  // Partial matches (2 of a kind on first two reels)
  let partialMultiplier = 0;
  if (reels[0] === reels[1] && reels[0] !== reels[2]) {
    partialMultiplier = 1; // 1x back
  }

  const multiplier = Math.max(baseMultiplier, partialMultiplier);

  return {
    reels,
    combo,
    multiplier,
    resultHash: hash.toString('hex'),
  };
}

function slotsPayout(reels) {
  const combo = reels.join('');
  return SLOTS_PAYOUTS[combo] || 0;
}

// ════════════════════════════════════════════════════════════════════
// Roulette (European: 0-36)
// ════════════════════════════════════════════════════════════════════

const ROULETTE_NUMBERS = Array.from({ length: 37 }, (_, i) => i);

function rouletteResult(serverSeed, clientSeed, nonce) {
  const hash = computeResult(serverSeed, clientSeed, nonce);
  const number = hash.readUInt16BE(0) % 37;
  const color = number === 0 ? 'green'
    : ([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(number) ? 'red' : 'black');
  return {
    number,
    color,
    resultHash: hash.toString('hex'),
  };
}

function roulettePayoutMultiplier(betType, betValue, result) {
  // betType: 'number', 'color', 'odd_even', 'high_low', 'dozen', 'column'
  const { number, color } = result;
  switch (betType) {
    case 'number':
      return betValue === number ? 35 : 0;
    case 'color':
      return color === betValue ? 2 * (1 - 0.02) : 0; // ~1.96x
    case 'odd_even': {
      if (number === 0) return 0;
      const isOdd = number % 2 === 1;
      const betIsOdd = betValue === 'odd';
      return isOdd === betIsOdd ? 2 * (1 - 0.02) : 0;
    }
    case 'high_low': {
      if (number === 0) return 0;
      const isLow = number >= 1 && number <= 18;
      const betIsLow = betValue === 'low';
      return isLow === betIsLow ? 2 * (1 - 0.02) : 0;
    }
    case 'dozen': {
      if (number === 0) return 0;
      const dozen = Math.ceil(number / 12);
      return dozen === betValue ? 3 * (1 - 0.02) : 0; // ~2.94x
    }
    case 'column': {
      if (number === 0) return 0;
      const col = ((number - 1) % 3) + 1;
      return col === betValue ? 3 * (1 - 0.02) : 0;
    }
    default:
      return 0;
  }
}

// ════════════════════════════════════════════════════════════════════
// Limbo
// ════════════════════════════════════════════════════════════════════

/**
 * Limbo: similar to crash but simpler.
 * A multiplier flies up (starts at 1x). The player bets on how high it'll go.
 * Player wins if the actual multiplier >= their target.
 *
 * Formula: multiplier = Math.floor((2^32 / (h + 0.01)) * (1 - houseEdge) * 100) / 100
 * Where h = first 4 bytes of HMAC as uint32.
 * Same as Bustabit crash formula.
 */
const LIMBO_EDGE = 0.02;

function limboResult(serverSeed, clientSeed, nonce) {
  const hash = computeResult(serverSeed, clientSeed, nonce);
  const h = hash.readUInt32BE(0);
  const multiplier = Math.max(1.0, Math.floor((2 ** 32 / (h + 0.01)) * (1 - LIMBO_EDGE) * 100) / 100);
  return {
    multiplier,
    resultHash: hash.toString('hex'),
  };
}

function limboPayoutMultiplier(targetMultiplier) {
  // Probability of hitting >= target: 1/target (approximately)
  // With house edge: payout = target * (1 - edge)
  return targetMultiplier * (1 - LIMBO_EDGE);
}
