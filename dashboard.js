/* ═══════════════════════════════════════════════════
   LOOP MARKED — Dashboard JavaScript
   Supabase data loading, navigation, popups
   ═══════════════════════════════════════════════════ */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jyfnjuxijkqkjxsreezo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_SWb674hU1E-fh9ahe9XS3w_V91MMTk2';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let walletData = null;

// ═══════ AUTH GUARD ═══════
async function init() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        window.location.href = '/auth.html';
        return;
    }

    currentUser = session.user;
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('dashboardLayout').style.display = 'flex';

    // Load data
    await Promise.all([
        loadProfile(),
        loadWallet(),
        loadTransactions(),
        loadUnreadCount(),
    ]);

    // Check daily bonus
    checkDailyBonus();

    // Check broadcasts
    checkBroadcasts();

    // Setup realtime
    setupRealtime();

    console.log('✅ Dashboard initialized for:', currentUser.email);
}

// ═══════ PROFILE ═══════
async function loadProfile() {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('username, full_name, avatar_url, created_at')
            .eq('id', currentUser.id)
            .single();

        if (data) {
            const name = data.full_name || data.username || currentUser.email?.split('@')[0] || 'User';
            document.getElementById('profileName').textContent = name;
            document.getElementById('profileEmail').textContent = currentUser.email || '';

            if (data.created_at) {
                const d = new Date(data.created_at);
                document.getElementById('profileJoined').textContent = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            }

            if (data.avatar_url) {
                const avatarElements = [document.getElementById('userAvatar'), document.getElementById('profileAvatar')];
                avatarElements.forEach(el => {
                    if (el) {
                        el.innerHTML = `<img src="${data.avatar_url}" alt="Avatar" />`;
                    }
                });
            }
        }
    } catch (err) {
        console.error('Profile error:', err);
    }
}

// ═══════ WALLET ═══════
async function loadWallet() {
    try {
        const { data, error } = await supabase
            .from('wallets')
            .select('coin_balance')
            .eq('user_id', currentUser.id)
            .single();

        if (data) {
            walletData = data;
            const lumet = data.coin_balance || 0;
            const lumo = (lumet / 100).toFixed(1);
            const lumetFormatted = lumet.toLocaleString();

            // Update all balance displays
            document.getElementById('lumoBalance').textContent = lumo;
            document.getElementById('balanceMain').textContent = lumo;
            document.getElementById('balanceSub').textContent = `${lumetFormatted} Lumet`;
            document.getElementById('walletBalance').textContent = lumo;
            document.getElementById('walletSub').textContent = `${lumetFormatted} Lumet`;
            document.getElementById('profileBalance2').textContent = `${lumo} L`;
        }
    } catch (err) {
        console.error('Wallet error:', err);
    }
}

// ═══════ TRANSACTIONS ═══════
async function loadTransactions() {
    try {
        const { data, error } = await supabase
            .from('wallet_transactions')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (data && data.length > 0) {
            const container = document.getElementById('transactionsList');
            container.innerHTML = data.map(tx => {
                const isCredit = tx.amount > 0;
                const lumo = (Math.abs(tx.amount) / 100).toFixed(1);
                const date = new Date(tx.created_at);
                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' • ' +
                    date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                const desc = tx.description || tx.type || 'Transaction';

                return `
          <div class="tx-row">
            <div class="tx-row-icon ${isCredit ? 'credit' : 'debit'}">${isCredit ? '↗' : '↘'}</div>
            <div class="tx-row-info">
              <div class="tx-row-desc">${desc}</div>
              <div class="tx-row-date">${dateStr}</div>
            </div>
            <div class="tx-row-amount ${isCredit ? 'credit' : 'debit'}">${isCredit ? '+' : ''}${lumo} L</div>
          </div>
        `;
            }).join('');
        }
    } catch (err) {
        console.error('Transactions error:', err);
    }
}

