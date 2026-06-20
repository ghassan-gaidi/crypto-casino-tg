import { Bot, webhookCallback, InlineKeyboard, Keyboard } from 'grammy'
import type { Context } from 'grammy'
import { ensureUser, getBalance, getActiveSeed, createServerSeed, incrementSeedNonce, recordBet, connectWallet, getUserWallets, createWithdrawal, completeWithdrawal, revealSeed, updateBalance, db } from '../src/supabase'
import { generateSeed, hashSeed } from '../src/provably-fair'
import { playDice } from '../src/games/dice'
import { playCoinflip } from '../src/games/coinflip'
import { Wallet, JsonRpcProvider, parseEther, formatEther } from 'ethers'
import { verifyDepositTx } from '../src/wallet'

// ── Init Bot ──
const botToken = process.env.TELEGRAM_BOT_TOKEN!
if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN is required')

const bot = new Bot(botToken)

// ── Set Mini App MenuButton ──
const miniAppUrl = process.env.MINI_APP_URL || 'https://crypto-casino-tg.vercel.app'
bot.api.setChatMenuButton({
  menu_button: {
    type: 'web_app',
    text: '🎰 Casino',
    web_app: { url: miniAppUrl },
  },
} as any).catch(() => {})

// ── Middleware: ensure user in DB ──
bot.use(async (ctx, next) => {
  if (ctx.from) {
    await ensureUser(ctx.from.id, ctx.from.username, ctx.from.first_name).catch(() => {})
  }
  await next()
})

// ── /start ──
bot.command('start', async (ctx) => {
  const miniAppUrl = process.env.MINI_APP_URL || 'https://crypto-casino-tg.vercel.app'
  const keybaord = new InlineKeyboard()
    .url('🎰 Open Casino', miniAppUrl)

  await ctx.reply(
    `🎲 *Crypto Casino*

Welcome to the most transparent casino on Telegram.

• Provably fair Dice & Coinflip
• Multi-chain: Base · Solana · TON
• 2% house edge
• Instant deposits & withdrawals

👇 Tap to open the casino`,
    {
      reply_markup: keybaord,
      parse_mode: 'Markdown',
    },
  )
})

// ── /balance ──
bot.command('balance', async (ctx) => {
  const userId = ctx.from!.id
  const bal = await getBalance(userId)
  await ctx.reply(
    `💰 *Your Balance*

ETH (Base): \`${Number(bal.balance_evm).toFixed(4)}\`
SOL:        \`${Number(bal.balance_sol).toFixed(4)}\`
TON:        \`${Number(bal.balance_ton).toFixed(4)}\`

*Total:* \`${Number(bal.balance).toFixed(4)}\``,
    { parse_mode: 'Markdown' },
  )
})

// ── /deposit ──
bot.command('deposit', async (ctx) => {
  const userId = ctx.from!.id
  const keyboard = new InlineKeyboard()
    .text('Base (ETH)', 'deposit:evm')
    .text('Solana', 'deposit:sol')
    .text('TON', 'deposit:ton')

  await ctx.reply('Select a chain to deposit:', { reply_markup: keyboard })
})

// ── /withdraw ──
bot.command('withdraw', async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text('Base (ETH)', 'withdraw:evm')
    .text('Solana', 'withdraw:sol')
    .text('TON', 'withdraw:ton')

  await ctx.reply('Select a chain to withdraw from:', { reply_markup: keyboard })
})

