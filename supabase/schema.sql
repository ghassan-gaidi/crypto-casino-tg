-- Crypto Casino TG — Complete Supabase Schema
-- Tables prefixed with tg_ to avoid conflicts

-- ============================================================
-- TG USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tg_users (
  id            BIGINT PRIMARY KEY,
  username      TEXT,
  first_name    TEXT,
  language_code TEXT DEFAULT 'en',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- WALLET CONNECTIONS
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
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'rejected')),
  error_message   TEXT,
  requested_at    TIMESTAMPTZ DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tg_withdrawals_user ON public.tg_withdrawals(user_id);

-- ============================================================
-- BETS (all 9 games)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tg_bets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         BIGINT NOT NULL REFERENCES public.tg_users(id) ON DELETE CASCADE,
  game            TEXT NOT NULL CHECK (game IN ('dice', 'coinflip', 'crash', 'mines', 'plinko', 'slots', 'roulette', 'limbo', 'jackpot')),
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
-- SERVER SEEDS (provably fair, per-user)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tg_server_seeds (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         BIGINT NOT NULL REFERENCES public.tg_users(id) ON DELETE CASCADE,
  seed            TEXT NOT NULL,
  seed_hash       TEXT NOT NULL,
  status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'revealed')),
  max_nonce       INT NOT NULL DEFAULT 10000,
  current_nonce   INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  revealed_at     TIMESTAMPTZ,
  UNIQUE(user_id, seed_hash)
);

CREATE INDEX IF NOT EXISTS idx_tg_seeds_status ON public.tg_server_seeds(status);
CREATE INDEX IF NOT EXISTS idx_tg_seeds_user ON public.tg_server_seeds(user_id);
CREATE INDEX IF NOT EXISTS idx_tg_seeds_user_active ON public.tg_server_seeds(user_id, status);

-- ============================================================
-- JACKPOT ROUNDS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tg_jackpot_rounds (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status          TEXT DEFAULT 'open' CHECK (status IN ('open', 'spinning', 'closed')),
  prize_pool      DECIMAL(20,8) NOT NULL DEFAULT 0,
  entry_count     INT NOT NULL DEFAULT 0,
  winner_id       BIGINT,
  winning_ticket  INT,
  winner_payout   DECIMAL(20,8),
  house_cut       DECIMAL(20,8),
  server_seed     TEXT,
  client_seed     TEXT,
  result_hash     TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  closed_at       TIMESTAMPTZ
);

-- ============================================================
-- JACKPOT ENTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tg_jackpot_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id        UUID NOT NULL REFERENCES public.tg_jackpot_rounds(id) ON DELETE CASCADE,
  user_id         BIGINT NOT NULL REFERENCES public.tg_users(id) ON DELETE CASCADE,
  amount          DECIMAL(20,8) NOT NULL,
  ticket_number   INT NOT NULL,
  chain           TEXT NOT NULL DEFAULT 'evm',
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(round_id, ticket_number)
);

CREATE INDEX IF NOT EXISTS idx_tg_jackpot_entries_round ON public.tg_jackpot_entries(round_id);

-- ============================================================
-- REFERRALS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tg_referrals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id     BIGINT NOT NULL REFERENCES public.tg_users(id) ON DELETE CASCADE,
  referred_id     BIGINT NOT NULL REFERENCES public.tg_users(id) ON DELETE CASCADE,
  reward_earned   DECIMAL(20,8) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(referred_id)
);

CREATE INDEX IF NOT EXISTS idx_tg_referrals_referrer ON public.tg_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_tg_referrals_referred ON public.tg_referrals(referred_id);

-- ============================================================
-- RPC FUNCTIONS
-- ============================================================

-- Atomic balance update
CREATE OR REPLACE FUNCTION public.tg_update_balance(
  p_user_id BIGINT,
  p_chain_col TEXT,
  p_delta DECIMAL(20,8)
) RETURNS DECIMAL(20,8) AS $$
DECLARE
  new_bal DECIMAL(20,8);
BEGIN
  INSERT INTO public.tg_balances (user_id, balance, balance_evm, balance_sol, balance_ton)
  VALUES (p_user_id, 0, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  IF p_chain_col = 'balance_evm' THEN
    UPDATE public.tg_balances
    SET balance_evm = balance_evm + p_delta,
        balance = balance + p_delta,
        updated_at = now()
    WHERE user_id = p_user_id
    RETURNING balance_evm INTO new_bal;
  ELSIF p_chain_col = 'balance_sol' THEN
    UPDATE public.tg_balances
    SET balance_sol = balance_sol + p_delta,
        balance = balance + p_delta,
        updated_at = now()
    WHERE user_id = p_user_id
    RETURNING balance_sol INTO new_bal;
  ELSIF p_chain_col = 'balance_ton' THEN
    UPDATE public.tg_balances
    SET balance_ton = balance_ton + p_delta,
        balance = balance + p_delta,
        updated_at = now()
    WHERE user_id = p_user_id
    RETURNING balance_ton INTO new_bal;
  ELSE
    RAISE EXCEPTION 'Invalid chain column: %', p_chain_col;
  END IF;

  RETURN COALESCE(new_bal, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic seed nonce increment
CREATE OR REPLACE FUNCTION public.tg_increment_seed_nonce(
  p_seed_id UUID
) RETURNS INT AS $$
DECLARE
  new_nonce INT;
BEGIN
  UPDATE public.tg_server_seeds
  SET current_nonce = current_nonce + 1
  WHERE id = p_seed_id
  RETURNING current_nonce INTO new_nonce;
  RETURN COALESCE(new_nonce, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Jackpot: add entry (atomic)
CREATE OR REPLACE FUNCTION public.tg_jackpot_add_entry(
  p_round_id UUID,
  p_amount DECIMAL(20,8)
) RETURNS VOID AS $$
BEGIN
  UPDATE public.tg_jackpot_rounds
  SET prize_pool = prize_pool + p_amount,
      entry_count = entry_count + 1
  WHERE id = p_round_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Referral reward: add to referrer (atomic)
CREATE OR REPLACE FUNCTION public.tg_add_referral_reward(
  p_referrer_id BIGINT,
  p_amount DECIMAL(20,8)
) RETURNS VOID AS $$
BEGIN
  UPDATE public.tg_referrals
  SET reward_earned = reward_earned + p_amount
  WHERE referrer_id = p_referrer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
