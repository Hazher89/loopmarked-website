/* ═══════════════════════════════════════════════════
   LOOP MARKED — Dashboard JavaScript
   Supabase data loading, navigation, popups
   ═══════════════════════════════════════════════════ */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jyfnjuxijkqkjxsreezo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_SWb674hU1E-fh9ahe9XS3w_V91MMTk2';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let activeChatId = null;
let activeChatSubscription = null;

// ═══════ AUTH GUARD & INIT ═══════
async function init() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        window.location.href = '/auth.html';
        return;
    }

    currentUser = session.user;
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('dashboardLayout').style.display = 'flex';

    // Load initial data
    await Promise.all([
        loadProfile(),
        loadWallet(),
        loadTransactions(),
        loadUnreadCount(),
        loadMarketplace(), // New
        loadMyListings()   // New
    ]);

    // Check daily bonus
    checkDailyBonus();

    // Check broadcasts
    checkBroadcasts();

    // Setup realtime
    setupRealtime();

    // Messages are loaded when the tab is clicked, but we can pre-fetch
    loadConversations();

    console.log('✅ Dashboard initialized for:', currentUser.email);
}

// ═══════ PROFILE ═══════
async function loadProfile() {
    try {
        const { data } = await supabase
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
                    if (el) el.innerHTML = `<img src="${data.avatar_url}" alt="Avatar" />`;
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
        const { data } = await supabase
            .from('wallets')
            .select('coin_balance')
            .eq('user_id', currentUser.id)
            .single();

        if (data) {
            const lumet = data.coin_balance || 0;
            const lumo = (lumet / 100).toFixed(1);
            const lumetFormatted = lumet.toLocaleString();

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
        const { data } = await supabase
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
                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

// ═══════ STORAGE IMAGE HELPER ═══════
// Fetches listing images from Supabase Storage (same logic as the Flutter app)
async function getListingImageUrl(listingId) {
    try {
        const { data: files } = await supabase.storage
            .from('listing-images')
            .list(listingId, { limit: 1, sortBy: { column: 'name', order: 'asc' } });

        if (files && files.length > 0) {
            const fileName = files[0].name;
            if (/\.(jpg|jpeg|png|webp)$/i.test(fileName)) {
                const { data } = supabase.storage
                    .from('listing-images')
                    .getPublicUrl(`${listingId}/${fileName}`);
                return data.publicUrl;
            }
        }
    } catch (e) {
        // Storage folder might not exist for this listing
    }
    return null;
}

// ═══════ MARKETPLACE ═══════
async function loadMarketplace() {
    try {
        const { data, error } = await supabase
            .from('listings')
            .select('id, title, price, seller_id, location, created_at')
            .order('created_at', { ascending: false })
            .limit(50);

        if (data) {
            document.getElementById('statListings').textContent = data.length;
            await renderListings(data, 'marketplaceGrid');
        }
    } catch (err) {
        console.error('Marketplace error:', err);
    }
}

async function loadMyListings() {
    try {
        const { data, error } = await supabase
            .from('listings')
            .select('*')
            .eq('seller_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (data) {
            await renderListings(data, 'myListingsGrid', true);
        }
    } catch (err) {
        console.error('My listings error:', err);
    }
}

async function renderListings(listings, containerId, isOwner = false) {
    const container = document.getElementById(containerId);
    if (!listings || listings.length === 0) {
        container.innerHTML = `<div class="empty-state-dash"><p>No listings found.</p></div>`;
        return;
    }

    // Show loading state
    container.innerHTML = `<div class="empty-state-dash"><div class="loading-spinner"></div></div>`;

    // Fetch images from Storage in parallel for all listings
    const imagePromises = listings.map(item => getListingImageUrl(item.id));
    const imageUrls = await Promise.all(imagePromises);

    container.innerHTML = listings.map((item, idx) => {
        const priceLumo = (item.price / 100).toFixed(0);
        const imageUrl = imageUrls[idx] || '/images/app-icon.png'; // Fallback

        // Don't show contact button if I own the listing
        const contactBtn = (!isOwner && item.seller_id !== currentUser.id)
            ? `<button class="contact-btn" onclick="contactSeller('${item.id}', '${item.seller_id}')" style="margin-top:8px;width:100%;padding:8px;background:rgba(0,240,255,0.1);color:var(--accent-cyan);border:1px solid rgba(0,240,255,0.3);border-radius:8px;cursor:pointer;font-weight:600;">Message Owner</button>`
            : '';

        return `
            <div class="listing-card">
                <div class="listing-image">
                    <img src="${imageUrl}" alt="${item.title}" loading="lazy" onerror="this.src='/images/app-icon.png'" />
                </div>
                <div class="listing-details">
                    <div class="listing-price">${priceLumo} L</div>
                    <div class="listing-title">${item.title}</div>
                    <div class="listing-meta">
                        <span>${item.location || 'Unknown'}</span>
                        <span>${new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    ${contactBtn}
                </div>
            </div>
        `;
    }).join('');
}

window.contactSeller = async function (listingId, sellerId) {
    if (!currentUser) return;

    try {
        // 1. Check if chat exists
        const { data: existingChats } = await supabase
            .from('chats')
            .select('id')
            .eq('listing_id', listingId)
            .eq('buyer_id', currentUser.id)
            .eq('seller_id', sellerId)
            .maybeSingle();

        let chatId = existingChats?.id;

        // 2. Create if not exists
        if (!chatId) {
            const { data: newChat, error } = await supabase
                .from('chats')
                .insert({
                    listing_id: listingId,
                    buyer_id: currentUser.id,
                    seller_id: sellerId,
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            chatId = newChat.id;
        }

        // 3. Switch to Messages Tab
        document.querySelector('.sidebar-link[data-section="messages"]').click();

        // 4. Reload conversations to include new chat
        await loadConversations();

        // 5. Select the chat
        // We rely on loadConversations to render it, then we find it
        setTimeout(() => {
            const chatEl = document.querySelector(`.chat-item[data-id="${chatId}"]`);
            if (chatEl) chatEl.click();
        }, 800);

    } catch (err) {
        console.error('Contact seller error:', err);
        alert('Could not start chat. Please try via the mobile app.');
    }
}


window.openCreateListing = function () {
    alert("To create a listing, please download the Loop Marked app on iOS or Android for the best experience!");
}

// ═══════ MESSAGES (CHAT) ═══════
async function loadConversations() {
    try {
        // Fetch chats where user is buyer OR seller
        const { data: chats, error } = await supabase
            .from('chats')
            .select(`
                *,
                listing:listings(title, image_urls)
            `)
            .or(`buyer_id.eq.${currentUser.id},seller_id.eq.${currentUser.id}`)
            .order('updated_at', { ascending: false });

        const container = document.getElementById('chatList');
        if (!chats || chats.length === 0) {
            container.innerHTML = `<div class="empty-state-dash"><p>No conversations yet.</p></div>`;
            return;
        }

        // We need to fetch profiles for the OTHER user in each chat
        container.innerHTML = ''; // limited clear

        for (const chat of chats) {
            const otherUserId = chat.buyer_id === currentUser.id ? chat.seller_id : chat.buyer_id;

            // Fetch profile for name/avatar
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', otherUserId)
                .single();

            const name = profile?.full_name || 'User';
            const avatar = profile?.avatar_url || '/images/app-icon.png';
            const listingTitle = chat.listing?.title || 'Item';
            const lastMsg = chat.last_message_preview || 'Start chatting...';

            const div = document.createElement('div');
            div.className = 'chat-item';
            div.dataset.id = chat.id;
            div.onclick = () => selectChat(chat.id, name, avatar, listingTitle);

            div.innerHTML = `
                <div class="chat-avatar"><img src="${avatar}" alt="${name}"></div>
                <div class="chat-info">
                    <div class="chat-name">${name}</div>
                    <div class="chat-preview">${listingTitle} • ${lastMsg}</div>
                </div>
            `;
            container.appendChild(div);
        }

    } catch (err) {
        console.error('Chat list error:', err);
    }
}

window.selectChat = async function (chatId, name, avatar, listingTitle) {
    activeChatId = chatId;

    // UI Update
    document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`.chat-item[data-id="${chatId}"]`)?.classList.add('active');

    // Setup Chat Window
    const chatWindow = document.getElementById('chatWindow');
    chatWindow.innerHTML = `
        <div class="chat-header">
            <div class="chat-avatar" style="width:32px;height:32px;"><img src="${avatar}" alt="${name}"></div>
            <div class="chat-header-info">
                <h3>${name}</h3>
                <span>${listingTitle}</span>
            </div>
        </div>
        <div class="chat-messages" id="messageList">
            <div class="loading-spinner"></div>
        </div>
        <div class="chat-input-area">
            <input type="text" class="chat-input" id="messageInput" placeholder="Type a message..." onkeypress="handleEnter(event)">
            <button class="send-btn" onclick="sendMessage()">➤</button>
        </div>
    `;

    // Load Messages
    loadMessages(chatId);

    // Realtime subscription for this chat
    subscribeToChat(chatId);
}

async function loadMessages(chatId) {
    const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

    renderMessages(messages);
}

function renderMessages(messages) {
    const list = document.getElementById('messageList');
    if (!list) return;

    list.innerHTML = '';
    if (!messages || messages.length === 0) {
        list.innerHTML = `<div style="text-align:center;color:gray;margin-top:20px;">No messages yet. Say hi!</div>`;
        return;
    }

    messages.forEach(msg => {
        const isMe = msg.sender_id === currentUser.id;
        const div = document.createElement('div');
        div.className = `message ${isMe ? 'sent' : 'received'}`;
        div.textContent = msg.content;
        list.appendChild(div);
    });

    // Scroll to bottom
    list.scrollTop = list.scrollHeight;
}

window.handleEnter = function (e) {
    if (e.key === 'Enter') sendMessage();
}

window.sendMessage = async function () {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    if (!content || !activeChatId) return;

    input.value = ''; // Clear locally immediately

    try {
        await supabase.from('messages').insert({
            chat_id: activeChatId,
            sender_id: currentUser.id,
            content: content,
            message_type: 'text',
            created_at: new Date().toISOString()
        });

        // Optimistic update (optional, but realtime should catch it fast)
    } catch (err) {
        console.error('Send error:', err);
    }
}

function subscribeToChat(chatId) {
    if (activeChatSubscription) supabase.removeChannel(activeChatSubscription);

    activeChatSubscription = supabase
        .channel(`chat:${chatId}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `chat_id=eq.${chatId}`
        }, (payload) => {
            const list = document.getElementById('messageList');
            if (payload.new && list) {
                const msg = payload.new;
                const isMe = msg.sender_id === currentUser.id;
                const div = document.createElement('div');
                div.className = `message ${isMe ? 'sent' : 'received'}`;
                div.textContent = msg.content;
                list.appendChild(div);
                list.scrollTop = list.scrollHeight;
            }
        })
        .subscribe();
}

// ═══════ UNREAD MESSAGES ═══════
async function loadUnreadCount() {
    try {
        const { data } = await supabase.rpc('get_unread_counts', { p_user_id: currentUser.id });
        if (data) {
            const totalUnread = Array.isArray(data) ? data.reduce((sum, c) => sum + (c.unread_count || 0), 0) : 0;
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
    const lastClaimed = localStorage.getItem('lm_daily_bonus_web');
    const today = new Date().toISOString().split('T')[0];
    if (lastClaimed !== today) {
        setTimeout(() => { document.getElementById('dailyBonusPopup').style.display = 'flex'; }, 2000);
    }
}

window.claimDailyBonus = async function () {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('lm_daily_bonus_web', today);
    try {
        await supabase.rpc('claim_daily_bonus', { p_user_id: currentUser.id });
        await loadWallet();
    } catch (err) { console.error(err); }
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
        const { data } = await supabase.from('broadcasts').select('*').eq('is_active', true).limit(1);
        if (data && data.length > 0) {
            const b = data[0];
            if (!localStorage.getItem(`lm_broadcast_${b.id}`)) {
                setTimeout(() => {
                    document.getElementById('broadcastTitle').textContent = b.title;
                    document.getElementById('broadcastMessage').textContent = b.message;
                    document.getElementById('broadcastPopup').style.display = 'flex';
                    document.getElementById('broadcastPopup').dataset.broadcastId = b.id;
                }, 4000);
            }
        }
    } catch (e) { }
}

window.closeBroadcast = function () {
    const popup = document.getElementById('broadcastPopup');
    if (popup.dataset.broadcastId) localStorage.setItem(`lm_broadcast_${popup.dataset.broadcastId}`, 'dismissed');
    popup.style.display = 'none';
};

// ═══════ REALTIME ═══════
function setupRealtime() {
    supabase.channel('web-global')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${currentUser.id}` }, loadWallet)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wallet_transactions', filter: `user_id=eq.${currentUser.id}` }, () => { loadTransactions(); loadWallet(); })
        .subscribe();
}

// ═══════ SIDEBAR NAVIGATION ═══════
document.querySelectorAll('.sidebar-link[data-section]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.dataset.section;

        // Tab switching
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        document.getElementById(`section-${section}`).classList.add('active');
        document.getElementById('pageTitle').textContent = section.charAt(0).toUpperCase() + section.slice(1);
        document.getElementById('sidebar').classList.remove('open');

        // Lazy load chats if switching to messages
        if (section === 'messages') loadConversations();
    });
});

document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
});

window.handleLogout = async function () {
    await supabase.auth.signOut();
    window.location.href = '/';
};

init();