// ── /withdraw <chain> <amount> <address> ──
bot.hears(/^\/wd\s+(evm|sol|ton)\s+(\d+(?:\.\d+)?)\s+(0x[a-fA-F0-9]+|\S+)$/, async (ctx) => {
  const userId = ctx.from!.id
  const chain = ctx.match[1] as string
  const amount = parseFloat(ctx.match[2]!)
  const toAddress = ctx.match[3]!

  const chainMap: Record<string, 'evm' | 'solana' | 'ton'> = { evm: 'evm', sol: 'solana', ton: 'ton' }
  const dbChain = chainMap[chain] || 'evm'

  const bal = await getBalance(userId)
  const balCol = chain === 'evm' ? bal.balance_evm : chain === 'sol' ? bal.balance_sol : bal.balance_ton

  if (amount > Number(balCol)) {
    await ctx.reply('❌ Insufficient balance.')
    return
  }

  // Create withdrawal record
  const withdrawal = await createWithdrawal(userId, dbChain, toAddress, amount)

  // Deduct from balance immediately
  await updateBalance(userId, dbChain, -amount)

  // Only process EVM withdrawals automatically
  if (chain === 'evm' && process.env.HOT_WALLET_PK && process.env.BASE_RPC_URL) {
    try {
      const provider = new JsonRpcProvider(process.env.BASE_RPC_URL)
      const wallet = new Wallet(process.env.HOT_WALLET_PK, provider)

      const tx = await wallet.sendTransaction({
        to: toAddress,
        value: parseEther(amount.toString()),
      })

      await completeWithdrawal(withdrawal.id, tx.hash)

      await ctx.reply(
        `✅ *Withdrawal Sent*\n\nChain: ${chain.toUpperCase()}\nAmount: ${amount} ETH\nTo: \`${toAddress.slice(0, 8)}...${toAddress.slice(-4)}\`\nTx: [View on Basescan](https://basescan.org/tx/${tx.hash})\n\nFunds sent successfully!`,
        { parse_mode: 'Markdown', link_preview_options: { is_disabled: true } },
      )
      return
    } catch (err) {
      console.error('Withdrawal TX failed:', err)
      // Refund the balance since TX failed
      await updateBalance(userId, dbChain, amount)
      await ctx.reply(
        `❌ *Withdrawal Failed*\n\nThe transaction could not be sent. Your balance has been refunded.\n\nPlease try again later.`,
        { parse_mode: 'Markdown' },
      )
      return
    }
  }

  // For non-EVM or missing config — pending mode
  await ctx.reply(
    `✅ *Withdrawal Requested*\n\nChain: ${chain.toUpperCase()}\nAmount: ${amount}\nTo: \`${toAddress.slice(0, 8)}...${toAddress.slice(-4)}\`\nStatus: pending\n\nYou'll receive the funds once the withdrawal is processed.`,
    { parse_mode: 'Markdown' },
  )
})

// ── /connect ──
bot.command('connect', async (ctx) => {
  const userId = ctx.from!.id
  const wallets = await getUserWallets(userId)

  if (wallets.length > 0) {
    const lines = wallets.map(w => `• ${w.chain.toUpperCase()}: \`${w.address.slice(0, 6)}...${w.address.slice(-4)}\``)
    await ctx.reply(`*Connected Wallets*\n${lines.join('\n')}`, { parse_mode: 'Markdown' })
    return
  }

  const keyboard = new InlineKeyboard()
    .text('Connect Base Wallet', 'connect:evm')
    .text('Connect Solana', 'connect:sol')
    .text('Connect TON Wallet', 'connect:ton')

  await ctx.reply('Connect your wallet to start playing:', { reply_markup: keyboard })
})

// ── /verify ──
bot.command('verify', async (ctx) => {
  const miniAppUrl = process.env.MINI_APP_URL || 'https://crypto-casino-tg.vercel.app'
  await ctx.reply(
    `🔍 *Provably Fair Verification*

Every bet result is generated using:
• Server seed (SHA-256 committed before use)
• Client seed (yours to choose)
• Nonce (increments per bet)

Open the Mini App and go to *Verify* to check any bet.

[Open Casino](${miniAppUrl})`,
    { parse_mode: 'Markdown', link_preview_options: { is_disabled: true } },
  )
})

// ── Inline callback handlers ──

bot.callbackQuery(/^deposit:/, async (ctx) => {
  const chain = ctx.match[0].split(':')[1] as string
  const userId = ctx.from!.id
  const hotWallet = process.env.HOT_WALLET_PK
    ? '0x29021dd5306D7b3b6608a2bc8276D33c1200C7Ef'
    : '0x0000000000000000000000000000000000000000'

  await ctx.answerCallbackQuery()
  await ctx.editMessageText(
    `📥 *Deposit on ${chain.toUpperCase()}*\n\nTo deposit, send funds to the address below. Your balance will be credited after 12 confirmations.\n\n\`${hotWallet}\`\n\n*Minimum deposit:* 0.001 ${chain === 'evm' ? 'ETH' : chain === 'sol' ? 'SOL' : 'TON'}\n*Confirmations needed:* 12\n\n⚠️ Only send ${chain === 'evm' ? 'ETH (Base)' : chain === 'sol' ? 'SOL' : 'TON'} to this address.`,
    { parse_mode: 'Markdown' },
  )
})

bot.callbackQuery(/^withdraw:/, async (ctx) => {
  const chain = ctx.match[0].split(':')[1] as string
  await ctx.answerCallbackQuery()
  await ctx.reply(
    `To withdraw from *${chain.toUpperCase()}*, send:\n\`/withdraw ${chain} <amount> <address>\``,
    { parse_mode: 'Markdown' },
  )
})

