"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEvmProvider = getEvmProvider;
exports.getEvmSigner = getEvmSigner;
exports.checkEvmTxConfirmations = checkEvmTxConfirmations;
exports.verifyDepositTx = verifyDepositTx;
exports.sendEvmTx = sendEvmTx;
exports.detectEvmDeposits = detectEvmDeposits;
const ethers_1 = require("ethers");
const supabase_1 = require("./supabase");
// ── EVM (Base) ──
function getEvmProvider() {
    return new ethers_1.JsonRpcProvider(process.env.BASE_RPC_URL);
}
function getEvmSigner() {
    return new ethers_1.Wallet(process.env.HOT_WALLET_PK, getEvmProvider());
}
/**
 * Check if a transaction has enough confirmations on Base
 */
async function checkEvmTxConfirmations(txHash, minConfirmations = 12) {
    const provider = getEvmProvider();
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt)
        return { confirmed: false, confirmations: 0 };
    const currentBlock = await provider.getBlockNumber();
    const confirmations = currentBlock - receipt.blockNumber + 1;
    return { confirmed: confirmations >= minConfirmations, confirmations };
}
/**
 * Verify a deposit TX: check it sent funds to the hot wallet and has enough confirmations
 */
async function verifyDepositTx(txHash) {
    try {
        const provider = getEvmProvider();
        const tx = await provider.getTransaction(txHash);
        if (!tx)
            return { valid: false, error: 'Transaction not found' };
        const receipt = await provider.getTransactionReceipt(txHash);
        if (!receipt)
            return { valid: false, error: 'Transaction not yet confirmed' };
        const currentBlock = await provider.getBlockNumber();
        const confirmations = currentBlock - receipt.blockNumber + 1;
        // Check it went to the hot wallet
        const hotWallet = (process.env.HOT_WALLET_PK
            ? new ethers_1.Wallet(process.env.HOT_WALLET_PK).address
            : '').toLowerCase();
        if (!tx.to || tx.to.toLowerCase() !== hotWallet) {
            return { valid: false, error: `Transaction did not go to the casino hot wallet` };
        }
        return {
            valid: true,
            from: tx.from,
            to: tx.to,
            value: tx.value.toString(),
            confirmations,
        };
    }
    catch (err) {
        return { valid: false, error: err.message };
    }
}
/**
 * Send ETH from hot wallet
 */
async function sendEvmTx(to, valueWei) {
    const signer = getEvmSigner();
    const tx = await signer.sendTransaction({
        to,
        value: valueWei,
    });
    return tx.hash;
}
// ── Deposit polling ──
const HOT_WALLET_CACHE = { address: '' };
function getHotWalletAddress() {
    if (!HOT_WALLET_CACHE.address && process.env.HOT_WALLET_PK) {
        HOT_WALLET_CACHE.address = new ethers_1.Wallet(process.env.HOT_WALLET_PK).address.toLowerCase();
    }
    return HOT_WALLET_CACHE.address;
}
/**
 * Scan recent blocks for incoming native ETH transfers to the hot wallet.
 * Returns deposits not yet credited that have enough confirmations.
 */
async function detectEvmDeposits() {
    const provider = getEvmProvider();
    const hotWallet = getHotWalletAddress();
    if (!hotWallet)
        return [];
    const latestBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, latestBlock - 100); // scan last 100 blocks
    // Get existing processed TXs to avoid duplicates
    const { data: processed } = await supabase_1.db
        .from('tg_deposits')
        .select('tx_hash')
        .eq('chain', 'evm');
    const processedSet = new Set((processed || []).map(r => r.tx_hash.toLowerCase()));
    const deposits = [];
    // Scan blocks in batches to avoid overwhelming the RPC
    const batchSize = 10;
    for (let i = fromBlock; i <= latestBlock; i += batchSize) {
        const endBlock = Math.min(i + batchSize - 1, latestBlock);
        const blocks = await Promise.all(Array.from({ length: endBlock - i + 1 }, (_, j) => provider.getBlock(i + j, true)));
        for (const block of blocks) {
            if (!block?.transactions)
                continue;
            for (const tx of block.transactions) {
                const txObj = tx;
                const txTo = typeof txObj.to === 'string' ? txObj.to.toLowerCase() : '';
                if (txTo === hotWallet && !processedSet.has(txObj.hash?.toLowerCase())) {
                    const receipt = await provider.getTransactionReceipt(txObj.hash);
                    if (receipt && receipt.status === 1) {
                        deposits.push({
                            txHash: txObj.hash,
                            from: txObj.from.toLowerCase(),
                            to: txTo,
                            value: txObj.value?.toString() || '0',
                            blockNumber: block.number,
                        });
                    }
                }
            }
        }
    }
    return deposits;
}
// ── Solana ──
// Placeholder — will use @solana/web3.js + @solana/spl-token
// ── TON ──
// Placeholder — will use @ton/ton + @ton/connect
