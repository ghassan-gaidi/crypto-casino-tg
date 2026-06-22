/**
 * GET /api/cron — Auto-deposit detection cron (Vercel Cron)
 * Scans EVM, Solana, and TON for incoming deposits.
 * Credits balances automatically and returns summary.
 *
 * Secured by CRON_SECRET header verification.
 */
const { detectEvmDeposits, checkEvmTxConfirmations, getSolBalance, verifySolDepositTx, getTonBalance, verifyTonDepositTx } = require('../src/wallet');
const { db, getDepositAddressByAddress, createDeposit, confirmDeposit, updateBalance } = require('../src/supabase');

module.exports = async function handler(req, res) {
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const results = { detected: 0, credited: 0, pending: 0, errors: [], chains: { evm: 0, sol: 0, ton: 0 } };

  try {
    // ── 1. EVM deposits (existing logic) ──
    const evmDeposits = await detectEvmDeposits();
    results.detected += evmDeposits.length;

    for (const dep of evmDeposits) {
      try {
        const { data: conn } = await db
          .from('tg_wallet_connections')
          .select('user_id')
          .ilike('address', dep.from)
          .eq('chain', 'evm')
          .single();

        const depAddr = await getDepositAddressByAddress(dep.to);
        const userId = conn?.user_id || depAddr?.user_id;

        if (!userId) {
          results.errors.push({ txHash: dep.txHash, chain: 'evm', error: 'No user matched' });
          continue;
        }

        const amountEth = parseFloat(dep.value) / 1e18;
        const { confirmed } = await checkEvmTxConfirmations(dep.txHash, 3);

        const existing = await db
          .from('tg_deposits')
          .select('id,status')
          .eq('tx_hash', dep.txHash)
          .single();

        if (!existing.data) {
          await createDeposit(userId, 'evm', dep.txHash, dep.from, dep.to, amountEth);
        }

        if (confirmed) {
          if (existing.data?.status !== 'confirmed') {
            await confirmDeposit(dep.txHash);
            await updateBalance(userId, 'evm', amountEth);
            results.credited++;
            results.chains.evm++;
          }
        } else {
          results.pending++;
        }
      } catch (e) {
        results.errors.push({ txHash: dep.txHash, chain: 'evm', error: e.message });
      }
    }

    // ── 2. Re-check pending EVM deposits ──
    const { data: pendingEvm } = await db
      .from('tg_deposits')
      .select('tx_hash, user_id, amount')
      .eq('chain', 'evm')
      .eq('status', 'pending')
      .limit(50);

    if (pendingEvm?.length) {
      for (const pd of pendingEvm) {
        try {
          const { confirmed } = await checkEvmTxConfirmations(pd.tx_hash, 3);
          if (confirmed) {
            await confirmDeposit(pd.tx_hash);
            await updateBalance(pd.user_id, 'evm', pd.amount);
            results.credited++;
            results.chains.evm++;
          }
        } catch (e) {
          results.errors.push({ txHash: pd.tx_hash, chain: 'evm', error: e.message });
        }
      }
    }

    // ── 3. Solana — check pending deposits for confirmations ──
    const { data: pendingSol } = await db
      .from('tg_deposits')
      .select('tx_hash, user_id, amount, to_address')
      .eq('chain', 'sol')
      .eq('status', 'pending')
      .limit(20);

    if (pendingSol?.length) {
      for (const pd of pendingSol) {
        try {
          const { valid, confirmations } = await verifySolDepositTx(pd.tx_hash, pd.user_id);
          if (valid && confirmations >= 1) {
            await confirmDeposit(pd.tx_hash);
            await updateBalance(pd.user_id, 'sol', pd.amount);
            results.credited++;
            results.chains.sol++;
          }
        } catch (e) {
          results.errors.push({ txHash: pd.tx_hash, chain: 'sol', error: e.message });
        }
      }
    }

    // ── 4. TON — check pending deposits for confirmations ──
    const { data: pendingTon } = await db
      .from('tg_deposits')
      .select('tx_hash, user_id, amount, to_address')
      .eq('chain', 'ton')
      .eq('status', 'pending')
      .limit(20);

    if (pendingTon?.length) {
      for (const pd of pendingTon) {
        try {
          const { valid } = await verifyTonDepositTx(pd.tx_hash, pd.user_id);
          if (valid) {
            await confirmDeposit(pd.tx_hash);
            await updateBalance(pd.user_id, 'ton', pd.amount);
            results.credited++;
            results.chains.ton++;
          }
        } catch (e) {
          results.errors.push({ txHash: pd.tx_hash, chain: 'ton', error: e.message });
        }
      }
    }

    res.json({ success: true, ...results, timestamp: new Date().toISOString() });
  } catch (e) {
    console.error('Cron error:', e.message);
    res.status(500).json({ error: e.message, ...results });
  }
};
