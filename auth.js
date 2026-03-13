/* ═══════════════════════════════════════════════════
   LOOP MARKED — Auth JavaScript
   Supabase Authentication (Apple & Google only)
   ═══════════════════════════════════════════════════ */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jyfnjuxijkqkjxsreezo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_SWb674hU1E-fh9ahe9XS3w_V91MMTk2';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Check if already logged in ──
async function checkCurrentSession() {
    // If we have an auth hash in the URL, DO NOTHING.
    // Let the hash be processed by the auth provider callback.
    if (window.location.hash.includes('access_token') || 
        window.location.hash.includes('id_token') || 
        window.location.hash.includes('error')) {
        console.log("🛠️ Auth hash detected in URL, skipping auto-redirect.");
        return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        console.log("✅ Session found on login page, redirecting to dashboard...");
        window.location.href = '/dashboard.html';
    }
}
checkCurrentSession();

// ── Check for error in URL params ──
const urlParams = new URLSearchParams(window.location.search);
const error = urlParams.get('error');
if (error) {
    showMessage(error, 'error');
}

// ── Listen for auth state changes ──
supabase.auth.onAuthStateChange((event, session) => {
    console.log("🔑 Auth Event on Login Page:", event);
    if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session) {
        console.log("✅ Success! Redirecting to dashboard...");
        // Use replace instead of href to avoid history back-loop
        window.location.replace('/dashboard.html');
    }
});

function showMessage(message, type = 'error') {
    const el = document.getElementById('authMessage');
    if (el) {
        el.textContent = message;
        el.className = `auth-message ${type}`;
    }
}

// ═══════ APPLE SIGN IN ═══════
window.signInWithApple = async function () {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'apple',
            options: {
                redirectTo: `${window.location.origin}/dashboard.html`,
            },
        });

        if (error) {
            showMessage(error.message);
        }
    } catch (err) {
        console.error('Apple sign-in error:', err);
        showMessage('Something went wrong. Please try again.');
    }
};

// ═══════ GOOGLE SIGN IN ═══════
window.signInWithGoogle = async function () {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/dashboard.html`,
            },
        });

        if (error) {
            showMessage(error.message);
        }
    } catch (err) {
        console.error('Google sign-in error:', err);
        showMessage('Something went wrong. Please try again.');
    }
};

console.log('🔐 Loop Marked Auth Module Loaded');
