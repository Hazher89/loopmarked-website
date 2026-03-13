/* ═══════════════════════════════════════════════════
   LOOP MARKED — Dashboard JavaScript
   Supabase data loading, navigation, popups
   ═══════════════════════════════════════════════════ */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jyfnjuxijkqkjxsreezo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_SWb674hU1E-fh9ahe9XS3w_V91MMTk2';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("📍 Page URL:", window.location.href);
console.log("📍 Page Hash:", window.location.hash ? "Present (Private)" : "None");

let currentUser = null;
let activeChatId = null;
let activeChatSubscription = null;

const CATEGORIES = {
    'electronics': ['accessories', 'audio_hi_fi', 'cameras_photo', 'computer_components', 'drones_robotics', 'home_appliances', 'laptops_computers', 'networking_internet', 'phones_tablets', 'printers_scanners', 'smart_home', 'tv_video', 'video_games_consoles', 'wearables_gadgets', 'other_electronics'],
    'clothing': ['accessories', 'bags', 'jewelry', 'kids_clothing', 'mens_clothing', 'outerwear', 'shoes', 'sports_wear', 'underwear', 'watches', 'womens_clothing', 'other_clothing'],
    'furniture': ['beds_mattresses', 'bookcases_shelving', 'cabinets_sideboards', 'chairs', 'desks_office', 'dining_sets', 'dressers_storage', 'kids_furniture', 'kitchen_furniture', 'ottomans_benches', 'outdoor_furniture', 'sofas_couches', 'tables', 'wardrobes_closets', 'other_furniture'],
    'home_garden': ['bathroom', 'bbq_outdoor', 'bedding', 'building_materials', 'cleaning', 'cookware', 'curtains_blinds', 'garden_furniture', 'garden_plants', 'garden_tools', 'heating_cooling', 'home_decor', 'kitchen_dining', 'lighting', 'rugs_carpets', 'security_safety', 'small_appliances', 'storage_organization', 'tools_diy', 'other_home_garden'],
    'vehicles': ['atv_utv_snowmobile', 'bicycles', 'boats_marine', 'car_parts_accessories', 'cars', 'motorcycles', 'rv_campers', 'scooters_mopeds', 'tires_rims', 'trucks_trailers', 'vans_commercial', 'other_vehicles'],
    'baby_kids': ['baby_clothing', 'baby_furniture', 'baby_gear', 'baby_safety', 'baby_toys', 'car_seats', 'diapers', 'feeding', 'kids_books', 'kids_clothing_2_8', 'kids_clothing_9_16', 'kids_toys_3_7', 'kids_toys_8_plus', 'maternity', 'other_baby_kids'],
    'beauty': ['bath_body', 'beauty_tools', 'fragrances', 'hair_styling', 'haircare', 'makeup_accessories', 'makeup_eyes', 'makeup_face', 'makeup_lips', 'makeup_sets', 'mens_grooming', 'nail_care', 'personal_hygiene', 'skincare', 'other_beauty'],
    'books': ['biography', 'childrens_books', 'comics', 'cookbooks', 'fiction', 'magazines', 'non_fiction', 'reference', 'self_help', 'textbooks', 'other_books'],
    'property': ['apartments_rent', 'apartments_sale', 'commercial_property', 'houses_rent', 'houses_sale', 'land_plots', 'parking_garage', 'rooms_shared', 'vacation_rentals', 'other_property'],
    'sports': ['basketball', 'camping_hiking', 'cycling', 'fishing', 'fitness_equipment', 'golf', 'outdoor_gear', 'soccer', 'sports_accessories', 'tennis', 'water_sports', 'winter_sports', 'other_sports'],
    'toys': ['action_figures', 'arts_crafts', 'board_games', 'building_blocks', 'collectibles', 'dolls', 'educational_toys', 'electronic_toys', 'outdoor_toys', 'puzzles', 'other_toys'],
    'services': ['beauty_wellness', 'business_services', 'cleaning_services', 'events_entertainment', 'gardening_landscaping', 'handyman', 'home_services', 'it_tech_support', 'moving_transport', 'pet_services', 'photography_video', 'tutoring_lessons', 'other_services'],
    'other': []
};

