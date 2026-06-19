-- Crypto Casino TG — Supabase Schema (clean, standalone tables)
-- Prefixed with tg_ to avoid conflicts with existing project tables

-- ============================================================
-- TG USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tg_users (
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
CREATE TABLE IF NOT EXISTS public.tg_wallet_connections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       BIGINT NOT NULL REFERENCES public.tg_users(id) ON DELETE CASCADE,
  chain         TEXT NOT NULL CHECK (chain IN ('evm', 'solana', 'ton')),
  address       TEXT NOT NULL,
  signature     TEXT,
  connected_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, chain)
);

CREATE INDEX IF NOT EXISTS idx_tg_wallet_user ON public.tg_wallet_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_tg_wallet_addr ON public.tg_wallet_connections(address);

-- ============================================================
-- DEPOSIT ADDRESSES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tg_deposit_addresses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       BIGINT NOT NULL REFERENCES public.tg_users(id) ON DELETE CASCADE,
  chain         TEXT NOT NULL CHECK (chain IN ('evm', 'solana', 'ton')),
  address       TEXT NOT NULL UNIQUE,
  prv_key_id    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, chain)
);

-- ============================================================
-- BALANCES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tg_balances (
  user_id       BIGINT PRIMARY KEY REFERENCES public.tg_users(id) ON DELETE CASCADE,
  balance       DECIMAL(20,8) NOT NULL DEFAULT 0,
  balance_evm   DECIMAL(20,8) NOT NULL DEFAULT 0,
  balance_sol   DECIMAL(20,8) NOT NULL DEFAULT 0,
  balance_ton   DECIMAL(20,8) NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- DEPOSITS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tg_deposits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         BIGINT NOT NULL REFERENCES public.tg_users(id) ON DELETE CASCADE,
  chain           TEXT NOT NULL CHECK (chain IN ('evm', 'solana', 'ton')),
  tx_hash         TEXT NOT NULL UNIQUE,
  from_address    TEXT NOT NULL,
  to_address      TEXT NOT NULL,
  amount          DECIMAL(20,8) NOT NULL,
  token           TEXT NOT NULL DEFAULT 'native',
  confirmations   INT DEFAULT 0,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  detected_at     TIMESTAMPTZ DEFAULT now(),
  confirmed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tg_deposits_user ON public.tg_deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_tg_deposits_tx ON public.tg_deposits(tx_hash);
CREATE INDEX IF NOT EXISTS idx_tg_deposits_status ON public.tg_deposits(status);

-- ============================================================
-- WITHDRAWALS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tg_withdrawals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         BIGINT NOT NULL REFERENCES public.tg_users(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_tg_withdrawals_user ON public.tg_withdrawals(user_id);

-- ============================================================
-- BETS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tg_bets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         BIGINT NOT NULL REFERENCES public.tg_users(id) ON DELETE CASCADE,
  game            TEXT NOT NULL CHECK (game IN ('dice', 'coinflip')),
  chain           TEXT NOT NULL CHECK (chain IN ('evm', 'solana', 'ton')),
  bet_amount      DECIMAL(20,8) NOT NULL,
  payout          DECIMAL(20,8) NOT NULL,
  outcome         JSONB,
  server_seed     TEXT NOT NULL,
  client_seed     TEXT NOT NULL,
  nonce           INT NOT NULL,
  result_hash     TEXT NOT NULL,
  player_won      BOOLEAN,
  settled         BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tg_bets_user ON public.tg_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_tg_bets_game ON public.tg_bets(game);
CREATE INDEX IF NOT EXISTS idx_tg_bets_created ON public.tg_bets(created_at DESC);

-- ============================================================
-- SERVER SEEDS (provably fair)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tg_server_seeds (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seed            TEXT NOT NULL UNIQUE,
  seed_hash       TEXT NOT NULL UNIQUE,
  status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'revealed')),
  max_nonce       INT NOT NULL DEFAULT 10000,
  current_nonce   INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  revealed_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tg_seeds_status ON public.tg_server_seeds(status);
