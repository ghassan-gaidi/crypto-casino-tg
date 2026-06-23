"use strict";
// ── Shared API handler for all Mini App game bets ──
const {
  ensureUser, getBalance, updateBalance, recordBet,
  getActiveSeed, createServerSeed, incrementSeedNonce,
  getOrCreateJackpotRound, enterJackpotRound,
  getLeaderboard, getUserStats, getRecentBets, getPlatformStats,
  getReferralStats, getReferrer, trackReferral,
} = require("../src/supabase");
const { generateSeed, hashSeed } = require("../src/provably-fair");
const { validateTelegramInitData } = require("../src/supabase");
const { playDice } = require("../src/games/dice");
const { playCoinflip } = require("../src/games/coinflip");
const { playCrash } = require("../src/games/crash");
const { playMines, isMine, minesPayoutMultiplier, generateMinePositions, GRID_SIZE } = require("../src/games/mines");
const { playPlinko } = require("../src/games/plinko");
const { playSlots } = require("../src/games/slots");
const { playRoulette } = require("../src/games/roulette");
const { playLimbo } = require("../src/games/limbo");
const { rateLimit, getClientIp } = require("../src/rate-limit");

function parseInitData(initData) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  // If it's a string, validate HMAC (proper Mini App flow)
  if (typeof initData === 'string') {
    return validateTelegramInitData(initData, botToken);
  }
  // Fallback: accept object (initDataUnsafe) — validates via auth_date check only
  if (!initData || typeof initData !== 'object') return null;
  const user = initData.user;
  if (!user || !user.id) return null;
  return { id: user.id, username: user.username, first_name: user.first_name };
}

