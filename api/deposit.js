const { getOrCreateDepositAddress, getBalance, createDeposit, confirmDeposit, updateBalance, validateTelegramInitData, db } = require('../src/supabase');
const { generateDepositAddress, verifyDepositTx, checkEvmTxConfirmations, generateSolDepositAddress, verifySolDepositTx, generateTonDepositAddress, verifyTonDepositTx } = require('../src/wallet');
const { rateLimit, getClientIp } = require('../src/rate-limit');

const CHAINS = ['evm', 'solana', 'ton'];
const MIN_DEPOSIT = { evm: 0.0001, solana: 0.001, ton: 0.1 };

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (!rateLimit(res, `fin:${getClientIp(req)}`, 5, 60_000)) return;

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

    // ── GET: return deposit addresses for all chains ──
    if (req.method === 'GET') {
      const addresses = {};
      for (const chain of CHAINS) {
        let addr;
        if (chain === 'evm') addr = generateDepositAddress(userId);
        else if (chain === 'solana') addr = generateSolDepositAddress(userId);
        else addr = generateTonDepositAddress(userId);
        await getOrCreateDepositAddress(userId, chain, addr);
        addresses[chain] = addr;
      }
      const bal = await getBalance(userId);
      return res.json({
        addresses,
        balance: { evm: bal.balance_evm, sol: bal.balance_sol, ton: bal.balance_ton }
      });
    }

    // ── POST: verify TX and credit ──
    const { txHash, chain = 'evm' } = req.body;
    if (!txHash) { res.status(400).json({ error: 'Missing txHash' }); return; }
    if (!CHAINS.includes(chain)) { res.status(400).json({ error: 'Invalid chain. Use evm, sol, or ton' }); return; }

    // Check if already processed
    const { data: existing } = await db
      .from('tg_deposits').select('id,status').eq('tx_hash', txHash).single();
    if (existing?.status === 'confirmed') {
      return res.json({ success: true, message: 'Already credited', status: 'confirmed' });
    }

    // Verify on-chain per chain
    let verification;
    if (chain === 'evm') {
      verification = await verifyDepositTx(txHash);
    } else if (chain === 'solana') {
      verification = await verifySolDepositTx(txHash, userId);
    } else {
      verification = await verifyTonDepositTx(txHash, userId);
    }

    if (!verification.valid) {
      return res.status(400).json({ error: verification.error });
    }

    // Parse amount based on chain
    let amount;
    if (chain === 'evm') {
      amount = parseFloat(verification.value) / 1e18;
    } else if (chain === 'solana') {
      amount = parseFloat(verification.value) / 1e9;
    } else {
      amount = parseFloat(verification.value) / 1e9; // TON nanoton
    }

    const min = MIN_DEPOSIT[chain];
    const symbol = { evm: 'ETH', solana: 'SOL', ton: 'TON' }[chain];
    if (amount < min) {
      return res.status(400).json({ error: `Minimum deposit is ${min} ${symbol}` });
    }

    // Record if new
    if (!existing) {
      await createDeposit(userId, chain, txHash, verification.from?.toLowerCase(), verification.to?.toLowerCase(), amount);
    }

    // Auto-confirm (simplified — skip confirmation count for SOL/TON)
    if (chain === 'evm') {
      const { confirmed, confirmations } = await checkEvmTxConfirmations(txHash, 3);
      if (confirmed) {
        await confirmDeposit(txHash);
        await updateBalance(userId, chain, amount);
        return res.json({ success: true, amount, chain, confirmations, status: 'confirmed' });
      }
      return res.json({ success: true, amount, chain, confirmations, required: 3, status: 'pending' });
    }

    // SOL/TON: confirm immediately (fast finality)
    await confirmDeposit(txHash);
    await updateBalance(userId, chain, amount);
    return res.json({ success: true, amount, chain, confirmations: 1, status: 'confirmed' });

  } catch (e) {
    console.error('Deposit error:', e.message);
    res.status(500).json({ error: e.message });
  }
};
