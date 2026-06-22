const { getOrCreateDepositAddress, getBalance, createDeposit, confirmDeposit, updateBalance, validateTelegramInitData, db } = require('../src/supabase');
const { generateDepositAddress, verifyDepositTx, checkEvmTxConfirmations } = require('../src/wallet');

/**
 * GET /api/deposit — return user's deposit address
 * POST /api/deposit — verify a TX hash and credit balance
 */
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    const initData = req.method === 'GET' ? req.query.initData : req.body?.initData;
    if (!initData) { res.status(401).json({ error: 'Missing initData' }); return; }

    let user;
    if (typeof initData === 'string') {
      user = validateTelegramInitData(initData, process.env.TELEGRAM_BOT_TOKEN);
    } else if (initData?.user?.id) {
      user = { id: initData.user.id, username: initData.user.username };
    }
    if (!user) { res.status(401).json({ error: 'Invalid initData' }); return; }
    const userId = user.id;

    if (req.method === 'GET') {
      const address = generateDepositAddress(userId);
      await getOrCreateDepositAddress(userId, 'evm', address);
      const bal = await getBalance(userId);
      return res.json({ address, chain: 'evm', balance: bal.balance_evm });
    }

    // POST — verify TX and credit
    const { txHash } = req.body;
    if (!txHash) { res.status(400).json({ error: 'Missing txHash' }); return; }

    // Check if already processed
    const { data: existing } = await db
      .from('tg_deposits').select('id,status').eq('tx_hash', txHash).single();
    if (existing?.status === 'confirmed') {
      return res.json({ success: true, message: 'Already credited', status: 'confirmed' });
    }

    // Verify on-chain
    const verification = await verifyDepositTx(txHash);
    if (!verification.valid) {
      return res.status(400).json({ error: verification.error });
    }

    const amountEth = parseFloat(verification.value) / 1e18;
    if (amountEth < 0.0001) {
      return res.status(400).json({ error: 'Minimum deposit is 0.0001 ETH' });
    }

    // Record if new
    if (!existing) {
      await createDeposit(userId, 'evm', txHash, verification.from.toLowerCase(), verification.to.toLowerCase(), amountEth);
    }

    // Check confirmations
    const { confirmed, confirmations } = await checkEvmTxConfirmations(txHash, 3);
    if (confirmed) {
      await confirmDeposit(txHash);
      await updateBalance(userId, 'evm', amountEth);
      return res.json({ success: true, amount: amountEth, confirmations, status: 'confirmed' });
    }
    return res.json({ success: true, amount: amountEth, confirmations, required: 3, status: 'pending' });
  } catch (e) {
    console.error('Deposit error:', e.message);
    res.status(500).json({ error: e.message });
  }
};
