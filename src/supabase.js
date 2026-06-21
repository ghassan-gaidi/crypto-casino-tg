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
exports.getUserStats = getUserStats;
exports.getLeaderboard = getLeaderboard;
exports.getPlatformStats = getPlatformStats;
exports.getPendingWithdrawals = getPendingWithdrawals;
exports.approveWithdrawal = approveWithdrawal;
exports.rejectWithdrawal = rejectWithdrawal;
exports.getBetById = getBetById;
exports.getRecentBets = getRecentBets;
exports.trackReferral = trackReferral;
exports.getReferralStats = getReferralStats;
exports.getReferrer = getReferrer;
exports.addReferralReward = addReferralReward;
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
    // Auto-reward referrer if house made profit
    const houseProfit = params.betAmount - params.payout;
    if (houseProfit > 0) {
        const reward = Math.round(houseProfit * 0.20 * 1e8) / 1e8;
        if (reward > 0) {
            addReferralReward(params.userId, params.betAmount, params.payout).catch(e =>
                console.error('Referral reward error:', e.message)
            );
        }
    }
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
// ── User Stats ──
async function getUserStats(userId) {
    const { data: bets } = await exports.db
        .from('tg_bets')
        .select('bet_amount, payout, player_won, game, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (!bets) return { total_bets: 0, wins: 0, losses: 0, profit: 0, total_wagered: 0, total_payout: 0, games: {} };
    const stats = { total_bets: bets.length, wins: 0, losses: 0, profit: 0, total_wagered: 0, total_payout: 0, games: {} };
    for (const b of bets) {
        if (b.player_won) stats.wins++;
        else stats.losses++;
        stats.total_wagered += Number(b.bet_amount);
        stats.total_payout += Number(b.payout);
        if (!stats.games[b.game]) stats.games[b.game] = { plays: 0, wins: 0, profit: 0 };
        stats.games[b.game].plays++;
        if (b.player_won) stats.games[b.game].wins++;
        stats.games[b.game].profit += Number(b.payout) - Number(b.bet_amount);
    }
    stats.profit = stats.total_payout - stats.total_wagered;
    stats.win_rate = stats.total_bets > 0 ? (stats.wins / stats.total_bets * 100).toFixed(1) : '0.0';
    return stats;
}
// ── Leaderboard ──
async function getLeaderboard(limit = 10) {
    // Top players by net profit from bets
    const { data } = await exports.db
        .from('tg_bets')
        .select('user_id, bet_amount, payout, player_won');
    if (!data) return [];
    const profits = {};
    for (const b of data) {
        if (!profits[b.user_id]) profits[b.user_id] = 0;
        profits[b.user_id] += Number(b.payout) - Number(b.bet_amount);
    }
    const sorted = Object.entries(profits)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit);
    // Get usernames
    const userIds = sorted.map(([id]) => id);
    const { data: users } = await exports.db
        .from('tg_users')
        .select('id, username, first_name')
        .in('id', userIds);
    const userMap = {};
    if (users) for (const u of users) userMap[u.id] = u;
    return sorted.map(([id, profit], i) => ({
        rank: i + 1,
        user_id: parseInt(id),
        username: userMap[parseInt(id)]?.username,
        first_name: userMap[parseInt(id)]?.first_name,
        profit: Math.round(profit * 1e8) / 1e8,
    }));
}
// ── Platform Stats ──
async function getPlatformStats() {
    const { data: bets } = await exports.db.from('tg_bets').select('bet_amount, payout, player_won');
    const { count: userCount } = await exports.db.from('tg_users').select('*', { count: 'exact', head: true });
    const { count: withdrawalCount } = await exports.db.from('tg_withdrawals').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    if (!bets) return { total_bets: 0, total_wagered: 0, total_payout: 0, house_profit: 0, user_count: userCount || 0, pending_withdrawals: withdrawalCount || 0 };
    let totalWagered = 0, totalPayout = 0, houseWins = 0, playerWins = 0;
    for (const b of bets) {
        totalWagered += Number(b.bet_amount);
        totalPayout += Number(b.payout);
        if (b.player_won) playerWins++;
        else houseWins++;
    }
    return {
        total_bets: bets.length,
        total_wagered: Math.round(totalWagered * 1e8) / 1e8,
        total_payout: Math.round(totalPayout * 1e8) / 1e8,
        house_profit: Math.round((totalWagered - totalPayout) * 1e8) / 1e8,
        house_edge_actual: totalWagered > 0 ? ((totalWagered - totalPayout) / totalWagered * 100).toFixed(2) : '0.00',
        user_count: userCount || 0,
        pending_withdrawals: withdrawalCount || 0,
    };
}
// ── Withdrawal Management ──
async function getPendingWithdrawals() {
    const { data } = await exports.db
        .from('tg_withdrawals')
        .select('*, tg_users!inner(username, first_name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
    return data ?? [];
}
async function approveWithdrawal(id, txHash) {
    const { data, error } = await exports.db
        .from('tg_withdrawals')
        .update({ status: 'completed', tx_hash: txHash, completed_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}
async function rejectWithdrawal(id) {
    const { data, error } = await exports.db
        .from('tg_withdrawals')
        .update({ status: 'rejected' })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    // Refund the user
    if (data) {
        await exports.db.rpc('tg_update_balance', {
            p_user_id: data.user_id,
            p_chain_col: data.chain === 'evm' ? 'balance_evm' : data.chain === 'solana' ? 'balance_sol' : 'balance_ton',
            p_delta: Number(data.amount),
        });
    }
    return data;
}
// ── Bet Verification ──
async function getBetById(betId) {
    const { data } = await exports.db
        .from('tg_bets')
        .select('*')
        .eq('id', betId)
        .single();
    return data;
}
async function getRecentBets(userId, limit = 10) {
    const { data } = await exports.db
        .from('tg_bets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
    return data ?? [];
}
// ── Referrals ──
async function trackReferral(referrerId, referredId) {
    // Don't allow self-referral
    if (referrerId === referredId) return null;
    // Check if already referred
    const { data: existing } = await exports.db
        .from('tg_referrals')
        .select('id')
        .eq('referred_id', referredId)
        .single();
    if (existing) return existing;
    // Create referral
    const { data, error } = await exports.db
        .from('tg_referrals')
        .insert({ referrer_id: referrerId, referred_id: referredId })
        .select()
        .single();
    if (error && error.code !== '23505') throw error; // 23505 = unique violation
    return data;
}
async function getReferralStats(userId) {
    const { data: referrals } = await exports.db
        .from('tg_referrals')
        .select('id, reward_earned, created_at, tg_users!inner(username, first_name)')
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false });
    const list = (referrals || []).map(r => ({
        id: r.id,
        username: r.tg_users?.username,
        first_name: r.tg_users?.first_name,
        reward_earned: Number(r.reward_earned || 0),
        created_at: r.created_at,
    }));
    const totalEarned = list.reduce((s, r) => s + r.reward_earned, 0);
    return { count: list.length, total_earned: Math.round(totalEarned * 1e8) / 1e8, referrals: list };
}
async function getReferrer(userId) {
    const { data } = await exports.db
        .from('tg_referrals')
        .select('referrer_id, tg_users!tg_referrals_referrer_id_fkey(username, first_name)')
        .eq('referred_id', userId)
        .single();
    if (!data) return null;
    return {
        referrer_id: data.referrer_id,
        username: data.tg_users?.username,
        first_name: data.tg_users?.first_name,
    };
}
async function addReferralReward(referredUserId, betAmount, payout) {
    const houseProfit = betAmount - payout;
    if (houseProfit <= 0) return; // No profit to share
    const reward = Math.round(houseProfit * 0.20 * 1e8) / 1e8; // 20% of house edge
    if (reward <= 0) return;
    const { data: referral } = await exports.db
        .from('tg_referrals')
        .select('referrer_id')
        .eq('referred_id', referredUserId)
        .single();
    if (!referral) return; // Not referred
    // Atomically add reward using the RPC
    const { error } = await exports.db.rpc('tg_add_referral_reward', {
        p_referrer_id: referral.referrer_id,
        p_amount: reward,
    });
    if (error) console.error('Referral reward error:', error);
    return reward;
}
