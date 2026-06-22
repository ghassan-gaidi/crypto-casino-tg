-- Phase 1: Security & Data Integrity
-- 1. Per-user server seeds (was shared across ALL users — critical bug)
-- 2. Fix CHECK constraint to allow all 9 games (was dice+coinflip only)

-- ── Per-user server seeds ──
ALTER TABLE tg_server_seeds ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES tg_users(id);
CREATE INDEX IF NOT EXISTS idx_tg_seeds_user ON tg_server_seeds(user_id);
-- Retire any global seeds so per-user seeds take over
UPDATE tg_server_seeds SET status = 'used' WHERE status = 'active';

-- ── Fix game CHECK constraint (was only dice, coinflip) ──
ALTER TABLE tg_bets DROP CONSTRAINT IF EXISTS tg_bets_game_check;
ALTER TABLE tg_bets ADD CONSTRAINT tg_bets_game_check
  CHECK (game IN ('dice', 'coinflip', 'crash', 'mines', 'plinko', 'slots', 'roulette', 'limbo', 'jackpot'));
