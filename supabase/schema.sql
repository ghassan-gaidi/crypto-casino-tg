-- Crypto Casino TG — Supabase Schema
-- Assumes pgcrypto is already enabled in the Supabase project

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id            BIGINT PRIMARY KEY,           -- Telegram user ID
  username      TEXT,
  first_name    TEXT,
  language_code TEXT DEFAULT 'en',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- WALLET CONNECTIONS (non-custodial)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wallet_connections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chain         TEXT NOT NULL CHECK (chain IN ('evm', 'solana', 'ton')),
  address       TEXT NOT NULL,
  signature     TEXT,                          -- signed message proving ownership
  connected_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, chain)
);

CREATE INDEX idx_wallet_connections_user ON public.wallet_connections(user_id);
CREATE INDEX idx_wallet_connections_address ON public.wallet_connections(address);

-- ============================================================
-- DEPOSIT ADDRESSES (per-user hot wallet sub-addresses)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.deposit_addresses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chain         TEXT NOT NULL CHECK (chain IN ('evm', 'solana', 'ton')),
  address       TEXT NOT NULL UNIQUE,          -- the deposit address
  prv_key_id    TEXT,                          -- key identifier in KMS / env (never store raw PK)
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, chain)
);

-- ============================================================
-- BALANCES (credit balance for fast bets)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.balances (
  user_id       BIGINT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  balance       DECIMAL(20,8) NOT NULL DEFAULT 0,
  -- per-chain breakdown (denominated in smallest unit for that chain)
  balance_evm   DECIMAL(20,8) NOT NULL DEFAULT 0,
  balance_sol   DECIMAL(20,8) NOT NULL DEFAULT 0,
  balance_ton   DECIMAL(20,8) NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- DEPOSITS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.deposits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chain           TEXT NOT NULL CHECK (chain IN ('evm', 'solana', 'ton')),
  tx_hash         TEXT NOT NULL UNIQUE,
  from_address    TEXT NOT NULL,
  to_address      TEXT NOT NULL,
  amount          DECIMAL(20,8) NOT NULL,
  token           TEXT NOT NULL DEFAULT 'native',  -- 'native' or token contract address
  confirmations   INT DEFAULT 0,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  detected_at     TIMESTAMPTZ DEFAULT now(),
  confirmed_at    TIMESTAMPTZ
);

CREATE INDEX idx_deposits_user ON public.deposits(user_id);
CREATE INDEX idx_deposits_tx ON public.deposits(tx_hash);
CREATE INDEX idx_deposits_status ON public.deposits(status);

-- ============================================================
-- WITHDRAWALS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chain           TEXT NOT NULL CHECK (chain IN ('evm', 'solana', 'ton')),
  to_address      TEXT NOT NULL,
  amount          DECIMAL(20,8) NOT NULL,
  token           TEXT NOT NULL DEFAULT 'native',
  tx_hash         TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message   TEXT,
  requested_at    TIMESTAMPTZ DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_withdrawals_user ON public.withdrawals(user_id);

-- ============================================================
-- BETS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  game            TEXT NOT NULL CHECK (game IN ('dice', 'coinflip')),
  chain           TEXT NOT NULL CHECK (chain IN ('evm', 'solana', 'ton')),
  bet_amount      DECIMAL(20,8) NOT NULL,
  payout          DECIMAL(20,8) NOT NULL,
  outcome         JSONB,                       -- game-specific result data
  -- Provably fair fields
  server_seed     TEXT NOT NULL,
  client_seed     TEXT NOT NULL,
  nonce           INT NOT NULL,
  result_hash     TEXT NOT NULL,
  -- Settlements
  player_won      BOOLEAN,
  settled         BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bets_user ON public.bets(user_id);
CREATE INDEX idx_bets_game ON public.bets(game);
CREATE INDEX idx_bets_created ON public.bets(created_at DESC);

-- ============================================================
-- SERVER SEEDS (provably fair)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.server_seeds (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seed            TEXT NOT NULL UNIQUE,
  seed_hash       TEXT NOT NULL UNIQUE,         -- SHA-256 hash published before use
  status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'revealed')),
  max_nonce       INT NOT NULL DEFAULT 10000,
  current_nonce   INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  revealed_at     TIMESTAMPTZ
);

CREATE INDEX idx_server_seeds_status ON public.server_seeds(status);
