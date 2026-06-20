"use strict";
const { computeResult } = require("../provably-fair");

/**
 * Crash Game — Provably Fair
 * ───────────────────────────
 * Uses Bustabit-style crash point formula.
 *
 * crashPoint = max(1, 2^32 / (h + 0.01)) * (1 - houseEdge)
 *
 * Where h = first 4 bytes of HMAC-SHA256 as uint32.
 * Gives ~50% crash > 1.96x, ~10% > 10x, ~1% > 100x.
 */

const HOUSE_EDGE = 0.02;

function crashPoint(serverSeed, clientSeed, nonce, roundId) {
  const hmac = require("node:crypto").createHmac("sha256", serverSeed);
  hmac.update(`${clientSeed}:${nonce}:${roundId}`);
  const hash = hmac.digest();
  const h = hash.readUInt32BE(0);
  const crash = Math.max(1.0, (2 ** 32 / (h + 0.01)) * (1 - HOUSE_EDGE));
  return Math.floor(crash * 100) / 100;
}

/**
 * Play a crash game round.
 *
 * @param {Object} params
 * @param {string}  params.serverSeed
 * @param {string}  params.clientSeed
 * @param {number}  params.nonce
 * @param {number}  params.roundId       – incrementing round ID
 * @param {number}  params.betAmount     – in ETH (or native token units)
 * @param {number}  params.autoCashout   – player's chosen multiplier (e.g. 2.0 = 2x)
 * @returns {{ crashPoint, playerWon, payoutMultiplier, payout, resultHash }}
 */
function playCrash(params) {
  const { serverSeed, clientSeed, nonce, roundId, betAmount, autoCashout } = params;
  const point = crashPoint(serverSeed, clientSeed, nonce, roundId);

  // Calculate the HMAC hash for the resultHash
  const hmac = require("node:crypto").createHmac("sha256", serverSeed);
  hmac.update(`${clientSeed}:${nonce}:${roundId}`);
  const hash = hmac.digest();

  const playerWon = autoCashout < point;
  const payoutMultiplier = playerWon ? autoCashout : 0;
  const payout = playerWon
    ? Math.round(betAmount * autoCashout * 1e8) / 1e8
    : 0;

  return {
    crashPoint: point,
    playerWon,
    payoutMultiplier: Math.round(payoutMultiplier * 100) / 100,
    payout,
    resultHash: hash.toString("hex"),
  };
}

module.exports = { playCrash, crashPoint, HOUSE_EDGE };