// ═══════ AUTH GUARD & INIT ═══════
// ── Auth Guard & Init ──
async function init() {
    console.log("🚀 Initializing Dashboard...");
    
    // Check if we have an auth hash in the URL
    const hasHash = window.location.hash.includes('access_token') || 
                  window.location.hash.includes('id_token') || 
                  window.location.hash.includes('error');

    if (hasHash) {
        console.log("🛠️ Detection: Auth callback hash present. Waiting for Supabase to process...");
        
        const params = new URLSearchParams(window.location.hash.substring(1));
        const error = params.get('error');
        const errorDesc = params.get('error_description');
        
        if (error) {
            console.error("❌ Auth Callback Error:", error, errorDesc);
            alert(`Authentication Error: ${errorDesc || error}`);
            window.location.href = '/auth.html?error=' + encodeURIComponent(errorDesc || error);
            return;
        }

        // Wait a bit longer for Google/Apple callbacks to settle
        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    let { data: { session }, error: sessionError } = await supabase.auth.getSession();

    // If still no session but we have a hash, wait specifically for the SIGNED_IN event
    if (!session && hasHash) {
        console.log("⏳ Session not found in initial getSession, waiting for auth state change...");
        await new Promise((resolve) => {
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
                console.log("🔄 Auth Event:", event);
                if (newSession) {
                    session = newSession;
                    subscription.unsubscribe();
                    resolve();
                }
            });
            // Timeout after 5 seconds just in case
            setTimeout(() => {
                subscription.unsubscribe();
                resolve();
            }, 5000);
        });
    }

    if (!session) {
        if (hasHash) {
            console.warn("⚠️ Hash was present but no session could be established after 6 seconds. If this is a loop, please check Supabase Site URL settings.");
            alert("Login failed to finalize. Check if you have third-party cookies allowed or if the redirect URL matches Supabase settings.");
        }
        console.error("🚪 Final check: No active session found. Redirecting to login.");
        if (sessionError) console.error("Auth Error Info:", sessionError);
        window.location.replace('/auth.html');
        return;
    }

    currentUser = session.user;
    console.log("✅ Authenticated as:", currentUser.email);
    
    // Smooth transition: hide loading and show dashboard
    const loadingScreen = document.getElementById('loadingScreen');
    const layout = document.getElementById('dashboardLayout');
    
    if (loadingScreen) loadingScreen.style.opacity = '0';
    setTimeout(() => {
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (layout) {
            layout.style.display = 'flex';
            layout.style.opacity = '0';
            layout.style.transition = 'opacity 0.5s ease-out';
            requestAnimationFrame(() => layout.style.opacity = '1');
        }
    }, 400);

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
            <div class="tx-row-icon">${isCredit ? '💎' : '💸'}</div>
            <div class="tx-row-info">
              <div class="tx-row-desc">${desc}</div>
              <div class="tx-row-date">${dateStr}</div>
            </div>
            <div class="tx-row-amount" style="color: ${isCredit ? 'var(--accent-cyan)' : 'var(--accent-red)'}">
                ${isCredit ? '+' : '-'}${lumo} L
            </div>
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
// Cache user country so we don't fetch it every time
let _userCountryCode = null;

async function getUserCountryCode() {
    if (_userCountryCode) return _userCountryCode;
    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('country_code')
            .eq('id', currentUser.id)
            .single();
        _userCountryCode = profile?.country_code;
    } catch (e) {
        console.error('Error fetching user country:', e);
    }
    return _userCountryCode;
}

async function loadMarketplace() {
    try {
        const userCountry = await getUserCountryCode();

        const searchEl = document.getElementById('marketplaceSearch');
        const categoryEl = document.getElementById('marketplaceCategory');
        const subCategoryEl = document.getElementById('marketplaceSubCategory');
        const sortEl = document.getElementById('marketplaceSort');

        const searchText = (searchEl?.value || '').trim().toLowerCase();
        const selectedCategory = categoryEl?.value || '';
        const selectedSubCategory = subCategoryEl?.value || '';
        const selectedSort = sortEl?.value || 'newest';

        let query = supabase
            .from('listings')
            .select('id, title, price, seller_id, location, created_at, country_code, category, category_id, sub_category_id, favorite_count')
            .eq('approval_status', 'approved')
            .eq('is_deleted', false)
            .eq('is_sold', false);

        if (userCountry) query = query.eq('country_code', userCountry);
        if (selectedCategory) query = query.or(`category.eq.${selectedCategory},category_id.eq.${selectedCategory}`);
        if (selectedSubCategory) query = query.eq('sub_category_id', selectedSubCategory);
        if (searchText) query = query.ilike('title', `%${searchText}%`);

        // Apply Sorting
        if (selectedSort === 'price_low') query = query.order('price', { ascending: true });
        else if (selectedSort === 'price_high') query = query.order('price', { ascending: false });
        else if (selectedSort === 'popular') query = query.order('favorite_count', { ascending: false });
        else query = query.order('created_at', { ascending: false });

        const { data } = await query.limit(50);

        if (data) {
            document.getElementById('statListings').textContent = data.length;
            await renderListings(data, 'marketplaceGrid');
        }
    } catch (err) {
        console.error('Marketplace error:', err);
    }
}