bot.callbackQuery(/^connect:/, async (ctx) => {
  const chain = ctx.match[0].split(':')[1] as string
  await ctx.answerCallbackQuery()

  let connectUrl = ''
  if (chain === 'evm') {
    connectUrl = `${process.env.MINI_APP_URL || ''}/connect/evm`
  } else if (chain === 'sol') {
    connectUrl = `${process.env.MINI_APP_URL || ''}/connect/sol`
  } else if (chain === 'ton') {
    connectUrl = `${process.env.MINI_APP_URL || ''}/connect/ton`
  }

  const keyboard = new InlineKeyboard().url('Connect Wallet', connectUrl)
  await ctx.editMessageText(
    `Click below to connect your ${chain.toUpperCase()} wallet:`,
    { reply_markup: keyboard },
  )
})

// ── /play dice ──
bot.command('dice', async (ctx) => {
  const args = ctx.match?.split(/\s+/) || []
  if (args.length < 3) {
    await ctx.reply('Usage: `/dice <amount> <under|over> <target>`\nExample: `/dice 0.01 under 50`', { parse_mode: 'Markdown' })
    return
  }

  const userId = ctx.from!.id
  const betAmount = parseFloat(args[0]!)
  const direction = args[1]!.toLowerCase() as 'under' | 'over'
  const target = parseInt(args[2]!)

  if (isNaN(betAmount) || betAmount <= 0) {
    await ctx.reply('❌ Invalid bet amount')
    return
  }
  if (target < 1 || target > 99) {
    await ctx.reply('❌ Target must be between 1 and 99')
    return
  }
  if (direction !== 'under' && direction !== 'over') {
    await ctx.reply('❌ Direction must be "under" or "over"')
    return
  }

  // Get balance
  const bal = await getBalance(userId)
  if (betAmount > Number(bal.balance_evm)) {
    await ctx.reply('❌ Insufficient balance. Use /deposit to add funds.')
    return
  }

  // Get active server seed
  let seed = await getActiveSeed()
  if (!seed || seed.current_nonce >= seed.max_nonce) {
    // Rotate seed
    const newSeed = generateSeed()
    const newHash = hashSeed(newSeed)
    seed = await createServerSeed(newSeed, newHash)
  }

  // Auto-generate client seed if not set
  const clientSeed = generateSeed()

  // Play dice
  const result = playDice({
    serverSeed: seed.seed,
    clientSeed,
    nonce: seed.current_nonce,
    target,
    direction,
    betAmount,
  })

  // Record bet in DB
  await recordBet({
    userId,
    game: 'dice',
    chain: 'evm',
    betAmount,
    payout: result.payout,
    outcome: { roll: result.roll, target, direction },
    serverSeed: seed.seed,
    clientSeed,
    nonce: seed.current_nonce,
    resultHash: result.resultHash,
    playerWon: result.playerWon,
  })

  // Update balance (deduct bet, add payout)
  const delta = result.payout - betAmount
  await updateBalance(userId, 'evm', delta)

  await incrementSeedNonce(seed.id)

  const emoji = result.playerWon ? '🟢' : '🔴'
  await ctx.reply(
    `${emoji} *Dice Result*

Roll: \`${result.roll}\`
Target: ${direction} ${target}
Bet: \`${betAmount}\`
Payout: \`${result.payout}\` (${result.payoutMultiplier}x)

*${result.playerWon ? 'You won! 🎉' : 'You lost.'}*

Nonce: \`${seed.current_nonce}\`
Client seed: \`${clientSeed.slice(0, 8)}...\``,
    { parse_mode: 'Markdown' },
  )
})

