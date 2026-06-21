-- RPC to atomically add an entry to a jackpot round
CREATE OR REPLACE FUNCTION tg_jackpot_add_entry(p_round_id BIGINT, p_amount NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE tg_jackpot_rounds
  SET prize_pool = prize_pool + p_amount,
      entry_count = entry_count + 1
  WHERE id = p_round_id;
END;
$$;