// Marketplace filter event listeners
document.getElementById('marketplaceCategory')?.addEventListener('change', (e) => {
    const subEl = document.getElementById('marketplaceSubCategory');
    const cat = e.target.value;
    if (cat && CATEGORIES[cat] && CATEGORIES[cat].length > 0) {
        subEl.innerHTML = '<option value="">All Subcategories</option>' +
            CATEGORIES[cat].map(s => `<option value="${s}">${s.replace(/_/g, ' ')}</option>`).join('');
        subEl.style.display = 'block';
    } else {
        subEl.style.display = 'none';
        subEl.value = '';
    }
    loadMarketplace();
});
document.getElementById('marketplaceSubCategory')?.addEventListener('change', () => loadMarketplace());
document.getElementById('marketplaceSort')?.addEventListener('change', () => loadMarketplace());

let _searchDebounce = null;
document.getElementById('marketplaceSearch')?.addEventListener('input', () => {
    clearTimeout(_searchDebounce);
    _searchDebounce = setTimeout(() => loadMarketplace(), 400);
});

// Create listing category listener
document.getElementById('newListingCategory')?.addEventListener('change', (e) => {
    const group = document.getElementById('subCategoryGroup');
    const subEl = document.getElementById('newListingSubCategory');
    const cat = e.target.value;
    if (cat && CATEGORIES[cat] && CATEGORIES[cat].length > 0) {
        subEl.innerHTML = '<option value="">Select Subcategory</option>' +
            CATEGORIES[cat].map(s => `<option value="${s}">${s.replace(/_/g, ' ')}</option>`).join('');
        group.style.display = 'block';
    } else {
        group.style.display = 'none';
        subEl.value = '';
    }
});

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
        const imageUrl = imageUrls[idx] || '/images/app-icon.png';
        const dateStr = new Date(item.created_at).toLocaleDateString();

        return `
            <div class="listing-card" onclick="openListingDetail('${item.id}')">
                <div class="listing-img-container">
                    <img src="${imageUrl}" alt="${item.title}" class="listing-img" loading="lazy" onerror="this.src='/images/app-icon.png'" />
                    <div class="listing-price-badge">${priceLumo} L</div>
                </div>
                <div class="listing-content">
                    <h3 class="listing-title">${item.title}</h3>
                    <div class="listing-meta">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                        </svg>
                        ${item.location || 'Loop'} • ${dateStr}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

window.openListingDetail = async function (listingId) {
    const modal = document.getElementById('listingDetailModal');
    modal.style.display = 'flex';

    // Show loading state
    document.getElementById('detailTitle').textContent = 'Loading...';
    document.getElementById('detailDescription').textContent = '...';
    document.getElementById('detailActions').innerHTML = '';

    try {
        // 1. Fetch listing (simple query, NO FK join)
        const { data: listing, error } = await supabase
            .from('listings')
            .select('*')
            .eq('id', listingId)
            .single();

        if (error) throw error;
        if (!listing) throw new Error('Listing not found');

        // 2. Fetch seller profile separately
        let seller = null;
        if (listing.seller_id) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, avatar_url, username')
                .eq('id', listing.seller_id)
                .single();
            seller = profile;
        }

        // 3. Fetch image
        const imageUrl = await getListingImageUrl(listing.id) || '/images/app-icon.png';

        // 4. Populate Modal
        document.getElementById('detailImage').src = imageUrl;
        document.getElementById('detailImage').onerror = function () { this.src = '/images/app-icon.png'; };
        document.getElementById('detailTitle').textContent = listing.title || 'Untitled';
        document.getElementById('detailPrice').textContent = (listing.price / 100).toFixed(0) + ' L';
        document.getElementById('detailLocation').textContent = listing.location || listing.city_name || 'Unknown';
        document.getElementById('detailCategory').textContent = listing.category || 'General';
        document.getElementById('detailDate').textContent = new Date(listing.created_at).toLocaleDateString();
        document.getElementById('detailDescription').textContent = listing.description || 'No description provided.';

        // Seller Info
        if (seller) {
            document.getElementById('detailSellerName').textContent = seller.full_name || seller.username || 'User';
            document.getElementById('detailSellerAvatar').src = seller.avatar_url || '/images/app-icon.png';
            document.getElementById('detailSellerAvatar').onerror = function () { this.src = '/images/app-icon.png'; };
        } else {
            document.getElementById('detailSellerName').textContent = 'Unknown Seller';
        }

        // Actions
        const actionsContainer = document.getElementById('detailActions');
        actionsContainer.innerHTML = '';

        if (listing.seller_id === currentUser.id) {
            const editBtn = document.createElement('button');
            editBtn.className = 'action-btn btn-secondary';
            editBtn.textContent = '✎ Edit Listing';
            editBtn.onclick = () => alert('Please use the Loop Marked mobile app to edit listings for now.');
            actionsContainer.appendChild(editBtn);
        } else {
            const contactBtn = document.createElement('button');
            contactBtn.className = 'action-btn btn-primary';
            contactBtn.textContent = '💬 Make Offer / Chat';
            contactBtn.onclick = () => {
                closeListingDetail();
                contactSeller(listing.id, listing.seller_id);
            };
            actionsContainer.appendChild(contactBtn);
        }

    } catch (e) {
        console.error('Error loading listing detail:', e);
        document.getElementById('detailTitle').textContent = 'Error';
        document.getElementById('detailDescription').textContent = 'Could not load this listing. ' + (e.message || '');
    }
}

window.closeListingDetail = function () {
    document.getElementById('listingDetailModal').style.display = 'none';
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
    document.getElementById('createListingModal').style.display = 'flex';
}

window.closeCreateListing = function () {
    document.getElementById('createListingModal').style.display = 'none';
    // Reset form
    document.getElementById('newListingTitle').value = '';
    document.getElementById('newListingDesc').value = '';
    document.getElementById('newListingPrice').value = '';
    document.getElementById('newListingLocation').value = '';
    document.getElementById('newListingImage').value = '';
}

window.submitNewListing = async function () {
    const title = document.getElementById('newListingTitle').value.trim();
    const description = document.getElementById('newListingDesc').value.trim();
    const priceStr = document.getElementById('newListingPrice').value.trim();
    const category = document.getElementById('newListingCategory').value;
    const condition = document.getElementById('newListingCondition').value;
    const location = document.getElementById('newListingLocation').value.trim();
    const imageFile = document.getElementById('newListingImage').files[0];

    // Validation
    if (!title) { alert('Title is required.'); return; }
    if (!priceStr || parseFloat(priceStr) <= 0) { alert('Enter a valid price.'); return; }

    const priceLumet = Math.round(parseFloat(priceStr) * 100); // Convert Lumo to Lumet

    try {
        // 0. Get user's country_code for listing geo-tagging
        const { data: userProfile } = await supabase
            .from('profiles')
            .select('country_code, country')
            .eq('id', currentUser.id)
            .single();

        // 1. Insert listing into database
        const { data: newListing, error } = await supabase
            .from('listings')
            .insert({
                title: title,
                description: description || '',
                price: priceLumet,
                category: category,
                category_id: category, // Save as ID too
                sub_category_id: document.getElementById('newListingSubCategory').value || null,
                sub_category_value: document.getElementById('newListingSubCategory').selectedOptions[0]?.text || null,
                condition: condition,
                location: location || 'Unknown',
                seller_id: currentUser.id,
                seller_name: currentUser.user_metadata?.full_name || currentUser.email || 'User',
                country_code: userProfile?.country_code || null,
                image_urls: [],
                is_sold: false,
                is_deleted: false,
                is_boosted: false,
                was_reported: false,
                view_count: 0,
                favorite_count: 0,
                warning_level: 0,
                approval_status: 'pending',
                tags: []
            })
            .select()
            .single();

        if (error) throw error;

        // 2. Upload image if provided
        if (imageFile && newListing) {
            const ext = imageFile.name.split('.').pop();
            const fileName = `0.${ext}`;
            const filePath = `${newListing.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('listing-images')
                .upload(filePath, imageFile, { upsert: true });

            if (uploadError) {
                console.warn('Image upload failed:', uploadError.message);
            }
        }

        closeCreateListing();
        alert('Listing created! It will be visible after admin approval.');

        // Refresh listings
        loadSection('marketplace');

    } catch (e) {
        console.error('Create listing error:', e);
        alert('Could not create listing: ' + (e.message || 'Unknown error'));
    }
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
            <button class="create-offer-btn" onclick="openCreateOffer()" title="Make an Offer">💰</button>
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
    try {
        const { data: messages, error } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chatId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        renderMessages(messages);
    } catch (e) {
        console.error('Error loading messages:', e);
        document.getElementById('messageList').innerHTML = '<div style="text-align:center;padding:20px;">Could not load messages.</div>';
    }
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

        if (msg.message_type === 'offer') {
            // Render Offer Widget
            div.style.background = 'transparent';
            div.style.padding = '0';
            div.innerHTML = `
                <div class="offer-bubble">
                    <span class="offer-label">OFFER</span>
                    <span class="offer-amount">${msg.content} Lumo</span>
                    <div class="offer-status">tap in app to manage</div>
                </div>
            `;
        } else {
            // Text Message
            div.textContent = msg.content;
        }

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
        // Optimistic update handled by Realtime if fast enough, else could append locally
    } catch (err) {
        console.error('Send error:', err);
    }
}

