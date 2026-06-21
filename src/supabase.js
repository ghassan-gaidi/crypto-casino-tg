"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.ensureUser = ensureUser;
exports.connectWallet = connectWallet;
exports.getWalletConnection = getWalletConnection;
exports.getUserWallets = getUserWallets;
exports.getBalance = getBalance;
exports.updateBalance = updateBalance;
exports.createDeposit = createDeposit;
exports.confirmDeposit = confirmDeposit;
exports.createWithdrawal = createWithdrawal;
exports.completeWithdrawal = completeWithdrawal;
exports.recordBet = recordBet;
exports.getActiveSeed = getActiveSeed;
exports.createServerSeed = createServerSeed;
exports.incrementSeedNonce = incrementSeedNonce;
exports.revealSeed = revealSeed;
exports.getOrCreateJackpotRound = getOrCreateJackpotRound;
exports.enterJackpotRound = enterJackpotRound;
exports.closeJackpotRound = closeJackpotRound;
exports.finalizeJackpotRound = finalizeJackpotRound;
exports.getJackpotEntries = getJackpotEntries;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
exports.db = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
// ── Users ──
async function ensureUser(telegramId, username, firstName) {
    const { data, error } = await exports.db
        .from('tg_users')
        .upsert({ id: telegramId, username, first_name: firstName }, { onConflict: 'id' })
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
// ── Wallet Connections ──
async function connectWallet(userId, chain, address, signature) {
    const { data, error } = await exports.db
        .from('tg_wallet_connections')
        .upsert({ user_id: userId, chain, address, signature }, { onConflict: 'user_id,chain' })
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
async function getWalletConnection(userId, chain) {
    const { data } = await exports.db
        .from('tg_wallet_connections')
        .select('*')
        .eq('user_id', userId)
        .eq('chain', chain)
        .single();
    return data;
}
async function getUserWallets(userId) {
    const { data } = await exports.db.from('tg_wallet_connections').select('*').eq('user_id', userId);
    return data ?? [];
}
// ── Balances ──
async function getBalance(userId) {
    const { data } = await exports.db.from('tg_balances').select('*').eq('user_id', userId).single();
    return data ?? { user_id: userId, balance: 0, balance_evm: 0, balance_sol: 0, balance_ton: 0 };
}
async function updateBalance(userId, chain, delta) {
    const col = chain === 'evm' ? 'balance_evm' : chain === 'solana' ? 'balance_sol' : 'balance_ton';
    const { data, error } = await exports.db.rpc('tg_update_balance', {
        p_user_id: userId,
        p_chain_col: col,
        p_delta: delta,
    });
    if (error)
        throw error;
    return data;
}
// ── Deposits ──
async function createDeposit(userId, chain, txHash, fromAddress, toAddress, amount) {
    const { data, error } = await exports.db
        .from('tg_deposits')
        .insert({
        user_id: userId,
        chain,
        tx_hash: txHash,
        from_address: fromAddress,
        to_address: toAddress,
        amount,
    })
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
async function confirmDeposit(txHash) {
    const { data, error } = await exports.db
        .from('tg_deposits')
        .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
        .eq('tx_hash', txHash)
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
// ── Withdrawals ──
async function createWithdrawal(userId, chain, toAddress, amount) {
    const { data, error } = await exports.db
        .from('tg_withdrawals')
        .insert({ user_id: userId, chain, to_address: toAddress, amount })
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
async function completeWithdrawal(id, txHash) {
    const { data, error } = await exports.db
        .from('tg_withdrawals')
        .update({ status: 'completed', tx_hash: txHash, completed_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
// ── Bets ──
async function recordBet(params) {
    const { data, error } = await exports.db
        .from('tg_bets')
        .insert({
        user_id: params.userId,
        game: params.game,
        chain: params.chain,
        bet_amount: params.betAmount,
        payout: params.payout,
        outcome: params.outcome,
        server_seed: params.serverSeed,
        client_seed: params.clientSeed,
        nonce: params.nonce,
        result_hash: params.resultHash,
        player_won: params.playerWon,
        settled: true,
    })
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
// ── Server Seeds ──
async function getActiveSeed() {
    const { data } = await exports.db
        .from('tg_server_seeds')
        .select('*')
        .eq('status', 'active')
        .single();
    return data;
}
async function createServerSeed(seed, seedHash) {
    const { data, error } = await exports.db
        .from('tg_server_seeds')
        .insert({ seed, seed_hash: seedHash, max_nonce: 10000 })
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
async function incrementSeedNonce(seedId) {
    const { data, error } = await exports.db.rpc('tg_increment_seed_nonce', { p_seed_id: seedId });
    if (error)
        throw error;
    return data;
}
async function revealSeed(seedId) {
    const { data, error } = await exports.db
        .from('tg_server_seeds')
        .update({ status: 'revealed', revealed_at: new Date().toISOString() })
        .eq('id', seedId)
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
// ── Jackpot ──
async function getOrCreateJackpotRound() {
    // Get the latest open round or create one
    let { data } = await exports.db
        .from('tg_jackpot_rounds')
        .select('*')
        .eq('status', 'open')
        .single();
    if (!data) {
        const { data: newRound, error } = await exports.db
            .from('tg_jackpot_rounds')
            .insert({ status: 'open' })
            .select()
            .single();
        if (error)
            throw error;
        return newRound;
    }
    return data;
}
async function enterJackpotRound(roundId, userId, amount, chain) {
    // Get current entry count and assign ticket number
    const { count, error: countErr } = await exports.db
        .from('tg_jackpot_entries')
        .select('*', { count: 'exact', head: true })
        .eq('round_id', roundId);
    if (countErr) throw countErr;
    const ticketNumber = (count || 0) + 1;
    // Insert entry
    const { error: insertErr } = await exports.db
        .from('tg_jackpot_entries')
        .insert({ round_id: roundId, user_id: userId, amount, ticket_number: ticketNumber, chain });
    if (insertErr) throw insertErr;
    // Update round prize pool and entry count atomically
    const { error: updateErr } = await exports.db.rpc('tg_jackpot_add_entry', {
        p_round_id: roundId,
        p_amount: amount,
    });
    if (updateErr) {
        // Fallback: direct update if RPC doesn't exist
        const round = (await exports.db.from('tg_jackpot_rounds').select('prize_pool').eq('id', roundId).single()).data;
        await exports.db.from('tg_jackpot_rounds').update({ prize_pool: Number(round?.prize_pool || 0) + amount, entry_count: ticketNumber }).eq('id', roundId);
    }
    return ticketNumber;
}
async function closeJackpotRound(roundId, serverSeed, clientSeed) {
    const { data, error } = await exports.db
        .from('tg_jackpot_rounds')
        .update({ status: 'spinning', server_seed: serverSeed, client_seed: clientSeed })
        .eq('id', roundId)
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
async function finalizeJackpotRound(roundId, winnerId, winningTicket, payout, houseCut, resultHash) {
    const { data, error } = await exports.db
        .from('tg_jackpot_rounds')
        .update({
            status: 'closed',
            winner_id: winnerId,
            winning_ticket: winningTicket,
            winner_payout: payout,
            house_cut: houseCut,
            result_hash: resultHash,
            closed_at: new Date().toISOString(),
        })
        .eq('id', roundId)
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
async function getJackpotEntries(roundId) {
    const { data } = await exports.db
        .from('tg_jackpot_entries')
        .select('*')
        .eq('round_id', roundId)
        .order('ticket_number', { ascending: true });
    return data ?? [];
}
