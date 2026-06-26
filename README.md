# Pickr 🎰

Pickr is a premium, addictive multi-chain casino Telegram bot + Mini App.

Built with **Node.js + TypeScript + Grammy + Vite React + ethers.js**.

## Stack

| Layer       | Technology          |
|-------------|---------------------|
| Bot         | Grammy (TypeScript) |
| Frontend    | Vite + React (Mini App) |
| Database    | Supabase (Postgres) |
| Web3        | ethers.js           |
| Deploy      | Vercel              |

## Games (v1)

- **Dice** — Roll over/under with configurable target (1–99). 2% house edge.
- **Coinflip** — Heads or tails. 50% win chance, 1.96x payout.

## Chains

- **Base** (ETH)
- **Solana** (SOL)
- **TON** (Telegram native wallet)

## Wallet Model

Non-custodial connect → deposit to hot wallet → instant credit balance → on-chain withdraw.

Players connect their own wallet (WalletConnect / TON Connect), deposit to a bot-managed address, and play with zero gas fees. Withdrawals are processed by the hot wallet.

## Provably Fair

Standard HMAC-SHA256 system:
1. Server seed is committed (SHA-256) before use
2. Client seed provided by player
3. Nonce increments per bet
4. Result = HMAC(serverSeed, clientSeed:nonce)
5. Old seeds are revealed for verification

## Local Dev

```bash
# Install deps
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

## Vercel Deploy

```bash
# Deploy everything
npx vercel --prod

# Set webhook to your Vercel URL
TELEGRAM_BOT_TOKEN=xxx BOT_URL=https://your-project.vercel.app/api/bot npx tsx scripts/set-webhook.ts
```

Set these env vars in Vercel:

| Variable              | Description                         |
|-----------------------|-------------------------------------|
| `TELEGRAM_BOT_TOKEN`  | Bot token from @BotFather           |
| `TELEGRAM_SECRET_TOKEN` | Webhook secret (optional)         |
| `SUPABASE_URL`         | Supabase project URL                |
| `SUPABASE_SERVICE_KEY` | Supabase service_role key           |
| `BASE_RPC_URL`         | Base mainnet RPC (e.g. Alchemy)     |
| `HOT_WALLET_PK`        | Hot wallet private key (for payouts)|
| `MINI_APP_URL`         | Mini App URL (same as Vercel domain)|

## DB Setup

Run `supabase/schema.sql` and `supabase/rpc.sql` in your Supabase SQL editor.