async function getOrCreateSeed(userId) {
  let seed = await getActiveSeed(userId);
  if (!seed) {
    const newSeed = generateSeed();
    const hashed = hashSeed(newSeed);
    seed = await createServerSeed(userId, newSeed, hashed);
    if (!seed) throw new Error('Failed to create seed');
    seed.seed = newSeed;
  }
  return seed;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ── Rate limit: general per IP ──
  const ip = getClientIp(req);
  if (!rateLimit(res, `g:${ip}`, 60, 60_000)) return;

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    const path = req.url.split('?')[0].replace(/\/+$/, '');
    const game = path.replace('/api/', '');

    // ── GET /api/balance ──
    if (game === 'balance') {
      if (req.method !== 'GET') { res.status(405).json({ error: 'GET required' }); return; }
      const urlParams = new URL(req.url, 'http://localhost').searchParams;
      const userId = parseInt(req.headers['x-user-id'] || urlParams.get('userId'));
      if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
      const bal = await getBalance(userId);
      const { getUserDeposits, getUserWithdrawals } = require('../src/supabase');
      const deposits = await getUserDeposits(userId, 10);
      const withdrawals = await getUserWithdrawals(userId, 10);
      res.json({
        evm: bal.balance_evm,
        sol: bal.balance_sol,
        ton: bal.balance_ton,
        balance: bal.balance,
        deposits,
        withdrawals,
      });
      return;
    }

    // ── GET /api/leaderboard ──
    if (game === 'leaderboard') {
      if (req.method !== 'GET') { res.status(405).json({ error: 'GET required' }); return; }
      const leaderboard = await getLeaderboard(20);
      return res.json({ leaderboard });
    }

    // ── GET /api/history ──
    if (game === 'history') {
      if (req.method !== 'GET') { res.status(405).json({ error: 'GET required' }); return; }
      const urlParamsH = new URL(req.url, 'http://localhost').searchParams;
      const userId = parseInt(req.headers['x-user-id'] || urlParamsH.get('userId'));
      if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
      const stats = await getUserStats(userId);
      const bets = await getRecentBets(userId, 20);
      return res.json({ stats, bets });
    }

    // ── GET /api/refs ──
    if (game === 'refs') {
      if (req.method !== 'GET') { res.status(405).json({ error: 'GET required' }); return; }
      const urlParamsR = new URL(req.url, 'http://localhost').searchParams;
      const userId = parseInt(req.headers['x-user-id'] || urlParamsR.get('userId'));
      if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
      const refStats = await getReferralStats(userId);
      const referrer = await getReferrer(userId);
      return res.json({ ...refStats, referrer });
    }

    // ── GET /api/stats ──
    if (game === 'stats') {
      if (req.method !== 'GET') { res.status(405).json({ error: 'GET required' }); return; }
      const stats = await getPlatformStats();
      return res.json(stats);
    }

    if (req.method !== 'POST') { res.status(405).json({ error: 'POST required' }); return; }

    const body = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', c => data += c);
      req.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(new Error('Invalid JSON')); } });
      req.on('error', reject);
    });

    const userInfo = parseInitData(body.initData);
    if (!userInfo) { res.status(401).json({ error: 'Invalid initData' }); return; }
    const userId = userInfo.id;
    await ensureUser(userId, userInfo.username, userInfo.first_name);

    // ── Rate limit: game plays per user (10/min) ──
    if (!rateLimit(res, `gp:${userId}`, 10, 60_000)) return;

    const balance = await getBalance(userId);
    const amount = parseFloat(body.amount);
    if (!amount || amount <= 0) { res.status(400).json({ error: 'Invalid amount' }); return; }
    if (amount > Number(balance.balance_evm || 0)) { res.status(400).json({ error: 'Insufficient balance' }); return; }

    let seed = await getOrCreateSeed(userId);
    let clientSeed;

    try {
      let result;
      switch (game) {
        // ── DICE ──
        case 'dice': {
          const direction = body.direction || 'under';
          const target = parseInt(body.target) || 50;
          if (target < 1 || target > 99) { res.status(400).json({ error: 'Target must be 1-99' }); return; }
          clientSeed = generateSeed();
          result = playDice({ serverSeed: seed.seed, clientSeed, nonce: seed.current_nonce, target, direction, betAmount: amount });
          await recordBet({ userId, game: 'dice', chain: 'evm', betAmount: amount, payout: result.payout, outcome: { roll: result.roll, target, direction }, serverSeed: seed.seed, clientSeed, nonce: seed.current_nonce, resultHash: result.resultHash, playerWon: result.playerWon });
          const delta = result.payout - amount;
          await updateBalance(userId, 'evm', delta);
          await incrementSeedNonce(seed.id);
          res.json({ roll: result.roll, playerWon: result.playerWon, payout: result.payout, payoutMultiplier: result.payoutMultiplier, resultHash: result.resultHash, nonce: seed.current_nonce, clientSeed });
          break;
        }
        // ── COINFLIP ──
        case 'coinflip': {
          const pick = body.pick || 'heads';
          if (!['heads', 'tails'].includes(pick)) { res.status(400).json({ error: 'Pick must be heads or tails' }); return; }
          clientSeed = generateSeed();
          result = playCoinflip({ serverSeed: seed.seed, clientSeed, nonce: seed.current_nonce, pick, betAmount: amount });
          await recordBet({ userId, game: 'coinflip', chain: 'evm', betAmount: amount, payout: result.payout, outcome: { result: result.result, pick }, serverSeed: seed.seed, clientSeed, nonce: seed.current_nonce, resultHash: result.resultHash, playerWon: result.playerWon });
          await incrementSeedNonce(seed.id);
          res.json({ result: result.result, playerWon: result.playerWon, payout: result.payout, payoutMultiplier: result.payoutMultiplier, resultHash: result.resultHash, nonce: seed.current_nonce, clientSeed });
          break;
        }
        // ── CRASH ──
        case 'crash': {
          const autoCashout = parseFloat(body.autoCashoutMultiplier || body.autoCashout || '2');
          if (autoCashout < 1.01 || autoCashout > 100) { res.status(400).json({ error: 'Auto cashout must be 1.01-100' }); return; }
          clientSeed = generateSeed();
          result = playCrash({ serverSeed: seed.seed, clientSeed, nonce: seed.current_nonce, roundId: seed.current_nonce, betAmount: amount, autoCashout });
          await recordBet({ userId, game: 'crash', chain: 'evm', betAmount: amount, payout: result.payout, outcome: { crashPoint: result.crashPoint, autoCashout }, serverSeed: seed.seed, clientSeed, nonce: seed.current_nonce, resultHash: result.resultHash, playerWon: result.playerWon });
          const deltaCrash = result.payout - amount;
          await updateBalance(userId, 'evm', deltaCrash);
          await incrementSeedNonce(seed.id);
          res.json({ crashPoint: result.crashPoint, playerWon: result.playerWon, payout: result.payout, payoutMultiplier: result.payoutMultiplier, resultHash: result.resultHash, nonce: seed.current_nonce, clientSeed });
          break;
        }
        // ── MINES (one-shot: reveal N tiles deterministically) ──
        case 'mines': {
          const numMines = parseInt(body.numMines || '3');
          const action = body.action || 'bet';
          if (numMines < 1 || numMines > 24) { res.status(400).json({ error: 'Mines must be 1-24' }); return; }

          if (action === 'bet') {
            // One-shot play: reveal N tiles (revealCount) or all tiles
            const revealCount = parseInt(body.revealCount || '1');
            if (revealCount < 1 || revealCount > GRID_SIZE - numMines) { res.status(400).json({ error: `Reveal count must be 1-${GRID_SIZE - numMines}` }); return; }
            clientSeed = generateSeed();
            result = playMines({ serverSeed: seed.seed, clientSeed, nonce: seed.current_nonce, numMines, revealCount });
            const payout = result.safe ? Math.round(amount * result.multiplier * 1e8) / 1e8 : 0;
            await recordBet({ userId, game: 'mines', chain: 'evm', betAmount: amount, payout, outcome: { safe: result.safe, numMines, revealCount, mines: result.minePositions }, serverSeed: seed.seed, clientSeed, nonce: seed.current_nonce, resultHash: result.resultHash, playerWon: result.safe });
            const deltaM = payout - amount;
            await updateBalance(userId, 'evm', deltaM);
            await incrementSeedNonce(seed.id);
            res.json({ safe: result.safe, payout, multiplier: result.multiplier, minePositions: result.minePositions, revealCount, numMines, resultHash: result.resultHash, nonce: seed.current_nonce, clientSeed });
          } else if (action === 'reveal') {
            // Stateless reveal: check if tileIndex is a mine
            const tileIndex = parseInt(body.tileIndex);
            if (isNaN(tileIndex) || tileIndex < 0 || tileIndex >= GRID_SIZE) { res.status(400).json({ error: 'Invalid tile index' }); return; }
            clientSeed = body.clientSeed || generateSeed();
            const hitMine = isMine(seed.seed, clientSeed, seed.current_nonce, numMines, tileIndex);
            const safe = !hitMine;
            // Calculate current multiplier for (revealedSoFar + 1) safe tiles
            const revealedSoFar = parseInt(body.revealedSoFar || '0');
            const multiplier = safe ? minesPayoutMultiplier(numMines, revealedSoFar + 1) : 0;
            res.json({ safe, tileIndex, multiplier, numMines, resultHash: '', nonce: seed.current_nonce, clientSeed });
          } else if (action === 'cashout') {
            // Cash out: calculate payout for revealed safe tiles
            const revealedSoFar = parseInt(body.revealedSoFar || '1');
            if (revealedSoFar < 1) { res.status(400).json({ error: 'Reveal at least 1 tile' }); return; }
            const multiplier = minesPayoutMultiplier(numMines, revealedSoFar);
            const payout = Math.round(amount * multiplier * 1e8) / 1e8;
            clientSeed = body.clientSeed || generateSeed();
            const finalNonce = seed.current_nonce;
            const hHash = require("../src/provably-fair").computeResult(seed.seed, clientSeed, finalNonce);
            const allMinePositions = generateMinePositions(seed.seed, clientSeed, finalNonce, numMines);
            const hResultHash = hHash.toString('hex');
            await recordBet({ userId, game: 'mines', chain: 'evm', betAmount: amount, payout, outcome: { safe: true, numMines, revealCount: revealedSoFar, mines: allMinePositions }, serverSeed: seed.seed, clientSeed, nonce: finalNonce, resultHash: hResultHash, playerWon: true });
            await updateBalance(userId, 'evm', payout - amount);
            await incrementSeedNonce(seed.id);
            res.json({ safe: true, payout, multiplier, minePositions: allMinePositions, revealCount: revealedSoFar, numMines, resultHash: hResultHash, nonce: finalNonce, clientSeed });
          } else {
            res.status(400).json({ error: 'Unknown action' });
          }
          break;
        }
        // ── PLINKO ──
        case 'plinko': {
          const rows = parseInt(body.rows) || 8;
          const risk = body.risk || 'low';
          if (![8, 12, 16].includes(rows)) { res.status(400).json({ error: 'Rows must be 8, 12, or 16' }); return; }
          const normalizedRisk = risk === 'medium' ? 'med' : risk;
          if (!['low', 'med', 'high'].includes(normalizedRisk)) { res.status(400).json({ error: 'Risk must be low, medium, or high' }); return; }
          clientSeed = generateSeed();
          result = playPlinko({ serverSeed: seed.seed, clientSeed, nonce: seed.current_nonce, rows, risk: normalizedRisk, betAmount: amount });
          await recordBet({ userId, game: 'plinko', chain: 'evm', betAmount: amount, payout: result.payout, outcome: { slot: result.slot, rows, risk, multiplier: result.multiplier }, serverSeed: seed.seed, clientSeed, nonce: seed.current_nonce, resultHash: result.resultHash, playerWon: result.playerWon });
          const deltaP = result.payout - amount;
          await updateBalance(userId, 'evm', deltaP);
          await incrementSeedNonce(seed.id);
          res.json({ slot: result.slot, rows, risk, multiplier: result.multiplier, playerWon: result.playerWon, payout: result.payout, resultHash: result.resultHash, nonce: seed.current_nonce, clientSeed });
          break;
        }
        // ── SLOTS ──
        case 'slots': {
          clientSeed = generateSeed();
          result = playSlots({ serverSeed: seed.seed, clientSeed, nonce: seed.current_nonce, betAmount: amount });
          await recordBet({ userId, game: 'slots', chain: 'evm', betAmount: amount, payout: result.payout, outcome: { reels: result.reels, combo: result.combo }, serverSeed: seed.seed, clientSeed, nonce: seed.current_nonce, resultHash: result.resultHash, playerWon: result.playerWon });
          const deltaS = result.payout - amount;
          await updateBalance(userId, 'evm', deltaS);
          await incrementSeedNonce(seed.id);
          res.json({ reels: result.reels, combo: result.combo, playerWon: result.playerWon, payout: result.payout, payoutMultiplier: result.payoutMultiplier, resultHash: result.resultHash, nonce: seed.current_nonce, clientSeed });
          break;
        }
        // ── ROULETTE ──
        case 'roulette': {
          const betType = body.betType || body.type || 'number';
          let betValue;
          if (betType === 'number') betValue = body.number !== undefined ? body.number : body.bet || 17;
          else if (betType === 'color') betValue = body.color || body.bet || 'red';
          else if (betType === 'section') betValue = body.section || body.bet || '1-12';
          else { res.status(400).json({ error: 'Invalid bet type' }); return; }
          clientSeed = generateSeed();
          result = playRoulette({ serverSeed: seed.seed, clientSeed, nonce: seed.current_nonce, betType, betValue, betAmount: amount });
          await recordBet({ userId, game: 'roulette', chain: 'evm', betAmount: amount, payout: result.payout, outcome: { spin: result.spin, betType, betValue }, serverSeed: seed.seed, clientSeed, nonce: seed.current_nonce, resultHash: result.resultHash, playerWon: result.playerWon });
          const deltaR = result.payout - amount;
          await updateBalance(userId, 'evm', deltaR);
          await incrementSeedNonce(seed.id);
          res.json({ spin: result.spin, playerWon: result.playerWon, payout: result.payout, payoutMultiplier: result.payoutMultiplier, resultHash: result.resultHash, nonce: seed.current_nonce, clientSeed });
          break;
        }
        // ── LIMBO ──
        case 'limbo': {
          const target = parseFloat(body.targetMultiplier || body.target || '2');
          if (target < 1.01 || target > 10000) { res.status(400).json({ error: 'Target must be 1.01-10000' }); return; }
          clientSeed = generateSeed();
          result = playLimbo({ serverSeed: seed.seed, clientSeed, nonce: seed.current_nonce, target, betAmount: amount });
          await recordBet({ userId, game: 'limbo', chain: 'evm', betAmount: amount, payout: result.payout, outcome: { crashPoint: result.crashPoint, target }, serverSeed: seed.seed, clientSeed, nonce: seed.current_nonce, resultHash: result.resultHash, playerWon: result.playerWon });
          const deltaL = result.payout - amount;
          await updateBalance(userId, 'evm', deltaL);
          await incrementSeedNonce(seed.id);
          res.json({ crashPoint: result.crashPoint, playerWon: result.playerWon, payout: result.payout, payoutMultiplier: result.payoutMultiplier, resultHash: result.resultHash, nonce: seed.current_nonce, clientSeed });
          break;
        }
        // ── JACKPOT ──
        case 'jackpot': {
          const action = body.action || 'status';
          if (action === 'enter') {
            const round = await enterJackpotRound(userId, amount, 'evm');
            await updateBalance(userId, 'evm', -amount);
            res.json({ success: true, round_id: round.round_id, prize_pool: round.prize_pool, entries: round.entries });
          } else {
            const round = await getOrCreateJackpotRound();
            res.json({ round_id: round.id, prize_pool: round.prize_pool, entry_count: round.entry_count, status: round.status });
          }
          break;
        }
        default:
          res.status(404).json({ error: `Unknown game: ${game}` });
      }
    } catch (e) {
      console.error(`Game ${game} error:`, e.message);
      res.status(500).json({ error: e.message });
    }
  } catch (e) {
    console.error('API handler error:', e);
    res.status(500).json({ error: e.message });
  }
};
