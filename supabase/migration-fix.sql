-- Crypto Casino TG — Fixed Schema Migration
-- Run this to fix critical bugs: game CHECK, missing columns, missing tables, missing RPCs

-- ============================================================
-- 1. Fix tg_bets.game CHECK — allow all 9 games
-- ============================================================
ALTER TABLE public.tg_bets DROP CONSTRAINT IF EXISTS tg_bets_game_check;
ALTER TABLE public.tg_bets ADD CONSTRAINT tg_bets_game_check
  CHECK (game IN ('dice', 'coinflip', 'crash', 'mines', 'plinko', 'slots', 'roulette', 'limbo', 'jackpot'));

-- ============================================================
-- 2. Fix tg_server_seeds — add user_id column + per-user index
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tg_server_seeds' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.tg_server_seeds ADD COLUMN user_id BIGINT;
  END IF;
END $$;

-- Backfill user_id from existing seeds if needed (optional, safe to skip)
-- UPDATE tg_server_seeds SET user_id = 0 WHERE user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_tg_seeds_user ON public.tg_server_seeds(user_id);
CREATE INDEX IF NOT EXISTS idx_tg_seeds_user_active ON public.tg_server_seeds(user_id, status);

-- ============================================================
-- 3. Add missing tables
-- ============================================================

-- Jackpot Rounds
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

-- Jackpot Entries
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

-- Referrals
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
-- 4. RPC Functions
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
  -- Ensure balance row exists
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

-- ============================================================
-- 5. Fix chain naming: rename 'sol' deposits to 'solana'
-- ============================================================
UPDATE public.tg_deposits SET chain = 'solana' WHERE chain = 'sol';
UPDATE public.tg_deposit_addresses SET chain = 'solana' WHERE chain = 'sol';
UPDATE public.tg_withdrawals SET chain = 'solana' WHERE chain = 'sol';