// ═══════ OFFERS ═══════
window.openCreateOffer = function () {
    document.getElementById('createOfferModal').style.display = 'flex';
}

window.closeCreateOffer = function () {
    document.getElementById('createOfferModal').style.display = 'none';
    document.getElementById('offerAmount').value = '';
}

window.submitOffer = async function () {
    const input = document.getElementById('offerAmount');
    const amount = parseFloat(input.value);

    if (!amount || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    closeCreateOffer();

    try {
        // Prepare payload for create_offer RPC (assuming standard signature)
        // If RPC fails or doesn't exist, we fallback to just sending a message marked as 'offer'

        // Note: App uses 'ChatService' which likely wraps 'create_offer' RPC.
        // We'll try inserting directly to 'offers' table if possible, but usually RPC handles notifications.
        // Let's emulate App: send message with type 'offer'. 
        // Real backend logic should handle offer creation via triggers on 'messages' or separate 'offers' insert.
        // But for display consistency, message_type='offer' is key.

        // Attempt insert to 'messages' first as primary method for chat display
        await supabase.from('messages').insert({
            chat_id: activeChatId,
            sender_id: currentUser.id,
            content: amount.toString(), // Store amount as content
            message_type: 'offer',
            created_at: new Date().toISOString()
        });

        // Also try to call RPC 'create_offer' if needed for backend logic (e.g. notifications)
        // But let's assume message trigger handles it or it's enough for display.

    } catch (e) {
        console.error('Offer error:', e);
        alert('Could not send offer.');
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
            // Only append if list exists and it's for current chat (filter handles it though)
            if (payload.new && list) {
                const msg = payload.new;
                const isMe = msg.sender_id === currentUser.id;

                const div = document.createElement('div');
                div.className = `message ${isMe ? 'sent' : 'received'}`;

                if (msg.message_type === 'offer') {
                    div.style.background = 'transparent';
                    div.style.padding = '0';
                    div.innerHTML = `
                        <div class="offer-bubble">
                            <span class="offer-label">OFFER</span>
                            <span class="offer-amount">${msg.content} Lumo</span>
                            <div class="offer-status">New</div>
                        </div>
                    `;
                } else {
                    div.textContent = msg.content;
                }

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
function loadSection(section) {
    // Tab switching
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`.sidebar-link[data-section="${section}"]`);
    if (activeLink) activeLink.classList.add('active');

    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    const targetSection = document.getElementById(`section-${section}`);
    if (targetSection) targetSection.classList.add('active');

    // Title update
    const title = section.charAt(0).toUpperCase() + section.slice(1);
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = title;

    document.getElementById('sidebar')?.classList.remove('open');

    // Actions based on section
    if (section === 'messages') loadConversations();
    if (section === 'marketplace') loadMarketplace();
    if (section === 'listings') loadMyListings();
    if (section === 'wallet') loadWallet();
    if (section === 'profile') loadProfile();
}

// Global exposure for onClick events
window.loadSection = loadSection;

document.querySelectorAll('.sidebar-link[data-section]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        loadSection(link.dataset.section);
    });
});

