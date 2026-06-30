# 🎰 NEON NIGHT CASINO

> Multi-chain crypto casino running entirely inside Telegram — bot + Mini App, provably fair, 2% house edge.

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Bot        | Grammy · TypeScript · Node.js           |
| Frontend   | Vite · React 19 · Telegram Mini App SDK |
| Database   | Supabase (PostgreSQL + RPC)             |
| EVM        | ethers.js v6 (Base chain)               |
| Solana     | @solana/web3.js                         |
| TON        | @ton/ton · @ton/crypto                  |
| Deploy     | Vercel                                  |

## Key Features

- **9 Provably Fair Games** — Dice, Coinflip, Crash, Mines, Plinko, Slots, Roulette, Limbo, Jackpot
- **Multi-Chain Wallets** — ETH (Base), SOL, TON with on-chain deposit detection & hot wallet payouts
- **Provably Fair System** — HMAC-SHA256 commit-reveal with per-user seed rotation and verification
- **Gamification** — XP bar, daily streaks, daily bonus claims, leaderboard rankings
- **Social Features** — Live bet feed, share wins, referral system (20% house profit reward)
- **Responsive Mini App** — Sound effects, haptic feedback, confetti, animated numbers, auto-play
- **Rate Limiting** — Per-IP and per-user game play limits

## Supported Chains

| Chain   | Symbol | Network |
|---------|--------|---------|
| EVM     | ETH    | Base    |
| Solana  | SOL    | Mainnet |
| TON     | TON    | Telegram |

## Local Development

```bash
# Install root deps + app deps
npm install
cd app && npm install && cd ..

# Environment
cp .env.example .env
# Fill in: TELEGRAM_BOT_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_KEY, etc.

# Set webhook (after deploying or using a tunnel like ngrok)
npx tsx scripts/set-webhook.ts

# Dev (runs bot on port 8080)
npm run dev
```

## Deploy (Vercel)

```bash
npx vercel --prod

# Set webhook to your Vercel URL
TELEGRAM_BOT_TOKEN=xxx BOT_URL=https://your-project.vercel.app/api/bot \
  npx tsx scripts/set-webhook.ts
```

### Environment Variables

| Variable              | Description                            |
|-----------------------|----------------------------------------|
| `TELEGRAM_BOT_TOKEN`  | Bot token from @BotFather              |
| `TELEGRAM_SECRET_TOKEN` | Webhook secret (optional)           |
| `SUPABASE_URL`        | Supabase project URL                   |
| `SUPABASE_SERVICE_KEY` | Supabase service_role key             |
| `BASE_RPC_URL`        | Base mainnet RPC (e.g. Alchemy)        |
| `HOT_WALLET_PK`       | Hot wallet private key (for payouts)   |
| `MINI_APP_URL`        | Mini App URL (same as Vercel domain)   |

## Database Setup

Run `supabase/schema.sql` and `supabase/rpc.sql` in your Supabase SQL editor.
