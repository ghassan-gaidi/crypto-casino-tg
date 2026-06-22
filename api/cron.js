/**
 * GET /api/cron — Auto-deposit detection cron (Vercel Cron)
 * Scans Base chain for incoming ETH to hot wallet + per-user deposit addresses.
 * Credits balances automatically and returns summary.
 *
 * Secured by CRON_SECRET header verification.
 */
const { detectEvmDeposits, checkEvmTxConfirmations } = require('../src/wallet');
const { db, getDepositAddressByAddress, createDeposit, confirmDeposit, updateBalance } = require('../src/supabase');

module.exports = async function handler(req, res) {
  // Verify cron secret (Vercel Cron sends this header)
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const results = { detected: 0, credited: 0, pending: 0, errors: [] };

  try {
    // 1. Scan hot wallet for deposits
    const deposits = await detectEvmDeposits();
    results.detected = deposits.length;

    for (const dep of deposits) {
      try {
        // Match from-address to a user's connected wallet
        const { data: conn } = await db
          .from('tg_wallet_connections')
          .select('user_id')
          .ilike('address', dep.from)
          .eq('chain', 'evm')
          .single();

        // Also check deposit_addresses table (per-user deposit addresses)
        const depAddr = await getDepositAddressByAddress(dep.to);
        const userId = conn?.user_id || depAddr?.user_id;

        if (!userId) {
          // Can't identify user — log but skip
          results.errors.push({ txHash: dep.txHash, error: 'No user matched for from/to address' });
          continue;
        }

        const amountEth = parseFloat(dep.value) / 1e18;

        // Check confirmations
        const { confirmed, confirmations } = await checkEvmTxConfirmations(dep.txHash, 3);

        // Record deposit
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
          }
        } else {
          results.pending++;
        }
      } catch (e) {
        results.errors.push({ txHash: dep.txHash, error: e.message });
      }
    }

    // 2. Re-check previously pending deposits for confirmations
    const { data: pendingDeposits } = await db
      .from('tg_deposits')
      .select('tx_hash, user_id, amount')
      .eq('chain', 'evm')
      .eq('status', 'pending')
      .limit(50);

    if (pendingDeposits?.length) {
      for (const pd of pendingDeposits) {
        try {
          const { confirmed } = await checkEvmTxConfirmations(pd.tx_hash, 3);
          if (confirmed) {
            await confirmDeposit(pd.tx_hash);
            await updateBalance(pd.user_id, 'evm', pd.amount);
            results.credited++;
          }
        } catch (e) {
          results.errors.push({ txHash: pd.tx_hash, error: e.message });
        }
      }
    }

    res.json({ success: true, ...results, timestamp: new Date().toISOString() });
  } catch (e) {
    console.error('Cron error:', e.message);
    res.status(500).json({ error: e.message, ...results });
  }
};
