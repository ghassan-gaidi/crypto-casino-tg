"use strict";
const crypto = require("node:crypto");
const { computeResult } = require("../provably-fair");

/**
 * Mines Game — Provably Fair
 * ───────────────────────────
 * 5×5 grid (25 tiles). N mines hidden. Player reveals tiles one by one.
 * Each safe reveal increases the multiplier. Hit a mine = lose.
 *
 * Tile numbering (0–24):
 *   0  1  2  3  4
 *   5  6  7  8  9
 *  10 11 12 13 14
 *  15 16 17 18 19
 *  20 21 22 23 24
 */

const GRID_SIZE = 25;
const HOUSE_EDGE = 0.02;

/**
 * Generate deterministic mine positions from HMAC result.
 * Uses consecutive bytes from the hash to pick tile indices,
 * skipping duplicates until numMines unique positions are found.
 */
function generateMinePositions(serverSeed, clientSeed, nonce, numMines) {
  const hash = computeResult(serverSeed, clientSeed, nonce);
  const mines = new Set();
  let offset = 0;
  while (mines.size < numMines) {
    const pos = hash[offset % hash.length] % GRID_SIZE;
    mines.add(pos);
    offset++;
  }
  return Array.from(mines);
}

/**
 * Calculate payout multiplier for revealing K tiles with N mines.
 * multiplier = (1 - houseEdge) / P_safe
 * P_safe = Π (GRID_SIZE - mines - i) / (GRID_SIZE - i) for i in 0..revealed-1
 */
function minesPayoutMultiplier(numMines, revealCount) {
  let pSafe = 1;
  for (let i = 0; i < revealCount; i++) {
    pSafe *= (GRID_SIZE - numMines - i) / (GRID_SIZE - i);
  }
  const multiplier = (1 - HOUSE_EDGE) / pSafe;
  return Math.round(multiplier * 100) / 100;
}

/**
 * Simulate revealing tiles.
 *
 * @param {Object} params
 * @param {string}  params.serverSeed
 * @param {string}  params.clientSeed
 * @param {number}  params.nonce
 * @param {number}  params.numMines      – how many mines on the board (1–24)
 * @param {number}  params.revealCount   – how many tiles to reveal
 * @returns {{ safe: boolean, multiplier: number, minePositions: number[], resultHash: string }}
 */
function playMines(params) {
  const { serverSeed, clientSeed, nonce, numMines, revealCount } = params;

  if (numMines < 1 || numMines >= GRID_SIZE) throw new Error("numMines must be 1–24");
  if (revealCount < 1 || revealCount > GRID_SIZE - numMines) throw new Error("revealCount must be 1–" + (GRID_SIZE - numMines));

  const minePositions = generateMinePositions(serverSeed, clientSeed, nonce, numMines);
  const mineSet = new Set(minePositions);

  // Reveal tiles 0..revealCount-1; hitting a mine loses
  let hitMine = false;
  for (let tile = 0; tile < revealCount; tile++) {
    if (mineSet.has(tile)) { hitMine = true; break; }
  }
  const allSafe = !hitMine;
  const multiplier = allSafe ? minesPayoutMultiplier(numMines, revealCount) : 0;

  // Result hash
  const hash = computeResult(serverSeed, clientSeed, nonce);

  return {
    safe: allSafe,
    multiplier,
    minePositions,
    resultHash: hash.toString("hex"),
  };
}

/**
 * Determine if a specific tile is a mine.
 */
function isMine(serverSeed, clientSeed, nonce, numMines, tileIndex) {
  const positions = generateMinePositions(serverSeed, clientSeed, nonce, numMines);
  return positions.includes(tileIndex);
}

module.exports = { playMines, isMine, minesPayoutMultiplier, generateMinePositions, GRID_SIZE, HOUSE_EDGE };