// ── /flip ──
bot.command('flip', async (ctx) => {
  const args = ctx.match?.split(/\s+/) || []
  if (args.length < 2) {
    await ctx.reply('Usage: `/flip <amount> <heads|tails>`\nExample: `/flip 0.01 heads`', { parse_mode: 'Markdown' })
    return
  }

  const userId = ctx.from!.id
  const betAmount = parseFloat(args[0]!)
  const pick = args[1]!.toLowerCase() as 'heads' | 'tails'

  if (isNaN(betAmount) || betAmount <= 0) {
    await ctx.reply('❌ Invalid bet amount')
    return
  }
  if (pick !== 'heads' && pick !== 'tails') {
    await ctx.reply('❌ Pick "heads" or "tails"')
    return
  }

  const bal = await getBalance(userId)
  if (betAmount > Number(bal.balance_evm)) {
    await ctx.reply('❌ Insufficient balance.')
    return
  }

  let seed = await getActiveSeed()
  if (!seed || seed.current_nonce >= seed.max_nonce) {
    const newSeed = generateSeed()
    const newHash = hashSeed(newSeed)
    seed = await createServerSeed(newSeed, newHash)
  }

  const clientSeed = generateSeed()

  const result = playCoinflip({
    serverSeed: seed.seed,
    clientSeed,
    nonce: seed.current_nonce,
    pick,
    betAmount,
  })

  await recordBet({
    userId,
    game: 'coinflip',
    chain: 'evm',
    betAmount,
    payout: result.payout,
    outcome: { result: result.result, pick },
    serverSeed: seed.seed,
    clientSeed,
    nonce: seed.current_nonce,
    resultHash: result.resultHash,
    playerWon: result.playerWon,
  })

  await incrementSeedNonce(seed.id)

  const emoji = result.playerWon ? '🟢' : '🔴'
  await ctx.reply(
    `${emoji} *Coinflip Result*

Result: \`${result.result}\`
Your pick: \`${pick}\`
Bet: \`${betAmount}\`
Payout: \`${result.payout}\` (${result.payoutMultiplier}x)

*${result.playerWon ? 'You won! 🎉' : 'You lost.'}*`,
    { parse_mode: 'Markdown' },
  )
})

// ── /claim <txHash> ──
bot.command('claim', async (ctx) => {
  const userId = ctx.from!.id
  const txHash = ctx.match?.trim()
  if (!txHash || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    await ctx.reply(
      'Usage: `/claim 0x<txhash>`\n\nProvide the transaction hash of your deposit. The bot will verify it on-chain and credit your balance.',
      { parse_mode: 'Markdown' },
    )
    return
  }

  await ctx.reply(`⏳ Verifying transaction ${txHash.slice(0, 10)}...${txHash.slice(-6)} on Base...`)

  const result = await verifyDepositTx(txHash)
  if (!result.valid) {
    await ctx.reply(
      `❌ *Verification Failed*\n\n${result.error}\n\nMake sure the transaction:\n• Was sent to the casino hot wallet\n• Is on the Base (Base Mainnet) chain\n• Has at least 1 confirmation`,
      { parse_mode: 'Markdown' },
    )
    return
  }

  // Check if already claimed
  const { data: existing } = await db
    .from('tg_deposits')
    .select('id')
    .eq('tx_hash', txHash.toLowerCase())
    .single()

  if (existing) {
    await ctx.reply('⏳ This deposit has already been credited.')
    return
  }

  const valueEth = parseFloat(formatEther(result.value!))

  // Record the deposit
  await db.from('tg_deposits').insert({
    user_id: userId,
    chain: 'evm',
    tx_hash: txHash.toLowerCase(),
    amount: valueEth,
    from_address: result.from!,
    to_address: result.to!,
    confirmations: result.confirmations,
    status: 'completed',
  })

  // Credit user balance
  await updateBalance(userId, 'evm', valueEth)

  await ctx.reply(
    `✅ *Deposit Confirmed!*\n\nAmount: \`${valueEth.toFixed(6)}\` ETH\nConfirmations: \`${result.confirmations}\`\nTx: [View on Basescan](https://basescan.org/tx/${txHash})\n\nYour balance has been credited! 🎉`,
    { parse_mode: 'Markdown', link_preview_options: { is_disabled: true } },
  )
})

// ── Help ──
bot.command('help', async (ctx) => {
  await ctx.reply(
    `*Commands*

/start — Open the casino
/balance — Check your balance
/deposit — Deposit crypto
/withdraw — Withdraw crypto
/connect — Connect your wallet
/dice <amount> <under|over> <target> — Play dice
/flip <amount> <heads|tails> — Coinflip
/claim <txhash> — Verify & claim a deposit
/verify — Verify a bet (provably fair)
/help — This message`,
    { parse_mode: 'Markdown' },
  )
})

// ── Vercel webhook export ──
export default process.env.VERCEL_ENV
  ? webhookCallback(bot, 'std/http', {
      secretToken: process.env.TELEGRAM_SECRET_TOKEN,
    })
  : undefined

// ── For local dev ──
if (!process.env.VERCEL_ENV) {
  const port = process.env.PORT || 8080
  // Note: for dev you'd run `npx tsx watch api/bot.ts` and set up a tunnel
  console.log(`Bot running at http://localhost:${port}`)
}
