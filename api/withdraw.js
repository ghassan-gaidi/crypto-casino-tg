const { getBalance, createWithdrawal, updateBalance, validateTelegramInitData } = require('../src/supabase');
const { rateLimit, getClientIp } = require('../src/rate-limit');

/**
 * POST /api/withdraw — request a withdrawal
 * Body: { initData, amount, toAddress, chain? }
 */
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  // ── Rate limit: financial per IP (5/min) ──
  if (!rateLimit(res, `fin:${getClientIp(req)}`, 5, 60_000)) return;

  try {
    const { initData, amount, toAddress, chain = 'evm' } = req.body;
    if (!initData) { res.status(401).json({ error: 'Missing initData' }); return; }

    let user;
    if (typeof initData === 'string') {
      user = validateTelegramInitData(initData, process.env.TELEGRAM_BOT_TOKEN);
    } else if (initData?.user?.id) {
      user = { id: initData.user.id, username: initData.user.username };
    }
    if (!user) { res.status(401).json({ error: 'Invalid initData' }); return; }
    const userId = user.id;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    if (!toAddress || !toAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ error: 'Invalid EVM address' });
    }
    const withdrawAmount = parseFloat(amount);
    if (withdrawAmount < 0.0005) {
      return res.status(400).json({ error: 'Minimum withdrawal is 0.0005 ETH' });
    }

    const bal = await getBalance(userId);
    const balance = parseFloat(bal.balance_evm || '0');
    if (balance < withdrawAmount) {
      return res.status(400).json({ error: 'Insufficient balance', balance });
    }

    await updateBalance(userId, 'evm', -withdrawAmount);
    const withdrawal = await createWithdrawal(userId, chain, toAddress.toLowerCase(), withdrawAmount);

    return res.json({
      success: true,
      withdrawal_id: withdrawal.id,
      amount: withdrawAmount,
      to_address: toAddress,
      status: 'pending',
      message: 'Withdrawal request submitted. Processing shortly.',
    });
  } catch (e) {
    console.error('Withdraw error:', e.message);
    res.status(500).json({ error: e.message });
  }
};