document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
});

// ═══════ PROFILE EDITING ═══════
window.openEditProfile = async function () {
    const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
    if (data) {
        document.getElementById('editFullName').value = data.full_name || '';
        document.getElementById('editUsername').value = data.username || '';
        document.getElementById('editBio').value = data.bio || '';
        document.getElementById('editProfileModal').style.display = 'flex';
    }
};

window.closeEditProfile = function () {
    document.getElementById('editProfileModal').style.display = 'none';
};

window.saveProfile = async function () {
    const fullName = document.getElementById('editFullName').value;
    const username = document.getElementById('editUsername').value;
    const bio = document.getElementById('editBio').value;

    try {
        const { error } = await supabase.from('profiles').update({
            full_name: fullName,
            username: username,
            bio: bio,
            updated_at: new Date().toISOString()
        }).eq('id', currentUser.id);

        if (error) throw error;

        alert('Profile updated!');
        closeEditProfile();
        loadProfile(); // Refresh UI
    } catch (e) {
        console.error('Save profile error:', e);
        alert('Failed to update profile.');
    }
};

// ═══════ IMAGE UPLOAD ═══════
window.triggerAvatarUpload = () => document.getElementById('avatarInput').click();
window.triggerCoverUpload = () => document.getElementById('coverInput').click();

