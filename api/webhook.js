"use strict";

// ── Bootstrap with error capture ──
let handler;
try {
  const { Bot, InlineKeyboard } = require("grammy");
  const {
    ensureUser, getBalance, createWithdrawal, completeWithdrawal,
    updateBalance, recordBet, getActiveSeed, createServerSeed,
    incrementSeedNonce, getUserWallets,
    getOrCreateJackpotRound, enterJackpotRound, closeJackpotRound,
    finalizeJackpotRound, getJackpotEntries,
    getUserStats, getLeaderboard, getPlatformStats,
    getPendingWithdrawals, approveWithdrawal, rejectWithdrawal,
    getBetById, getRecentBets
  } = require("../src/supabase");
  const { generateSeed, hashSeed } = require("../src/provably-fair");
  const { playDice } = require("../src/games/dice");
  const { playCoinflip } = require("../src/games/coinflip");
  const { playCrash } = require("../src/games/crash");
  const { playMines } = require("../src/games/mines");
  const { playPlinko } = require("../src/games/plinko");
  const { playSlots } = require("../src/games/slots");
  const { playRoulette } = require("../src/games/roulette");
  const { playLimbo } = require("../src/games/limbo");
  const { JsonRpcProvider, Wallet, parseEther } = require("ethers");

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN is required');
  const bot = new Bot(botToken);

  const miniAppUrl = process.env.MINI_APP_URL || 'https://crypto-casino-tg.vercel.app';
  const hotWalletAddr = '0x29021dd5306D7b3b6608a2bc8276D33c1200C7Ef';

  // ── Middleware: ensure user in DB ──
  bot.use(async (ctx, next) => {
    if (ctx.from) {
      await ensureUser(ctx.from.id, ctx.from.username, ctx.from.first_name).catch(() => {});
    }
    await next();
  });

  // ── /start ──
  bot.command('start', async (ctx) => {
    await ctx.reply(
      '🎲 *Crypto Casino*\n\nWelcome to the most transparent casino on Telegram.\n\n'
      + '• Provably fair: Dice, Coinflip, Crash, Mines, Plinko, Slots, Roulette, Limbo\n'
      + '• Jackpot lottery — 90/10 split\n'
      + '• Multi-chain: Base · Solana · TON\n'
      + '• 2% house edge\n'
      + '• Instant deposits & withdrawals\n\n👇 Tap to open the casino',
      { reply_markup: new InlineKeyboard().url('🎰 Open Casino', miniAppUrl), parse_mode: 'Markdown' }
    );
  });

  // ── /balance ──
  bot.command('balance', async (ctx) => {
    const userId = ctx.from.id;
    const bal = await getBalance(userId);
    await ctx.reply(
      `💰 *Your Balance*\n\nETH (Base): \`${Number(bal.balance_evm).toFixed(4)}\`\n`
      + `SOL:        \`${Number(bal.balance_sol).toFixed(4)}\`\n`
      + `TON:        \`${Number(bal.balance_ton).toFixed(4)}\`\n\n`
      + `*Total:* \`${Number(bal.balance).toFixed(4)}\``,
      { parse_mode: 'Markdown' }
    );
  });

  // ── /deposit ──
  bot.command('deposit', async (ctx) => {
    await ctx.reply('Select a chain to deposit:', {
      reply_markup: new InlineKeyboard()
        .text('Base (ETH)', 'deposit:evm')
        .text('Solana', 'deposit:sol')
        .text('TON', 'deposit:ton')
    });
  });

  // ── /withdraw ──
  bot.command('withdraw', async (ctx) => {
    await ctx.reply('Select a chain to withdraw from:', {
      reply_markup: new InlineKeyboard()
        .text('Base (ETH)', 'withdraw:evm')
        .text('Solana', 'withdraw:sol')
        .text('TON', 'withdraw:ton')
    });
  });

  // ── /wd <chain> <amount> <address> ──
  bot.hears(/^\/wd\s+(evm|sol|ton)\s+(\d+(?:\.\d+)?)\s+(0x[a-fA-F0-9]+|\S+)$/, async (ctx) => {
    const userId = ctx.from.id;
    const chain = ctx.match[1];
    const amount = parseFloat(ctx.match[2]);
    const toAddress = ctx.match[3];
    const chainMap = { evm: 'evm', sol: 'solana', ton: 'ton' };
    const dbChain = chainMap[chain] || 'evm';
    const bal = await getBalance(userId);
    const balCol = chain === 'evm' ? bal.balance_evm : chain === 'sol' ? bal.balance_sol : bal.balance_ton;
    if (amount > Number(balCol)) { await ctx.reply('❌ Insufficient balance.'); return; }
    const withdrawal = await createWithdrawal(userId, dbChain, toAddress, amount);
    await updateBalance(userId, dbChain, -amount);
    if (chain === 'evm' && process.env.HOT_WALLET_PK && process.env.BASE_RPC_URL) {
      try {
        const provider = new JsonRpcProvider(process.env.BASE_RPC_URL);
        const wallet = new Wallet(process.env.HOT_WALLET_PK, provider);
        const tx = await wallet.sendTransaction({ to: toAddress, value: parseEther(amount.toString()) });
        await completeWithdrawal(withdrawal.id, tx.hash);
        await ctx.reply(
          `✅ *Withdrawal Sent*\n\nChain: ${chain.toUpperCase()}\nAmount: ${amount} ETH\n`
          + `To: \`${toAddress.slice(0, 8)}...${toAddress.slice(-4)}\`\n`
          + `Tx: [View on Basescan](https://basescan.org/tx/${tx.hash})\n\nFunds sent successfully!`,
          { parse_mode: 'Markdown', link_preview_options: { is_disabled: true } }
        );
        return;
      } catch (err) {
        console.error('Withdrawal TX failed:', err);
        await updateBalance(userId, dbChain, amount);
        await ctx.reply('❌ *Withdrawal Failed*\n\nThe transaction could not be sent. Your balance has been refunded.', { parse_mode: 'Markdown' });
        return;
      }
    }
    await ctx.reply(
      `✅ *Withdrawal Requested*\n\nChain: ${chain.toUpperCase()}\nAmount: ${amount}\n`
      + `To: \`${toAddress.slice(0, 8)}...${toAddress.slice(-4)}\`\nStatus: pending`,
      { parse_mode: 'Markdown' }
    );
  });

  // ── /connect ──
  bot.command('connect', async (ctx) => {
    const userId = ctx.from.id;
    const wallets = await getUserWallets(userId);
    if (wallets.length > 0) {
      const lines = wallets.map(w => `• ${w.chain.toUpperCase()}: \`${w.address.slice(0, 6)}...${w.address.slice(-4)}\``);
      await ctx.reply(`*Connected Wallets*\n${lines.join('\n')}`, { parse_mode: 'Markdown' });
      return;
    }
    await ctx.reply('Connect your wallet to start playing:', {
      reply_markup: new InlineKeyboard()
        .text('Connect Base Wallet', 'connect:evm')
        .text('Connect Solana', 'connect:sol')
        .text('Connect TON Wallet', 'connect:ton')
    });
  });

  // ── Callback handlers ──
  bot.callbackQuery(/^deposit:/, async (ctx) => {
    const chain = ctx.match[0].split(':')[1];
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      `📥 *Deposit on ${chain.toUpperCase()}*\n\nSend funds to:\n\`${hotWalletAddr}\`\n\n`
      + `*Minimum deposit:* 0.001 ${chain === 'evm' ? 'ETH' : chain === 'sol' ? 'SOL' : 'TON'}\n`
      + `*Confirmations needed:* 12\n\n⚠️ Only send ${chain === 'evm' ? 'ETH (Base)' : chain === 'sol' ? 'SOL' : 'TON'} to this address.`,
      { parse_mode: 'Markdown' }
    );
  });
  bot.callbackQuery(/^withdraw:/, async (ctx) => {
    const chain = ctx.match[0].split(':')[1];
    await ctx.answerCallbackQuery();
    await ctx.reply(`To withdraw from *${chain.toUpperCase()}*, send:\n\`/wd ${chain} <amount> <address>\``, { parse_mode: 'Markdown' });
  });
  bot.callbackQuery(/^connect:/, async (ctx) => {
    const chain = ctx.match[0].split(':')[1];
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(`Click below to connect your ${chain.toUpperCase()} wallet:`, {
      reply_markup: new InlineKeyboard().url('Connect Wallet', `${miniAppUrl}/connect/${chain}`)
    });
  });

  // ── /dice <amount> <under|over> <target> ──
  bot.command('dice', async (ctx) => {
    const args = ctx.match?.split(/\s+/) || [];
    if (args.length < 3) {
      await ctx.reply('Usage: `/dice <amount> <under|over> <target>`\nExample: `/dice 0.01 under 50`', { parse_mode: 'Markdown' });
      return;
    }
    const userId = ctx.from.id;
    const betAmount = parseFloat(args[0]);
    const direction = args[1].toLowerCase();
    const target = parseInt(args[2]);
    if (isNaN(betAmount) || betAmount <= 0) { await ctx.reply('❌ Invalid bet amount'); return; }
    if (target < 1 || target > 99) { await ctx.reply('❌ Target must be between 1 and 99'); return; }
    if (direction !== 'under' && direction !== 'over') { await ctx.reply('❌ Direction must be "under" or "over"'); return; }
    const bal = await getBalance(userId);
    if (betAmount > Number(bal.balance_evm)) { await ctx.reply('❌ Insufficient balance. Use /deposit to add funds.'); return; }
    let seed = await getActiveSeed();
    if (!seed || seed.current_nonce >= seed.max_nonce) {
      const newSeed = generateSeed();
      seed = await createServerSeed(newSeed, hashSeed(newSeed));
    }
    const clientSeed = generateSeed();
    const result = playDice({ serverSeed: seed.seed, clientSeed, nonce: seed.current_nonce, target, direction, betAmount });
    await recordBet({ userId, game: 'dice', chain: 'evm', betAmount, payout: result.payout, outcome: { roll: result.roll, target, direction }, serverSeed: seed.seed, clientSeed, nonce: seed.current_nonce, resultHash: result.resultHash, playerWon: result.playerWon });
    const delta = result.payout - betAmount;
    await updateBalance(userId, 'evm', delta);
    await incrementSeedNonce(seed.id);
    const emoji = result.playerWon ? '🟢' : '🔴';
    await ctx.reply(`${emoji} *Dice Result*\n\nRoll: \`${result.roll}\`\nTarget: ${direction} ${target}\nBet: \`${betAmount}\`\nPayout: \`${result.payout}\` (${result.payoutMultiplier}x)\n\n*${result.playerWon ? 'You won! 🎉' : 'You lost.'}*`, { parse_mode: 'Markdown' });
  });

  // ── /flip <amount> <heads|tails> ──
  bot.command('flip', async (ctx) => {
    const args = ctx.match?.split(/\s+/) || [];
    if (args.length < 2) {
      await ctx.reply('Usage: `/flip <amount> <heads|tails>`\nExample: `/flip 0.01 heads`', { parse_mode: 'Markdown' });
      return;
    }
    const userId = ctx.from.id;
    const betAmount = parseFloat(args[0]);
    const pick = args[1].toLowerCase();
    if (isNaN(betAmount) || betAmount <= 0) { await ctx.reply('❌ Invalid bet amount'); return; }
    if (pick !== 'heads' && pick !== 'tails') { await ctx.reply('❌ Pick "heads" or "tails"'); return; }
    const bal = await getBalance(userId);
    if (betAmount > Number(bal.balance_evm)) { await ctx.reply('❌ Insufficient balance.'); return; }
    let seed = await getActiveSeed();
    if (!seed || seed.current_nonce >= seed.max_nonce) {
      const newSeed = generateSeed();
      seed = await createServerSeed(newSeed, hashSeed(newSeed));
    }
    const clientSeed = generateSeed();
    const result = playCoinflip({ serverSeed: seed.seed, clientSeed, nonce: seed.current_nonce, pick, betAmount });
    await recordBet({ userId, game: 'coinflip', chain: 'evm', betAmount, payout: result.payout, outcome: { result: result.result, pick }, serverSeed: seed.seed, clientSeed, nonce: seed.current_nonce, resultHash: result.resultHash, playerWon: result.playerWon });
    await incrementSeedNonce(seed.id);
    const emoji = result.playerWon ? '🟢' : '🔴';
    await ctx.reply(`${emoji} *Coinflip Result*\n\nResult: \`${result.result}\`\nYour pick: \`${pick}\`\nBet: \`${betAmount}\`\nPayout: \`${result.payout}\` (${result.payoutMultiplier}x)\n\n*${result.playerWon ? 'You won! 🎉' : 'You lost.'}*`, { parse_mode: 'Markdown' });
  });

  // ── /crash <amount> <autoCashout> ──
  bot.command('crash', async (ctx) => {
    const args = ctx.match?.split(/\s+/) || [];
    if (args.length < 2) {
      await ctx.reply('Usage: `/crash <amount> <multiplier>`\nExample: `/crash 0.01 2` (auto-cashout at 2x)', { parse_mode: 'Markdown' });
      return;
    }
    const userId = ctx.from.id;
    const betAmount = parseFloat(args[0]);
    const autoCashout = parseFloat(args[1]);
    if (isNaN(betAmount) || betAmount <= 0) { await ctx.reply('❌ Invalid bet amount'); return; }
    if (isNaN(autoCashout) || autoCashout < 1.01) { await ctx.reply('❌ Auto cashout must be at least 1.01x'); return; }
    if (autoCashout > 1000) { await ctx.reply('❌ Max auto cashout is 1000x'); return; }
    const bal = await getBalance(userId);
    if (betAmount > Number(bal.balance_evm)) { await ctx.reply('❌ Insufficient balance. Use /deposit to add funds.'); return; }
    let seed = await getActiveSeed();
    if (!seed || seed.current_nonce >= seed.max_nonce) {
      const newSeed = generateSeed();
      seed = await createServerSeed(newSeed, hashSeed(newSeed));
    }
    const clientSeed = generateSeed();
    const roundId = seed.current_nonce;
    const result = playCrash({ serverSeed: seed.seed, clientSeed, nonce: seed.current_nonce, roundId, betAmount, autoCashout });
    await recordBet({ userId, game: 'crash', chain: 'evm', betAmount, payout: result.payout, outcome: { crashPoint: result.crashPoint, autoCashout }, serverSeed: seed.seed, clientSeed, nonce: seed.current_nonce, resultHash: result.resultHash, playerWon: result.playerWon });
    const delta = result.payout - betAmount;
    await updateBalance(userId, 'evm', delta);
    await incrementSeedNonce(seed.id);
    const emoji = result.playerWon ? '🟢' : '🔴';
    await ctx.reply(
      `${emoji} *Crash Result*\n\nCrash Point: \`${result.crashPoint}x\`\nAuto Cashout: \`${autoCashout}x\`\nBet: \`${betAmount}\`\nPayout: \`${result.payout}\` (${result.payoutMultiplier}x)\n\n*${result.playerWon ? 'Cashed out in time! 🚀' : 'Crashed before cashout. 💥'}*`,
      { parse_mode: 'Markdown' }
    );
  });

  // ── /mines <amount> <numMines> <revealCount> ──
  bot.command('mines', async (ctx) => {
    const args = ctx.match?.split(/\s+/) || [];
    if (args.length < 3) {
      await ctx.reply('Usage: `/mines <amount> <numMines> <revealCount>`\nExample: `/mines 0.01 3 4` (3 mines, reveal 4 tiles)', { parse_mode: 'Markdown' });
      return;
    }
    const userId = ctx.from.id;
    const betAmount = parseFloat(args[0]);
    const numMines = parseInt(args[1]);
    const revealCount = parseInt(args[2]);
    if (isNaN(betAmount) || betAmount <= 0) { await ctx.reply('❌ Invalid bet amount'); return; }
    if (isNaN(numMines) || numMines < 1 || numMines > 20) { await ctx.reply('❌ Mines must be 1–20'); return; }
    if (isNaN(revealCount) || revealCount < 1 || revealCount > 25 - numMines) { await ctx.reply('❌ Reveal count must be 1–' + (25 - numMines)); return; }
    const bal = await getBalance(userId);
    if (betAmount > Number(bal.balance_evm)) { await ctx.reply('❌ Insufficient balance. Use /deposit to add funds.'); return; }
    let seed = await getActiveSeed();
    if (!seed || seed.current_nonce >= seed.max_nonce) {
      const newSeed = generateSeed();
      seed = await createServerSeed(newSeed, hashSeed(newSeed));
    }
    const clientSeed = generateSeed();
    const result = playMines({ serverSeed: seed.seed, clientSeed, nonce: seed.current_nonce, numMines, revealCount });
    await recordBet({ userId, game: 'mines', chain: 'evm', betAmount, payout: result.safe ? Math.round(betAmount * result.multiplier * 1e8) / 1e8 : 0, outcome: { safe: result.safe, numMines, revealCount, mines: result.minePositions }, serverSeed: seed.seed, clientSeed, nonce: seed.current_nonce, resultHash: result.resultHash, playerWon: result.safe });
    const delta = result.safe ? Math.round(betAmount * (result.multiplier - 1) * 1e8) / 1e8 : -betAmount;
    await updateBalance(userId, 'evm', delta);
    await incrementSeedNonce(seed.id);
    if (result.safe) {
      await ctx.reply(
        `🟢 *Mines Result*\n\nMines: \`${numMines}\` | Revealed: \`${revealCount}\` tiles\nBet: \`${betAmount}\`\nPayout: \`${(betAmount * result.multiplier).toFixed(6)}\` (${result.multiplier}x)\n\n*All safe! You won! 🎉*`,
        { parse_mode: 'Markdown' }
      );
    } else {
      await ctx.reply(
        `🔴 *Mines Result*\n\nMines: \`${numMines}\` | Revealed: \`${revealCount}\` tiles\nBet: \`${betAmount}\` (lost)\n\n*Hit a mine! 💥*`,
        { parse_mode: 'Markdown' }
      );
    }
  });

  // ── /plinko <amount> <rows> <risk> ──
  bot.command('plinko', async (ctx) => {
    const args = ctx.match?.split(/\s+/) || [];
    if (args.length < 3) {
      await ctx.reply('Usage: `/plinko <amount> <rows> <risk>`\nExample: `/plinko 0.01 12 medium`\n\nRows: 8–16 | Risk: low, medium, high', { parse_mode: 'Markdown' });
      return;
    }
    const userId = ctx.from.id;
    const betAmount = parseFloat(args[0]);
    const rows = parseInt(args[1]);
    const risk = args[2].toLowerCase();
    if (isNaN(betAmount) || betAmount <= 0) { await ctx.reply('❌ Invalid bet amount'); return; }
    if (isNaN(rows) || rows < 8 || rows > 16) { await ctx.reply('❌ Rows must be 8–16'); return; }
    if (!['low', 'medium', 'high'].includes(risk)) { await ctx.reply('❌ Risk must be: low, medium, or high'); return; }
    const bal = await getBalance(userId);
    if (betAmount > Number(bal.balance_evm)) { await ctx.reply('❌ Insufficient balance. Use /deposit to add funds.'); return; }
    let seed = await getActiveSeed();
    if (!seed || seed.current_nonce >= seed.max_nonce) {
      const newSeed = generateSeed();
      seed = await createServerSeed(newSeed, hashSeed(newSeed));
    }
    const clientSeed = generateSeed();
    const result = playPlinko({ serverSeed: seed.seed, clientSeed, nonce: seed.current_nonce, rows, risk, betAmount });
    await recordBet({ userId, game: 'plinko', chain: 'evm', betAmount, payout: result.payout, outcome: { slot: result.slot, rows, risk, multiplier: result.multiplier }, serverSeed: seed.seed, clientSeed, nonce: seed.current_nonce, resultHash: result.resultHash, playerWon: result.playerWon });
    const delta = result.payout - betAmount;
    await updateBalance(userId, 'evm', delta);
    await incrementSeedNonce(seed.id);
    const emoji = result.playerWon ? '🟢' : '🔴';
    const slotEmoji = result.slot < Math.floor(rows / 3) || result.slot > rows - Math.floor(rows / 3) ? '🔥' : result.multiplier >= 1 ? '⭐' : '💀';
    await ctx.reply(
      `${emoji} *Plinko Result*\n\n`
      + `Rows: \`${rows}\` | Risk: \`${risk}\`\n`
      + `Slot: \`#${result.slot}\` ${slotEmoji}\n`
      + `Multiplier: \`${result.multiplier}x\`\n`
      + `Bet: \`${betAmount}\`\n`
      + `Payout: \`${result.payout}\`\n\n`
      + `*${result.playerWon ? 'You won! 🎉' : 'You lost.'}*`,
      { parse_mode: 'Markdown' }
    );
  });

  // ── /slots <amount> ──
  bot.command('slots', async (ctx) => {
    const args = ctx.match?.split(/\s+/) || [];
    if (args.length < 1) {
      await ctx.reply('Usage: `/slots <amount>`\nExample: `/slots 0.01`', { parse_mode: 'Markdown' });
      return;
    }
    const userId = ctx.from.id;
    const betAmount = parseFloat(args[0]);
    if (isNaN(betAmount) || betAmount <= 0) { await ctx.reply('❌ Invalid bet amount'); return; }
    const bal = await getBalance(userId);
    if (betAmount > Number(bal.balance_evm)) { await ctx.reply('❌ Insufficient balance. Use /deposit to add funds.'); return; }
    let seed = await getActiveSeed();
    if (!seed || seed.current_nonce >= seed.max_nonce) {
      const newSeed = generateSeed();
      seed = await createServerSeed(newSeed, hashSeed(newSeed));
    }
    const clientSeed = generateSeed();
    const result = playSlots({ serverSeed: seed.seed, clientSeed, nonce: seed.current_nonce, betAmount });
    await recordBet({ userId, game: 'slots', chain: 'evm', betAmount, payout: result.payout, outcome: { reels: result.reels, combo: result.combo }, serverSeed: seed.seed, clientSeed, nonce: seed.current_nonce, resultHash: result.resultHash, playerWon: result.playerWon });
    const delta = result.payout - betAmount;
    await updateBalance(userId, 'evm', delta);
    await incrementSeedNonce(seed.id);
    const reelsDisplay = result.reels.join('  |  ');
    const winMsg = result.playerWon ? `*${result.payoutMultiplier}x — You won! 🎉*` : '*No win this time.*';
    await ctx.reply(
      `🎰 *Slots Result*\n\n`
      + `[ ${reelsDisplay} ]\n\n`
      + `Bet: \`${betAmount}\`\n`
      + `Payout: \`${result.payout}\`\n`
      + `${winMsg}`,
      { parse_mode: 'Markdown' }
    );
  });

  // ── /roulette <amount> <betType> <betValue> ──
  bot.command('roulette', async (ctx) => {
    const args = ctx.match?.split(/\s+/) || [];
    if (args.length < 3) {
      await ctx.reply(
        'Usage: `/roulette <amount> <type> <value>`\n\n'
        + '*Types & Values:*\n'
        + '• `number 0-36` — straight up (35x)\n'
        + '• `color red|black` — color bet (1.96x)\n'
        + '• `odd_even odd|even` — odd/even (1.96x)\n'
        + '• `high_low low|high` — 1-18/19-36 (1.96x)\n'
        + '• `dozen 1|2|3` — 1st/2nd/3rd 12 (2.94x)\n'
        + '• `column 1|2|3` — 3 columns (2.94x)\n\n'
        + 'Example: `/roulette 0.01 color red`',
        { parse_mode: 'Markdown' }
      );
      return;
    }
    const userId = ctx.from.id;
    const betAmount = parseFloat(args[0]);
    const betType = args[1].toLowerCase();
    let betValue = args[2].toLowerCase();
    if (isNaN(betAmount) || betAmount <= 0) { await ctx.reply('❌ Invalid bet amount'); return; }
    if (!['number', 'color', 'odd_even', 'high_low', 'dozen', 'column'].includes(betType)) {
      await ctx.reply('❌ Invalid bet type. See usage.'); return;
    }
    if (betType === 'number') {
      const num = parseInt(betValue);
      if (isNaN(num) || num < 0 || num > 36) { await ctx.reply('❌ Number must be 0–36'); return; }
      betValue = num;
    } else if (betType === 'color') {
      if (!['red', 'black', 'green'].includes(betValue)) { await ctx.reply('❌ Color must be red, black, or green'); return; }
    } else if (betType === 'odd_even') {
      if (!['odd', 'even'].includes(betValue)) { await ctx.reply('❌ Must be "odd" or "even"'); return; }
    } else if (betType === 'high_low') {
      if (!['low', 'high'].includes(betValue)) { await ctx.reply('❌ Must be "low" or "high"'); return; }
    } else if (betType === 'dozen') {
      if (!['1', '2', '3'].includes(betValue)) { await ctx.reply('❌ Dozen must be 1, 2, or 3'); return; }
      betValue = parseInt(betValue);
    } else if (betType === 'column') {
      if (!['1', '2', '3'].includes(betValue)) { await ctx.reply('❌ Column must be 1, 2, or 3'); return; }
      betValue = parseInt(betValue);
    }
    const bal = await getBalance(userId);
    if (betAmount > Number(bal.balance_evm)) { await ctx.reply('❌ Insufficient balance. Use /deposit to add funds.'); return; }
    let seed = await getActiveSeed();
    if (!seed || seed.current_nonce >= seed.max_nonce) {
      const newSeed = generateSeed();
      seed = await createServerSeed(newSeed, hashSeed(newSeed));
    }
    const clientSeed = generateSeed();
    const result = playRoulette({ serverSeed: seed.seed, clientSeed, nonce: seed.current_nonce, betType, betValue, betAmount });
    await recordBet({ userId, game: 'roulette', chain: 'evm', betAmount, payout: result.payout, outcome: { number: result.number, color: result.color, betType, betValue }, serverSeed: seed.seed, clientSeed, nonce: seed.current_nonce, resultHash: result.resultHash, playerWon: result.playerWon });
    const delta = result.payout - betAmount;
    await updateBalance(userId, 'evm', delta);
    await incrementSeedNonce(seed.id);
    const emoji = result.playerWon ? '🟢' : '🔴';
    await ctx.reply(
      `${emoji} *Roulette Result*\n\n`
      + `Ball landed: \`${result.number}\` ${result.color === 'red' ? '🔴' : result.color === 'black' ? '⚫' : '🟢'}\n`
      + `Your bet: \`${betType} ${betValue}\`\n`
      + `Bet: \`${betAmount}\`\n`
      + `Payout: \`${result.payout}\` (${result.payoutMultiplier.toFixed(2)}x)\n\n`
      + `*${result.playerWon ? 'You won! 🎉' : 'You lost.'}*`,
      { parse_mode: 'Markdown' }
    );
  });

  // ── /limbo <amount> <targetMultiplier> ──
  bot.command('limbo', async (ctx) => {
    const args = ctx.match?.split(/\s+/) || [];
    if (args.length < 2) {
      await ctx.reply('Usage: `/limbo <amount> <targetMultiplier>`\nExample: `/limbo 0.01 2` (bet that multiplier goes >=2x)', { parse_mode: 'Markdown' });
      return;
    }
    const userId = ctx.from.id;
    const betAmount = parseFloat(args[0]);
    const targetMultiplier = parseFloat(args[1]);
    if (isNaN(betAmount) || betAmount <= 0) { await ctx.reply('❌ Invalid bet amount'); return; }
    if (isNaN(targetMultiplier) || targetMultiplier < 1.01) { await ctx.reply('❌ Target multiplier must be at least 1.01x'); return; }
    if (targetMultiplier > 10000) { await ctx.reply('❌ Max target multiplier is 10000x'); return; }
    const bal = await getBalance(userId);
    if (betAmount > Number(bal.balance_evm)) { await ctx.reply('❌ Insufficient balance. Use /deposit to add funds.'); return; }
    let seed = await getActiveSeed();
    if (!seed || seed.current_nonce >= seed.max_nonce) {
      const newSeed = generateSeed();
      seed = await createServerSeed(newSeed, hashSeed(newSeed));
    }
    const clientSeed = generateSeed();
    const result = playLimbo({ serverSeed: seed.seed, clientSeed, nonce: seed.current_nonce, targetMultiplier, betAmount });
    await recordBet({ userId, game: 'limbo', chain: 'evm', betAmount, payout: result.payout, outcome: { multiplier: result.multiplier, targetMultiplier }, serverSeed: seed.seed, clientSeed, nonce: seed.current_nonce, resultHash: result.resultHash, playerWon: result.playerWon });
    const delta = result.payout - betAmount;
    await updateBalance(userId, 'evm', delta);
    await incrementSeedNonce(seed.id);
    const emoji = result.playerWon ? '🟢' : '🔴';
    await ctx.reply(
      `${emoji} *Limbo Result*\n\n`
      + `Actual Multiplier: \`${result.multiplier}x\`\n`
      + `Target: \`${targetMultiplier}x\`\n`
      + `Bet: \`${betAmount}\`\n`
      + `Payout: \`${result.payout}\` (${result.payoutMultiplier}x)\n\n`
      + `*${result.playerWon ? 'Target reached! 🚀' : 'Did not reach target. 💨'}*`,
      { parse_mode: 'Markdown' }
    );
  });

  // ── Jackpot: Provably fair lottery ──
  const crypto = require("node:crypto");

  // /jackpot — show round info, enter, spin
  bot.command('jackpot', async (ctx) => {
    const subcommand = ctx.match?.split(/\s+/) || [];
    const cmd = subcommand[0]?.toLowerCase();

    // ── Enter ──
    if (cmd === 'enter') {
      const amount = parseFloat(subcommand[1]);
      if (isNaN(amount) || amount <= 0) { await ctx.reply('❌ Usage: `/jackpot enter <amount>`'); return; }
      const MIN_ENTRY = 0.001;
      if (amount < MIN_ENTRY) { await ctx.reply('❌ Minimum entry: ' + MIN_ENTRY + ' ETH'); return; }
      const userId = ctx.from.id;
      const bal = await getBalance(userId);
      if (amount > Number(bal.balance_evm)) { await ctx.reply('❌ Insufficient balance.'); return; }
      const round = await getOrCreateJackpotRound();
      await updateBalance(userId, 'evm', -amount);
      const ticket = await enterJackpotRound(round.id, userId, amount, 'evm');
      await ctx.reply('🎟️ *Jackpot Entry Accepted!*\n\nRound: #' + round.id + '\nAmount: `' + amount + '` ETH\nTicket #: `' + ticket + '`\n\nGood luck! 🍀', { parse_mode: 'Markdown' });
      return;
    }

    // ── Spin ──
    if (cmd === 'spin') {
      const userId = ctx.from.id;
      const round = await getOrCreateJackpotRound();
      const entries = await getJackpotEntries(round.id);
      if (entries.length < 2) { await ctx.reply('❌ Need at least 2 entries to spin!'); return; }
      if (round.status !== 'open') { await ctx.reply('❌ Round already closed/spinning.'); return; }

      const serverSeed = generateSeed();
      const clientSeed = generateSeed();
      const nonce = 0;
      const hash = crypto.createHmac('sha256', serverSeed).update(clientSeed + nonce).digest();
      const winningTicket = (hash.readUInt32BE(0) % entries.length) + 1;
      const winner = entries.find(e => e.ticket_number === winningTicket);
      if (!winner) { await ctx.reply('❌ Could not determine winner.'); return; }

      const totalPool = Number(round.prize_pool);
      const houseCut = Math.round(totalPool * 0.10 * 1e8) / 1e8;
      const winnerPayout = totalPool - houseCut;

      await closeJackpotRound(round.id, serverSeed, clientSeed);
      await finalizeJackpotRound(round.id, winner.user_id, winningTicket, winnerPayout, houseCut, hash.toString('hex'));
      await updateBalance(winner.user_id, 'evm', winnerPayout);

      await ctx.reply(
        '🎰 *Jackpot #' + round.id + ' — RESULT!*\n\n'
        + 'Total Tickets: `' + entries.length + '`\n'
        + 'Winning Ticket: #`' + winningTicket + '`\n'
        + 'Winner: [' + winner.user_id + '](tg://user?id=' + winner.user_id + ')\n'
        + 'Prize: `' + winnerPayout.toFixed(6) + '` ETH 🏆\n'
        + 'House Cut: `' + houseCut.toFixed(6) + '` ETH\n\n'
        + '*Congratulations!* 🎉\n\n'
        + '_Provably fair: HMAC-SHA256 of server seed "' + serverSeed.slice(0, 12) + '..."_\n'
        + '_Verify: `/verify`_',
        { parse_mode: 'Markdown' }
      );

      await getOrCreateJackpotRound();
      return;
    }

    // ── Default: show info ──
    const round = await getOrCreateJackpotRound();
    const entries = await getJackpotEntries(round.id);
    const prizePool = Number(round.prize_pool).toFixed(6);
    const houseCut = Math.round(Number(round.prize_pool) * 0.10 * 1e8) / 1e8;
    const winnerPayout = Number(round.prize_pool) - houseCut;
    await ctx.reply(
      '🎰 *Jackpot #' + round.id + '*\n\n'
      + '💰 Prize Pool: `' + prizePool + '` ETH\n'
      + '🎟️ Entries: `' + entries.length + '`\n'
      + '🏆 Winner gets: `' + winnerPayout.toFixed(6) + '` ETH (90%)\n'
      + '🏠 House takes: `' + houseCut.toFixed(6) + '` ETH (10%)\n\n'
      + 'Enter with: /jackpot enter <amount>',
      { parse_mode: 'Markdown' }
    );
  });

  // ── /help ──
  bot.command('help', async (ctx) => {
    await ctx.reply(
      '*Commands*\n\n/start — Open the casino\n/balance — Check your balance\n/deposit — Deposit crypto\n'
      + '/withdraw — Withdraw crypto\n/connect — Connect your wallet\n'
      + '/dice <amount> <under|over> <target> — Dice (2–98x)\n'
      + '/crash <amount> <multiplier> — Crash game\n'
      + '/mines <amount> <mines> <reveal> — Mines game\n'
      + '/flip <amount> <heads|tails> — Coinflip\n'
      + '/plinko <amount> <rows> <risk> — Plinko (low/med/high)\n'
      + '/slots <amount> — Slots machine\n'
      + '/roulette <amount> <type> <bet> — European roulette\n'
      + '/limbo <amount> <target> — Limbo multiplier\n'
      + '/jackpot — Jackpot lottery (90/10 split)\n'
      + '/stats — Your betting stats\n'
      + '/top — Leaderboard\n'
      + '/verify <id> — Provably fair verification\n'
      + '/help — This message',
      { parse_mode: 'Markdown' }
    );
  });

  // ── /stats — Personal betting statistics ──
  bot.command('stats', async (ctx) => {
    const userId = ctx.from.id;
    const stats = await getUserStats(userId);
    if (stats.total_bets === 0) {
      await ctx.reply('📊 No bets yet. Start playing with /dice, /crash, /mines, or any game!');
      return;
    }
    const profitEmoji = stats.profit >= 0 ? '🟢' : '🔴';
    const gamesList = Object.entries(stats.games)
      .sort(([, a], [, b]) => b.plays - a.plays)
      .slice(0, 5)
      .map(([game, g]) => `${game}: ${g.plays} plays | ${g.wins}W/${g.plays - g.wins}L | ${g.profit >= 0 ? '+' : ''}${g.profit.toFixed(6)}`)
      .join('\n');
    await ctx.reply(
      `📊 *Your Stats*\n\n`
      + `Total Bets: \`${stats.total_bets}\`\n`
      + `Wins: \`${stats.wins}\` | Losses: \`${stats.losses}\`\n`
      + `Win Rate: \`${stats.win_rate}%\`\n`
      + `Total Wagered: \`${stats.total_wagered.toFixed(6)}\` ETH\n`
      + `Total Payout: \`${stats.total_payout.toFixed(6)}\` ETH\n`
      + `Net Profit: \`${stats.profit >= 0 ? '+' : ''}${stats.profit.toFixed(6)}\` ETH ${profitEmoji}\n\n`
      + `*Per Game*\n${gamesList || 'N/A'}`,
      { parse_mode: 'Markdown' }
    );
  });

  // ── /top — Leaderboard ──
  bot.command('top', async (ctx) => {
    const leaderboard = await getLeaderboard(10);
    if (leaderboard.length === 0) { await ctx.reply('🏆 No players yet.'); return; }
    const lines = leaderboard.map((p, i) => {
      const badge = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      const name = p.username ? `@${p.username}` : p.first_name || `User ${p.user_id}`;
      return `${badge} ${name} — ${p.profit >= 0 ? '+' : ''}${p.profit.toFixed(6)} ETH`;
    });
    await ctx.reply(`🏆 *Leaderboard — Top Players*\n\n${lines.join('\n')}\n\n_Net profit across all games_`, { parse_mode: 'Markdown' });
  });

  // ── Admin IDs (change these) ──
  const ADMIN_IDS = [873158727]; // Telegram user IDs of admins

  // ── /admin — Dashboard ──
  bot.command('admin', async (ctx) => {
    const userId = ctx.from.id;
    if (!ADMIN_IDS.includes(userId)) { await ctx.reply('⛔ Unauthorized.'); return; }
    const args = ctx.match?.split(/\s+/) || [];
    const cmd = args[0]?.toLowerCase();

    // ── /admin stats — Platform statistics ──
    if (cmd === 'stats' || !cmd) {
      const ps = await getPlatformStats();
      await ctx.reply(
        `📊 *Platform Stats*\n\n`
        + `Users: \`${ps.user_count}\`\n`
        + `Total Bets: \`${ps.total_bets}\`\n`
        + `Total Wagered: \`${ps.total_wagered}\` ETH\n`
        + `Total Payout: \`${ps.total_payout}\` ETH\n`
        + `House Profit: \`${ps.house_profit}\` ETH\n`
        + `House Edge: \`${ps.house_edge_actual}%\`\n`
        + `Pending Withdrawals: \`${ps.pending_withdrawals}\`\n\n`
        + `/admin withdrawals — Manage pending withdrawals`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // ── /admin withdrawals — List pending ──
    if (cmd === 'withdrawals') {
      const pending = await getPendingWithdrawals();
      if (pending.length === 0) { await ctx.reply('✅ No pending withdrawals.'); return; }
      let msg = `📋 *Pending Withdrawals (${pending.length})*\n\n`;
      for (const w of pending.slice(0, 10)) {
        const name = w.tg_users?.username ? `@${w.tg_users.username}` : w.tg_users?.first_name || `User ${w.user_id}`;
        msg += `#${w.id} | ${name} | \`${w.amount}\` ETH → \`${w.to_address?.slice(0, 10)}...\`\n`;
      }
      msg += `\n*Commands:*\n/admin approve <id> <txHash> — Approve & mark sent\n/admin reject <id> — Reject & refund`;
      await ctx.reply(msg, { parse_mode: 'Markdown' });
      return;
    }

    // ── /admin approve <id> <txHash> ──
    if (cmd === 'approve') {
      const id = parseInt(args[1]);
      const txHash = args[2];
      if (!id || !txHash) { await ctx.reply('Usage: `/admin approve <id> <txHash>`'); return; }
      try {
        const w = await approveWithdrawal(id, txHash);
        await ctx.reply(`✅ Withdrawal #${id} approved and marked completed.\nTx: \`${txHash}\``, { parse_mode: 'Markdown' });
      } catch (e) { await ctx.reply(`❌ Error: ${e.message}`); }
      return;
    }

    // ── /admin reject <id> ──
    if (cmd === 'reject') {
      const id = parseInt(args[1]);
      if (!id) { await ctx.reply('Usage: `/admin reject <id>`'); return; }
      try {
        const w = await rejectWithdrawal(id);
        const refund = Number(w.amount).toFixed(6);
        await ctx.reply(`✅ Withdrawal #${id} rejected. Refunded \`${refund}\` ETH to user.`, { parse_mode: 'Markdown' });
      } catch (e) { await ctx.reply(`❌ Error: ${e.message}`); }
      return;
    }

    // ── Default admin help ──
    await ctx.reply(
      '*Admin Commands*\n\n'
      + '/admin stats — Platform statistics\n'
      + '/admin withdrawals — Pending withdrawals\n'
      + '/admin approve <id> <tx> — Approve withdrawal\n'
      + '/admin reject <id> — Reject & refund',
      { parse_mode: 'Markdown' }
    );
  });

  // ── Improved /verify ──
  bot.command('verify', async (ctx) => {
    const args = ctx.match?.split(/\s+/) || [];
    const userId = ctx.from.id;

    // If they provide a bet ID, look up that specific bet
    if (args[0]) {
      const betId = parseInt(args[0]);
      if (isNaN(betId)) { await ctx.reply('❌ Invalid bet ID. Usage: `/verify <betId>`'); return; }
      const bet = await getBetById(betId);
      if (!bet) { await ctx.reply('❌ Bet not found.'); return; }
      if (bet.user_id !== userId && !ADMIN_IDS.includes(userId)) { await ctx.reply('⛔ This bet is not yours.'); return; }

      // Recompute the result to verify
      const { diceRoll, coinflipResult, dicePayout, coinflipPayout, diceOutcome,
              plinkoResult, slotsResult, rouletteResult, limboResult,
              computeResult, bytesToFloat } = require("../src/provably-fair");

      let verificationMsg = '';
      try {
        const hash = computeResult(bet.server_seed, bet.client_seed, bet.nonce);
        verificationMsg = `🔐 *Provably Fair Verification*\n\nBet #\`${bet.id}\`\nGame: \`${bet.game}\`\n\n`;
        verificationMsg += `Server Seed: \`${bet.server_seed.slice(0, 16)}...\`\n`;
        verificationMsg += `Client Seed: \`${bet.client_seed.slice(0, 16)}...\`\n`;
        verificationMsg += `Nonce: \`${bet.nonce}\`\n`;
        verificationMsg += `Result Hash: \`${bet.result_hash.slice(0, 16)}...\`\n`;
        verificationMsg += `HMAC Match: \`${hash.toString('hex') === bet.result_hash ? '✅ Verified' : '❌ MISMATCH'}\`\n\n`;
        verificationMsg += `Bet: \`${bet.bet_amount}\` → Payout: \`${bet.payout}\`\n`;
        verificationMsg += `Outcome: ${bet.player_won ? '✅ Won' : '❌ Lost'}\n\n`;
        verificationMsg += `_Full server seed revealed after rotation._`;
      } catch (e) {
        verificationMsg = `❌ Verification error: ${e.message}`;
      }
      await ctx.reply(verificationMsg, { parse_mode: 'Markdown' });
      return;
    }

    // No bet ID: show last 5 bets
    const recent = await getRecentBets(userId, 5);
    if (recent.length === 0) {
      await ctx.reply('No recent bets. Use `/verify <betId>` to verify a specific bet.', { parse_mode: 'Markdown' });
      return;
    }
    const lines = recent.map((b, i) =>
      `#${b.id} | ${b.game} | \`${b.bet_amount}\` → \`${b.payout}\` | ${b.player_won ? '✅' : '❌'}`
    );
    await ctx.reply(
      `📋 *Recent Bets*\n\n${lines.join('\n')}\n\nUse \`/verify <betId>\` for full provably fair proof.`,
      { parse_mode: 'Markdown' }
    );
  });

  // ════════════════════════════════════════════════════════════════
  // Main Vercel handler — bypasses webhookCallback to avoid
  // "req.headers.get is not a function" error on Vercel's runtime
  // ════════════════════════════════════════════════════════════════
  const secretToken = process.env.TELEGRAM_SECRET_TOKEN;
  let botInitPromise = null;
  function ensureBotInit() {
    if (!botInitPromise) botInitPromise = bot.init().catch(e => { botInitPromise = null; throw e; });
    return botInitPromise;
  }
  handler = async (req, res) => {
    try {
      // Verify secret token
      if (secretToken && req.headers['x-telegram-bot-api-secret-token'] !== secretToken) {
        res.status(401).send('Unauthorized');
        return;
      }
      // Read body
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = Buffer.concat(chunks).toString('utf-8');
      if (!body) { res.status(400).json({ error: 'empty body' }); return; }
      const update = JSON.parse(body);
      await ensureBotInit();
      await bot.handleUpdate(update);
      res.status(200).send('OK');
    } catch (e) {
      console.error('Handler error:', e);
      res.status(500).json({ error: e.message, stack: e.stack?.split('\n').slice(0, 6).join('\n') });
    }
  };
} catch (e) {
  console.error('Module init error:', e);
  handler = (req, res) => {
    res.status(500).json({ error: e.message, stack: e.stack?.split('\n').slice(0, 6).join('\n') });
  };
}
module.exports = handler;
