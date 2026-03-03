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
            // Use innerHTML to support tags like <strong> or <br> in translations
            el.innerHTML = val;
        }
    });
}

function updateLangButton() {
    const label = document.getElementById('currentLangLabel');
    if (label) label.textContent = currentLang.toUpperCase();
    // Also update mobile language label
    const mobileLabel = document.getElementById('mobileLangLabel');
    if (mobileLabel) mobileLabel.textContent = currentLang.toUpperCase();

    // Support for the simplified switcher used in subpages
    const currentFlag = LANGUAGES.find(l => l.code === currentLang)?.flag || '🇺🇸';
    const currentName = LANGUAGES.find(l => l.code === currentLang)?.name || 'English';
    const flagEl = document.getElementById('current-lang-flag');
    if (flagEl) flagEl.textContent = currentFlag;
    const nameEl = document.getElementById('current-lang-name');
    if (nameEl) nameEl.textContent = currentName;
}

function buildDropdown() {
    // ── Main Page Dropdown ──
    const dd = document.getElementById('langDropdown');
    if (dd) {
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

    // ── Subpage Simple Dropdown (privacy / terms / download) ──
    const menu = document.getElementById('lang-menu');
    if (menu) {
        menu.innerHTML = LANGUAGES.map(l =>
            `<div class="lang-item${l.code === currentLang ? ' active' : ''}" data-lang="${l.code}" style="padding: 10px 15px; cursor: pointer; display: flex; align-items: center; gap: 10px; color: #fff; white-space: nowrap; border-radius: 8px;">
        <span class="lang-flag">${l.flag}</span><span>${l.name}</span>
      </div>`
        ).join('');
        menu.querySelectorAll('.lang-item').forEach(item => {
            item.addEventListener('click', () => {
                setLang(item.dataset.lang);
                menu.style.display = 'none';
            });
            // Add hover effect
            item.addEventListener('mouseenter', () => item.style.background = 'rgba(255,255,255,0.1)');
            item.addEventListener('mouseleave', () => {
                if (!item.classList.contains('active')) item.style.background = 'transparent';
            });
        });
    }
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
    // ── Main Header Switcher ──
    const btn = document.getElementById('langBtn');
    const dd = document.getElementById('langDropdown');
    if (btn && dd) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            dd.classList.toggle('open');
        });
        document.addEventListener('click', () => dd.classList.remove('open'));
    }

    // ── Simple Switcher (subpages) ──
    const menuBtn = document.getElementById('lang-menu-btn');
    const menu = document.getElementById('lang-menu');
    if (menuBtn && menu) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
        });
        document.addEventListener('click', () => {
            menu.style.display = 'none';
        });
    }
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
    updateLangButton();
});

window.LM_i18n = { t, setLang, currentLang: () => currentLang };