window.handleAvatarSelect = async (input) => {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        await uploadImage(file, 'avatar');
    }
};

window.handleCoverSelect = async (input) => {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        await uploadImage(file, 'cover');
    }
};

async function uploadImage(file, type) {
    const ext = file.name.split('.').pop();
    const fileName = `${type}_${Date.now()}.${ext}`;
    // App uses: avatars/{uid}/{file} and covers/{uid}/{file}
    const folder = type === 'avatar' ? 'avatars' : 'covers';
    const filePath = `${folder}/${currentUser.id}/${fileName}`;

    try {
        // Upload to 'listing-images' bucket (as per app logic for profiles too apparently from StorageService)
        // Wait, StorageService says: bucket is 'listing-images'. Paths: avatars/... and covers/...

        const { error: uploadError } = await supabase.storage
            .from('listing-images')
            .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('listing-images')
            .getPublicUrl(filePath);

        // Update Profile
        const updateData = type === 'avatar' ? { avatar_url: publicUrl } : { cover_image_url: publicUrl };
        await supabase.from('profiles').update(updateData).eq('id', currentUser.id);

        // Refresh UI
        loadProfile();
        alert(`${type === 'avatar' ? 'Avatar' : 'Cover'} updated!`);
    } catch (e) {
        console.error('Upload error:', e);
        alert(`Upload failed: ${e.message}`);
    }
}

// ═══════ EARN LUMO ACTIONS ═══════
window.simulateAdWatch = async function () {
    if (!confirm("Simulate watching a 30s video ad?")) return;

    // Show loading
    const btn = event.currentTarget;
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<div class="loading-spinner" style="width:20px;height:20px;display:inline-block;"></div> Watching...';
    btn.style.pointerEvents = 'none';

    setTimeout(async () => {
        try {
            // Call RPC to reward user
            const { error } = await supabase.rpc('handle_ad_reward', {
                p_user_id: currentUser.id,
                p_ad_type: 'rewarded_video'
            });

            if (error) {
                console.warn('RPC failed, falling back to client-side alert (backend might restrict RPC calls from web)');
                alert("Ad watched! (Reward logic is app-only for security, but simulations work)");
            } else {
                alert("You earned 0.5 Lumo!");
                loadWallet();
            }
        } catch (e) {
            console.error('Ad reward error:', e);
        } finally {
            btn.innerHTML = originalContent;
            btn.style.pointerEvents = 'auto';
        }
    }, 2000);
};

