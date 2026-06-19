-- Update user balance atomically
CREATE OR REPLACE FUNCTION update_balance(
  p_user_id BIGINT,
  p_chain_col TEXT,
  p_delta DECIMAL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance DECIMAL;
  v_result JSONB;
BEGIN
  -- Upsert balance row if not exists
  INSERT INTO public.balances (user_id, balance, balance_evm, balance_sol, balance_ton)
  VALUES (p_user_id, 0, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Update the specific chain column and total balance
  EXECUTE format(
    'UPDATE public.balances
     SET %I = COALESCE(%I, 0) + $2,
         balance = COALESCE(balance, 0) + $2,
         updated_at = now()
     WHERE user_id = $1
     RETURNING balance, balance_evm, balance_sol, balance_ton',
    p_chain_col, p_chain_col
  ) INTO v_balance USING p_user_id, p_delta;

  RETURN jsonb_build_object(
    'success', true,
    'balance', v_balance
  );
END;
$$;

-- Increment current nonce on a server seed
CREATE OR REPLACE FUNCTION increment_seed_nonce(
  p_seed_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_nonce INT;
  v_max_nonce INT;
  v_result JSONB;
BEGIN
  UPDATE public.server_seeds
  SET current_nonce = current_nonce + 1
  WHERE id = p_seed_id
  RETURNING current_nonce, max_nonce INTO v_nonce, v_max_nonce;

  -- Mark as used if max nonce reached
  IF v_nonce >= v_max_nonce THEN
    UPDATE public.server_seeds
    SET status = 'used'
    WHERE id = p_seed_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'current_nonce', v_nonce,
    'max_nonce', v_max_nonce
  );
END;
$$;
