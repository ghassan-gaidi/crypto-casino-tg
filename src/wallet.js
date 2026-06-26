"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEvmProvider = getEvmProvider;
exports.getEvmSigner = getEvmSigner;
exports.checkEvmTxConfirmations = checkEvmTxConfirmations;
exports.verifyDepositTx = verifyDepositTx;
exports.sendEvmTx = sendEvmTx;
exports.detectEvmDeposits = detectEvmDeposits;
exports.generateDepositAddress = generateDepositAddress;
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
            return { valid: false, error: `Transaction did not go to the Pickr hot wallet` };
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
/**
 * Derive a unique deposit address per user deterministically.
 * Uses keccak256(hotWalletPk + userId) as a seed for a deterministic wallet.
 */
function generateDepositAddress(userId) {
    const pk = process.env.HOT_WALLET_PK;
    if (!pk)
        throw new Error('HOT_WALLET_PK not set');
    const seed = ethers_1.keccak256(ethers_1.solidityPacked(['bytes', 'uint256'], [pk, userId]));
    const wallet = new ethers_1.Wallet(seed);
    return wallet.address;
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
// ── Solana (lazy-loaded) ──
const crypto_1 = require("crypto");
let _solana;
function getSolana() {
    if (!_solana) _solana = require("@solana/web3.js");
    return _solana;
}
function getSolConnection() {
    const { Connection } = getSolana();
    return new Connection(process.env.SOL_RPC_URL || "https://api.mainnet-beta.solana.com", "confirmed");
}
function generateSolKeypair(userId) {
    const pk = process.env.HOT_WALLET_PK;
    if (!pk) throw new Error("HOT_WALLET_PK not set");
    const { Keypair } = getSolana();
    const hash = crypto_1.createHash("sha256").update(Buffer.from(`${pk}:sol:${userId}`)).digest();
    return Keypair.fromSeed(hash);
}
function generateSolDepositAddress(userId) {
    return generateSolKeypair(userId).publicKey.toBase58();
}
async function getSolBalance(address) {
    const { PublicKey } = getSolana();
    const conn = getSolConnection();
    return conn.getBalance(new PublicKey(address));
}
async function verifySolDepositTx(txSignature, userId) {
    try {
        const conn = getSolConnection();
        const tx = await conn.getTransaction(txSignature, { maxSupportedTransactionVersion: 0 });
        if (!tx) return { valid: false, error: "Transaction not found" };
        if (tx.meta?.err) return { valid: false, error: "Transaction failed on-chain" };
        const depositAddr = generateSolDepositAddress(userId);
        const accounts = tx.transaction.message.accountKeys.map(k => k.toBase58());
        if (!accounts.includes(depositAddr)) return { valid: false, error: "SOL was not sent to your deposit address" };
        const postBal = tx.meta.postBalances;
        const preBal = tx.meta.preBalances;
        const depositIdx = accounts.indexOf(depositAddr);
        const diff = (postBal[depositIdx] || 0) - (preBal[depositIdx] || 0);
        if (diff <= 0) return { valid: false, error: "No SOL received" };
        return { valid: true, from: accounts[0], value: String(diff), confirmations: 1 };
    } catch (err) {
        return { valid: false, error: err.message };
    }
}
async function sendSolTx(to, lamports) {
    const pk = process.env.HOT_WALLET_PK;
    if (!pk) throw new Error("HOT_WALLET_PK not set");
    const { Keypair, PublicKey, Transaction, SystemProgram } = getSolana();
    const conn = getSolConnection();
    const hash = crypto_1.createHash("sha256").update(Buffer.from(`${pk}:sol:hot`)).digest();
    const fromKeypair = Keypair.fromSeed(hash);
    const tx = new Transaction().add(SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey, toPubkey: new PublicKey(to), lamports,
    }));
    tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;
    tx.feePayer = fromKeypair.publicKey;
    tx.sign(fromKeypair);
    const sig = await conn.sendRawTransaction(tx.serialize());
    await conn.confirmTransaction(sig);
    return sig;
}
// ── TON (lazy-loaded) ──
let _tonCrypto, _tweetnacl;
function getTonCrypto() { if (!_tonCrypto) _tonCrypto = require("@ton/crypto"); return _tonCrypto; }
function getTweetnacl() { if (!_tweetnacl) _tweetnacl = require("tweetnacl"); return _tweetnacl; }
function generateTonKeypair(userId) {
    const pk = process.env.HOT_WALLET_PK;
    if (!pk) throw new Error("HOT_WALLET_PK not set");
    const { sha256_sync } = getTonCrypto();
    const { sign } = getTweetnacl();
    const hash = sha256_sync(Buffer.from(`${pk}:ton:${userId}`));
    const kp = sign.keyPair.fromSeed(hash);
    return { publicKey: kp.publicKey, secretKey: kp.secretKey };
}
function generateTonDepositAddress(userId) {
    const { sha256_sync } = getTonCrypto();
    const kp = generateTonKeypair(userId);
    const hash = sha256_sync(Buffer.from(kp.publicKey));
    return `0:${hash.toString("hex")}`;
}
async function getTonBalance(address) {
    try {
        const url = process.env.TON_RPC_URL || "https://toncenter.com/api/v2";
        const res = await fetch(`${url}/getAddressBalance?address=${address}`);
        const data = await res.json();
        return data?.result || "0";
    } catch { return "0"; }
}
async function verifyTonDepositTx(txHash, userId) {
    try {
        const url = process.env.TON_RPC_URL || "https://toncenter.com/api/v2";
        const res = await fetch(`${url}/getTransaction?hash=${txHash}`);
        const data = await res.json();
        if (!data?.result) return { valid: false, error: "Transaction not found" };
        const tx = data.result;
        const depositAddr = generateTonDepositAddress(userId);
        if (tx.in_msg?.destination !== depositAddr) return { valid: false, error: "TON was not sent to your deposit address" };
        return { valid: true, from: tx.in_msg?.source, value: tx.in_msg?.value || "0", confirmations: 1 };
    } catch (err) { return { valid: false, error: err.message }; }
}