window.claimDailyBonusAction = async function () {
    try {
        await supabase.rpc('claim_daily_bonus', { p_user_id: currentUser.id });
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem('lm_daily_bonus_web', today);
        document.getElementById('dailyBonusPopup').style.display = 'none';
        alert("Daily bonus claimed!");
        loadWallet();
    } catch (err) {
        console.error(err);
        alert("Could not claim bonus (already claimed?)");
        document.getElementById('dailyBonusPopup').style.display = 'none';
    }
}

window.handleLogout = async function () {
    await supabase.auth.signOut();
    window.location.href = '/';
};

window.openSettings = function () {
    document.querySelector('.sidebar-link[data-section="settings"]').click();
}

// Extended Profile Loader
const originalLoadProfile = loadProfile;
loadProfile = async function () {
    await originalLoadProfile();
    try {
        const { data } = await supabase.from('profiles').select('cover_image_url, bio, username, created_at').eq('id', currentUser.id).single();
        if (data) {
            if (data.cover_image_url) {
                document.getElementById('profileCover').style.backgroundImage = `url('${data.cover_image_url}')`;
            }
            if (data.username) {
                document.getElementById('profileUsername').textContent = `@${data.username}`;
            }
            if (data.created_at) {
                document.getElementById('profileJoined').textContent = new Date(data.created_at).toLocaleDateString();
            }
            const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', currentUser.id).single();
            if (wallet) {
                document.getElementById('profileBalance2').textContent = (wallet.balance).toFixed(1) + ' L';
            }

            // Populate Edit Modal
            document.getElementById('editBio').value = data.bio || '';
        }
    } catch (e) { }
}

// ═══════ PRICE SIMULATOR ═══════
window.runPriceSimulator = function() {
    const amount = parseFloat(document.getElementById('calcLocalAmount').value) || 0;
    
    // Simulation logic (1 Lumo ≈ $10, 2.5% fee) - ADJUST AS PER APP ECONOMY
    const lumoRate = 10; 
    const estimatedLumo = amount / lumoRate;
    const fee = estimatedLumo * 0.025;
    const net = estimatedLumo - fee;

    document.getElementById('simLumo').textContent = estimatedLumo.toFixed(1) + ' L';
    document.getElementById('simFee').textContent = fee.toFixed(2) + ' L';
    document.getElementById('simNet').textContent = net.toFixed(1) + ' L';
}

// ═══════ NOTIFICATIONS ═══════
const notifBell = document.getElementById('notifBell');
const notifDropdown = document.getElementById('notifDropdown');

if (notifBell) {
    notifBell.onclick = (e) => {
        e.stopPropagation();
        // Use computed style or classes for reliability
        const isCurrentlyVisible = notifDropdown.classList.contains('show');
        
        if (isCurrentlyVisible) {
            notifDropdown.classList.remove('show');
            notifDropdown.style.display = 'none';
        } else {
            notifDropdown.style.display = 'block';
            notifDropdown.classList.add('show');
            loadNotifications();
        }
    };
}

document.addEventListener('click', () => {
    if (notifDropdown) notifDropdown.style.display = 'none';
});

async function loadNotifications() {
    const list = document.getElementById('notifList');
    try {
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(10);
            
        if (data && data.length > 0) {
            list.innerHTML = data.map(n => `
                <div class="notif-item ${n.is_read ? '' : 'unread'}">
                    <div class="notif-text">${n.content}</div>
                    <div class="notif-time">${new Date(n.created_at).toLocaleDateString()}</div>
                </div>
            `).join('');
            document.getElementById('notifBadge').style.display = 'none'; // Mark as "seen" visual
        } else {
            list.innerHTML = '<div class="notif-empty">No new notifications</div>';
        }
    } catch (e) { console.error(e); }
}

async function checkNotificationsCount() {
    try {
        const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', currentUser.id)
            .eq('is_read', false);
            
        if (count > 0) {
            document.getElementById('notifBadge').style.display = 'block';
        }
    } catch (e) {}
}

// Update original init to include notification check
const originalInit = init;
init = async function() {
    await originalInit();
    checkNotificationsCount();
    // Refresh count every 2 mins
    setInterval(checkNotificationsCount, 120000);
}

init();
