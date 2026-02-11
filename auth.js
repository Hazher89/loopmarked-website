/* ═══════════════════════════════════════════════════
   LOOP MARKED — Auth JavaScript
   Supabase Authentication (Apple & Google only)
   ═══════════════════════════════════════════════════ */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jyfnjuxijkqkjxsreezo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_SWb674hU1E-fh9ahe9XS3w_V91MMTk2';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Check if already logged in ──
supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
        window.location.href = '/dashboard.html';
    }
});

// ── Listen for auth state changes ──
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
        window.location.href = '/dashboard.html';
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