// ═══════ UNREAD MESSAGES ═══════
async function loadUnreadCount() {
    try {
        const { data, error } = await supabase.rpc('get_unread_counts', {
            p_user_id: currentUser.id,
        });

        if (data) {
            const totalUnread = Array.isArray(data)
                ? data.reduce((sum, c) => sum + (c.unread_count || 0), 0)
                : 0;

            document.getElementById('statMessages').textContent = totalUnread;

            const badge = document.getElementById('msgBadge');
            if (totalUnread > 0) {
                badge.textContent = totalUnread;
                badge.style.display = 'flex';
            }
        }
    } catch (err) {
        console.error('Unread count error:', err);
    }
}

// ═══════ DAILY BONUS ═══════
async function checkDailyBonus() {
    try {
        const lastClaimed = localStorage.getItem('lm_daily_bonus_web');
        const today = new Date().toISOString().split('T')[0];

        if (lastClaimed !== today) {
            // Show daily bonus popup after 2 seconds
            setTimeout(() => {
                document.getElementById('dailyBonusPopup').style.display = 'flex';
            }, 2000);
        }
    } catch (err) {
        console.error('Daily bonus check error:', err);
    }
}

window.claimDailyBonus = async function () {
    try {
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem('lm_daily_bonus_web', today);

        // Call RPC to claim bonus if it exists
        const { data, error } = await supabase.rpc('claim_daily_bonus', {
            p_user_id: currentUser.id,
        });

        // Refresh wallet
        await loadWallet();
    } catch (err) {
        console.error('Claim bonus error:', err);
    }

    document.getElementById('dailyBonusPopup').style.display = 'none';
};

window.closeDailyBonus = function () {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('lm_daily_bonus_web', today);
    document.getElementById('dailyBonusPopup').style.display = 'none';
};

// ═══════ BROADCASTS ═══════
async function checkBroadcasts() {
    try {
        const { data, error } = await supabase
            .from('broadcasts')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1);

        if (data && data.length > 0) {
            const broadcast = data[0];
            const dismissedKey = `lm_broadcast_${broadcast.id}`;

            if (!localStorage.getItem(dismissedKey)) {
                setTimeout(() => {
                    document.getElementById('broadcastTitle').textContent = broadcast.title || 'Announcement';
                    document.getElementById('broadcastMessage').textContent = broadcast.message || '';
                    document.getElementById('broadcastPopup').style.display = 'flex';

                    // Store broadcast ID for dismiss
                    document.getElementById('broadcastPopup').dataset.broadcastId = broadcast.id;
                }, 4000);
            }
        }
    } catch (err) {
        // Broadcasts table may not exist
        console.log('No broadcasts available');
    }
}

window.closeBroadcast = function () {
    const popup = document.getElementById('broadcastPopup');
    const id = popup.dataset.broadcastId;
    if (id) {
        localStorage.setItem(`lm_broadcast_${id}`, 'dismissed');
    }
    popup.style.display = 'none';
};

// ═══════ REALTIME ═══════
function setupRealtime() {
    // Listen for wallet changes
    supabase
        .channel('web-wallet')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'wallets',
            filter: `user_id=eq.${currentUser.id}`,
        }, () => {
            loadWallet();
        })
        .subscribe();

    // Listen for new transactions
    supabase
        .channel('web-transactions')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'wallet_transactions',
            filter: `user_id=eq.${currentUser.id}`,
        }, () => {
            loadTransactions();
            loadWallet();
        })
        .subscribe();
}

// ═══════ SIDEBAR NAVIGATION ═══════
document.querySelectorAll('.sidebar-link[data-section]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.dataset.section;

        // Update active states
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        // Show section
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        document.getElementById(`section-${section}`).classList.add('active');

        // Update title
        document.getElementById('pageTitle').textContent =
            section.charAt(0).toUpperCase() + section.slice(1);

        // Close mobile sidebar
        document.getElementById('sidebar').classList.remove('open');
    });
});

// Mobile menu
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });
}

// ═══════ LOGOUT ═══════
window.handleLogout = async function () {
    await supabase.auth.signOut();
    window.location.href = '/';
};

// ═══════ INIT ═══════
init();
