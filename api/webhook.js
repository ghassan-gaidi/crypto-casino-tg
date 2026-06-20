"use strict";
// Wrap the entire module in try/catch so Vercel always gets a valid handler
let handler;
try {
  const { Bot, webhookCallback } = require("grammy");
  const { ensureUser, getBalance, createWithdrawal, completeWithdrawal, updateBalance, recordBet, getActiveSeed, createServerSeed, incrementSeedNonce, getUserWallets } = require("../src/supabase");
  const { generateSeed, hashSeed } = require("../src/provably-fair");
  const { playDice } = require("../src/games/dice");
  const { playCoinflip } = require("../src/games/coinflip");
  const { JsonRpcProvider, Wallet, parseEther } = require("ethers");

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN is required');
  const bot = new Bot(botToken);

  // ── Middleware: ensure user in DB ──
  bot.use(async (ctx, next) => {
    if (ctx.from) {
      await ensureUser(ctx.from.id, ctx.from.username, ctx.from.first_name).catch(() => {});
    }
    await next();
  });

  // ── /start ──
  bot.command('start', async (ctx) => {
    const miniAppUrl = process.env.MINI_APP_URL || 'https://crypto-casino-tg.vercel.app';
    const keyboard = new (require('grammy')).InlineKeyboard()
      .url('🎰 Open Casino', miniAppUrl);
    await ctx.reply('🎲 *Crypto Casino*\n\nWelcome to the most transparent casino on Telegram.\n\n• Provably fair Dice & Coinflip\n• Multi-chain: Base · Solana · TON\n• 2% house edge\n• Instant deposits & withdrawals\n\n👇 Tap to open the casino', {
      reply_markup: keyboard, parse_mode: 'Markdown'
    });
  });

  // ── /balance ──
  bot.command('balance', async (ctx) => {
    const userId = ctx.from.id;
    const bal = await getBalance(userId);
    await ctx.reply(`💰 *Your Balance*\n\nETH (Base): \\\`${Number(bal.balance_evm).toFixed(4)}\\\`\nSOL:        \\\`${Number(bal.balance_sol).toFixed(4)}\\\`\nTON:        \\\`${Number(bal.balance_ton).toFixed(4)}\\\`\n\n*Total:* \\\`${Number(bal.balance).toFixed(4)}\\\``, { parse_mode: 'Markdown' });
  });

  // ── /deposit ──
  bot.command('deposit', async (ctx) => {
    const keyboard = new (require('grammy')).InlineKeyboard()
      .text('Base (ETH)', 'deposit:evm')
      .text('Solana', 'deposit:sol')
      .text('TON', 'deposit:ton');
    await ctx.reply('Select a chain to deposit:', { reply_markup: keyboard });
  });

  // ── /withdraw ──
  bot.command('withdraw', async (ctx) => {
    const keyboard = new (require('grammy')).InlineKeyboard()
      .text('Base (ETH)', 'withdraw:evm')
      .text('Solana', 'withdraw:sol')
      .text('TON', 'withdraw:ton');
    await ctx.reply('Select a chain to withdraw from:', { reply_markup: keyboard });
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
    if (amount > Number(balCol)) {
      await ctx.reply('❌ Insufficient balance.');
      return;
    }
    const withdrawal = await createWithdrawal(userId, dbChain, toAddress, amount);
    await updateBalance(userId, dbChain, -amount);
    if (chain === 'evm' && process.env.HOT_WALLET_PK && process.env.BASE_RPC_URL) {
      try {
        const provider = new JsonRpcProvider(process.env.BASE_RPC_URL);
        const wallet = new Wallet(process.env.HOT_WALLET_PK, provider);
        const tx = await wallet.sendTransaction({ to: toAddress, value: parseEther(amount.toString()) });
        await completeWithdrawal(withdrawal.id, tx.hash);
        await ctx.reply(`✅ *Withdrawal Sent*\n\nChain: ${chain.toUpperCase()}\nAmount: ${amount} ETH\nTo: \\\`${toAddress.slice(0, 8)}...${toAddress.slice(-4)}\\\`\nTx: [View](https://basescan.org/tx/${tx.hash})\n\nFunds sent successfully!`, { parse_mode: 'Markdown', link_preview_options: { is_disabled: true } });
        return;
      } catch (err) {
        console.error('Withdrawal TX failed:', err);
        await updateBalance(userId, dbChain, amount);
        await ctx.reply('❌ *Withdrawal Failed*\n\nThe transaction could not be sent. Your balance has been refunded.\n\nPlease try again later.', { parse_mode: 'Markdown' });
        return;
      }
    }
    await ctx.reply(`✅ *Withdrawal Requested*\n\nChain: ${chain.toUpperCase()}\nAmount: ${amount}\nTo: \\\`${toAddress.slice(0, 8)}...${toAddress.slice(-4)}\\\`\nStatus: pending`, { parse_mode: 'Markdown' });
  });

  // ── /connect ──
  bot.command('connect', async (ctx) => {
    const userId = ctx.from.id;
    const wallets = await getUserWallets(userId);
    if (wallets.length > 0) {
      const lines = wallets.map(w => `• ${w.chain.toUpperCase()}: \\\`${w.address.slice(0, 6)}...${w.address.slice(-4)}\\\``);
      await ctx.reply(`*Connected Wallets*\\n${lines.join('\\n')}`, { parse_mode: 'Markdown' });
      return;
    }
    await ctx.reply('Connect your wallet to start playing:', {
      reply_markup: new (require('grammy')).InlineKeyboard()
        .text('Connect Base Wallet', 'connect:evm')
        .text('Connect Solana', 'connect:sol')
        .text('Connect TON Wallet', 'connect:ton')
    });
  });

  // ── Inline callback handlers ──
  bot.callbackQuery(/^deposit:/, async (ctx) => {
    const chain = ctx.match[0].split(':')[1];
    const hotWallet = '0x29021dd5306D7b3b6608a2bc8276D33c1200C7Ef';
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(`📥 *Deposit on ${chain.toUpperCase()}*\n\nSend funds to:\n\\\`${hotWallet}\\\`\n\n*Minimum deposit:* 0.001 ${chain === 'evm' ? 'ETH' : chain === 'sol' ? 'SOL' : 'TON'}\n*Confirmations needed:* 12\n\n⚠️ Only send ${chain === 'evm' ? 'ETH (Base)' : chain === 'sol' ? 'SOL' : 'TON'} to this address.`, { parse_mode: 'Markdown' });
  });

  bot.callbackQuery(/^withdraw:/, async (ctx) => {
    const chain = ctx.match[0].split(':')[1];
    await ctx.answerCallbackQuery();
    await ctx.reply(`To withdraw from *${chain.toUpperCase()}*, send:\n\\\`/wd ${chain} <amount> <address>\\\``, { parse_mode: 'Markdown' });
  });

  bot.callbackQuery(/^connect:/, async (ctx) => {
    const chain = ctx.match[0].split(':')[1];
    await ctx.answerCallbackQuery();
    const connectUrl = `${process.env.MINI_APP_URL || ''}/connect/${chain}`;
    await ctx.editMessageText(`Click below to connect your ${chain.toUpperCase()} wallet:`, {
      reply_markup: new (require('grammy')).InlineKeyboard().url('Connect Wallet', connectUrl)
    });
  });

  // ── /dice <amount> <under|over> <target> ──
  bot.command('dice', async (ctx) => {
    const args = ctx.match?.split(/\s+/) || [];
    if (args.length < 3) {
      await ctx.reply('Usage: \\\`/dice <amount> <under|over> <target>\\\`\nExample: \\\`/dice 0.01 under 50\\\`', { parse_mode: 'Markdown' });
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
    await ctx.reply(`${emoji} *Dice Result*\n\nRoll: \\\`${result.roll}\\\`\nTarget: ${direction} ${target}\nBet: \\\`${betAmount}\\\`\nPayout: \\\`${result.payout}\\\` (${result.payoutMultiplier}x)\n\n*${result.playerWon ? 'You won! 🎉' : 'You lost.'}*`, { parse_mode: 'Markdown' });
  });

  // ── /flip <amount> <heads|tails> ──
  bot.command('flip', async (ctx) => {
    const args = ctx.match?.split(/\s+/) || [];
    if (args.length < 2) {
      await ctx.reply('Usage: \\\`/flip <amount> <heads|tails>\\\`\nExample: \\\`/flip 0.01 heads\\\`', { parse_mode: 'Markdown' });
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
    await ctx.reply(`${emoji} *Coinflip Result*\n\nResult: \\\`${result.result}\\\`\nYour pick: \\\`${pick}\\\`\nBet: \\\`${betAmount}\\\`\nPayout: \\\`${result.payout}\\\` (${result.payoutMultiplier}x)\n\n*${result.playerWon ? 'You won! 🎉' : 'You lost.'}*`, { parse_mode: 'Markdown' });
  });

  // ── /help ──
  bot.command('help', async (ctx) => {
    await ctx.reply(`*Commands*\n\n/start — Open the casino\n/balance — Check your balance\n/deposit — Deposit crypto\n/withdraw — Withdraw crypto\n/connect — Connect your wallet\n/dice <amount> <under|over> <target> — Play dice\n/flip <amount> <heads|tails> — Coinflip\n/verify — Verify a bet (provably fair)\n/help — This message`, { parse_mode: 'Markdown' });
  });

  // ── Export ──
  handler = webhookCallback(bot, 'std/http', {
    secretToken: process.env.TELEGRAM_SECRET_TOKEN,
  });
} catch (e) {
  console.error('Bot init error:', e);
  handler = (req, res) => {
    res.status(500).json({
      error: e.message,
      stack: e.stack?.split('\n').slice(0, 6).join('\n'),
    });
  };
}
module.exports = handler;
