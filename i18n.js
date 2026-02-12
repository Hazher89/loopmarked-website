/* ═══════════════════════════════════════════════════
   LOOP MARKED — Internationalization (i18n)
   Supports 22 languages matching the mobile app
   ═══════════════════════════════════════════════════ */

import { translations, LANGUAGES } from './translations.js';

const STORAGE_KEY = 'lm_lang';

function getDefaultLang() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && translations[saved]) return saved;
    const nav = (navigator.language || 'en').split('-')[0];
    return translations[nav] ? nav : 'en';
}

let currentLang = getDefaultLang();

export function t(key) {
    return translations[currentLang]?.[key] || translations['en']?.[key] || key;
}

export function setLang(lang) {
    if (!translations[lang]) return;
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = ['ar', 'fa', 'ku', 'ps'].includes(lang) ? 'rtl' : 'ltr';
    applyTranslations();
    updateLangButton();
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        const val = t(key);
        if (el.tagName === 'TITLE' || el.tagName === 'META') {
            if (el.tagName === 'TITLE') el.textContent = val;
            else el.setAttribute('content', val);
        } else if (el.tagName === 'INPUT' && el.placeholder) {
            el.placeholder = val;
        } else {
            el.textContent = val;
        }
    });
}

function updateLangButton() {
    const label = document.getElementById('currentLangLabel');
    if (label) label.textContent = currentLang.toUpperCase();
    // Also update mobile language label
    const mobileLabel = document.getElementById('mobileLangLabel');
    if (mobileLabel) mobileLabel.textContent = currentLang.toUpperCase();
}

function buildDropdown() {
    const dd = document.getElementById('langDropdown');
    if (!dd) return;
    dd.innerHTML = LANGUAGES.map(l =>
        `<button class="lang-option${l.code === currentLang ? ' active' : ''}" data-lang="${l.code}">
      <span class="lang-flag">${l.flag}</span><span>${l.name}</span>
    </button>`
    ).join('');
    dd.querySelectorAll('.lang-option').forEach(btn => {
        btn.addEventListener('click', () => {
            setLang(btn.dataset.lang);
            dd.classList.remove('open');
            dd.querySelectorAll('.lang-option').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function buildMobileDropdown() {
    const dd = document.getElementById('mobileLangDropdown');
    if (!dd) return;
    dd.innerHTML = LANGUAGES.map(l =>
        `<button class="lang-option${l.code === currentLang ? ' active' : ''}" data-lang="${l.code}">
      <span class="lang-flag">${l.flag}</span><span>${l.name}</span>
    </button>`
    ).join('');
    dd.querySelectorAll('.lang-option').forEach(btn => {
        btn.addEventListener('click', () => {
            setLang(btn.dataset.lang);
            dd.classList.remove('open');
            // Update active state in both dropdowns
            dd.querySelectorAll('.lang-option').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // Also sync desktop dropdown active state
            const desktopDD = document.getElementById('langDropdown');
            if (desktopDD) {
                desktopDD.querySelectorAll('.lang-option').forEach(b => {
                    b.classList.toggle('active', b.dataset.lang === btn.dataset.lang);
                });
            }
        });
    });
}

function initLangSwitcher() {
    const btn = document.getElementById('langBtn');
    const dd = document.getElementById('langDropdown');
    if (!btn || !dd) return;
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        dd.classList.toggle('open');
    });
    document.addEventListener('click', () => dd.classList.remove('open'));
}

function initMobileLangSwitcher() {
    const btn = document.getElementById('mobileLangBtn');
    const dd = document.getElementById('mobileLangDropdown');
    if (!btn || !dd) return;
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        dd.classList.toggle('open');
    });
    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.mobile-lang-bar')) {
            dd.classList.remove('open');
        }
    });
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.lang = currentLang;
    document.documentElement.dir = ['ar', 'fa', 'ku', 'ps'].includes(currentLang) ? 'rtl' : 'ltr';
    buildDropdown();
    buildMobileDropdown();
    initLangSwitcher();
    initMobileLangSwitcher();
    applyTranslations();
});

window.LM_i18n = { t, setLang, currentLang: () => currentLang };
