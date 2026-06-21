-- Create referrals table
CREATE TABLE IF NOT EXISTS tg_referrals (
  id BIGSERIAL PRIMARY KEY,
  referrer_id BIGINT NOT NULL REFERENCES tg_users(id) ON DELETE CASCADE,
  referred_id BIGINT UNIQUE NOT NULL REFERENCES tg_users(id) ON DELETE CASCADE,
  reward_earned NUMERIC(20,8) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for looking up referrer by referred user
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON tg_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON tg_referrals(referred_id);

-- RPC: atomically add referral reward and credit referrer's balance
CREATE OR REPLACE FUNCTION tg_add_referral_reward(
  p_referrer_id BIGINT,
  p_amount NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
  v_new_reward NUMERIC;
BEGIN
  -- Update referral reward total
  UPDATE tg_referrals
  SET reward_earned = reward_earned + p_amount
  WHERE referrer_id = p_referrer_id
  RETURNING reward_earned INTO v_new_reward;

  -- Credit referrer's balance (evm by default)
  UPDATE tg_balances
  SET balance_evm = balance_evm + p_amount
  WHERE user_id = p_referrer_id;

  RETURN v_new_reward;
END;
$$ LANGUAGE plpgsql;
