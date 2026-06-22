const { getBalance, createWithdrawal, updateBalance, validateTelegramInitData } = require('../src/supabase');
const { rateLimit, getClientIp } = require('../src/rate-limit');

const CHAINS = ['evm', 'sol', 'ton'];
const MIN_WITHDRAWAL = { evm: 0.0005, sol: 0.005, ton: 0.5 };

function validateAddress(chain, addr) {
  if (chain === 'evm') return /^0x[a-fA-F0-9]{40}$/.test(addr);
  if (chain === 'sol') return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
  if (chain === 'ton') return /^(0:[a-f0-9]{64}|[A-Za-z0-9_-]{48})$/.test(addr);
  return false;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
  if (!rateLimit(res, `fin:${getClientIp(req)}`, 5, 60_000)) return;

  try {
    const { initData, amount, toAddress, chain = 'evm' } = req.body;
    if (!initData) { res.status(401).json({ error: 'Missing initData' }); return; }
    if (!CHAINS.includes(chain)) { res.status(400).json({ error: 'Invalid chain. Use evm, sol, or ton' }); return; }

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
    if (!toAddress || !validateAddress(chain, toAddress)) {
      const hints = { evm: '0x...', sol: 'Base58 (32-44 chars)', ton: '0:hex or base64' };
      return res.status(400).json({ error: `Invalid ${chain.toUpperCase()} address. Expected: ${hints[chain]}` });
    }

    const withdrawAmount = parseFloat(amount);
    const min = MIN_WITHDRAWAL[chain];
    const symbol = { evm: 'ETH', sol: 'SOL', ton: 'TON' }[chain];
    if (withdrawAmount < min) {
      return res.status(400).json({ error: `Minimum withdrawal is ${min} ${symbol}` });
    }

    const bal = await getBalance(userId);
    const balanceKey = `balance_${chain}`;
    const balance = parseFloat(bal[balanceKey] || '0');
    if (balance < withdrawAmount) {
      return res.status(400).json({ error: 'Insufficient balance', balance, chain });
    }

    await updateBalance(userId, chain, -withdrawAmount);
    const withdrawal = await createWithdrawal(userId, chain, toAddress.toLowerCase(), withdrawAmount);

    return res.json({
      success: true,
      withdrawal_id: withdrawal.id,
      amount: withdrawAmount,
      chain,
      to_address: toAddress,
      status: 'pending',
      message: `${withdrawAmount} ${symbol} withdrawal request submitted. Processing shortly.`,
    });
  } catch (e) {
    console.error('Withdraw error:', e.message);
    res.status(500).json({ error: e.message });
  }
};
