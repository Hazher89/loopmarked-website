/* ═══════════════════════════════════════════════════
   LOOP MARKED — Main JavaScript
   Landing Page Interactions & Animations
   ═══════════════════════════════════════════════════ */

// ── Navbar scroll effect ──
const navbar = document.getElementById('navbar');
let lastScrollY = 0;

window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY > 60) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    lastScrollY = scrollY;
});

// ── Mobile hamburger menu ──
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('mobile-open');
        hamburger.classList.toggle('active');
    });

    // Close menu on link click
    navLinks.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('mobile-open');
            hamburger.classList.remove('active');
        });
    });
}

// ── Hero particles ──
const heroParticles = document.getElementById('heroParticles');
if (heroParticles) {
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        particle.style.animationDuration = `${6 + Math.random() * 6}s`;
        particle.style.width = `${1 + Math.random() * 2}px`;
        particle.style.height = particle.style.width;
        heroParticles.appendChild(particle);
    }
}

// ── Scroll-triggered animations (AOS-like) ──
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -60px 0px'
};

const animateOnScroll = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const delay = entry.target.getAttribute('data-aos-delay');
            if (delay) {
                setTimeout(() => {
                    entry.target.classList.add('aos-animate');
                }, parseInt(delay));
            } else {
                entry.target.classList.add('aos-animate');
            }
            animateOnScroll.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('[data-aos]').forEach(el => {
    animateOnScroll.observe(el);
});

// ── Smooth scroll for nav links ──
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            const navbarHeight = 72;
            const targetPosition = target.getBoundingClientRect().top + window.scrollY - navbarHeight;
            window.scrollTo({ top: targetPosition, behavior: 'smooth' });
        }
    });
});

// ── Counter animation for stats ──
function animateCounter(el, target, suffix = '') {
    let current = 0;
    const increment = target / 60;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        if (target >= 1000) {
            el.textContent = Math.floor(current / 1000) + 'K+';
        } else {
            el.textContent = current.toFixed(1) + suffix;
        }
    }, 16);
}

// ── Parallax on hero phone ──
const heroPhone = document.querySelector('.hero-phone');
if (heroPhone) {
    document.addEventListener('mousemove', (e) => {
        const { clientX, clientY } = e;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const rotateX = ((clientY - centerY) / centerY) * 3;
        const rotateY = ((clientX - centerX) / centerX) * -5;

        heroPhone.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
}

console.log('✨ Loop Marked Website Loaded');
