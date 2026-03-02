/* ═══════════════════════════════════════════════════════════════
   LOOP MARKED — Main JavaScript
   Apple-style scroll animations & interactions
   ═══════════════════════════════════════════════════════════════ */

// ── Navbar scroll effect (Apple-style frosted glass) ──
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
}, { passive: true });

// ── Mobile hamburger menu ──
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('mobile-open');
        hamburger.classList.toggle('active');
    });

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
    for (let i = 0; i < 25; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 8}s`;
        particle.style.animationDuration = `${8 + Math.random() * 8}s`;
        particle.style.width = `${1 + Math.random() * 2}px`;
        particle.style.height = particle.style.width;
        heroParticles.appendChild(particle);
    }
}

// ── Apple-style scroll-triggered animations ──
// Uses IntersectionObserver for performant scroll detection
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -80px 0px'
};

// AOS-style fade animations
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

// Apple-style reveal animations (sequential word/line reveals)
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.15,
    rootMargin: '0px 0px -60px 0px'
});

document.querySelectorAll('.apple-reveal').forEach(el => {
    revealObserver.observe(el);
});

// ── Smooth scroll for nav links (Apple-style deceleration) ──
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

// ── Parallax on hero phone (subtle Apple-style depth) ──
const heroPhone = document.querySelector('.hero-phone');
if (heroPhone) {
    let rafId = null;
    document.addEventListener('mousemove', (e) => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
            const { clientX, clientY } = e;
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const rotateX = ((clientY - centerY) / centerY) * 2;
            const rotateY = ((clientX - centerX) / centerX) * -3;
            heroPhone.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(0)`;
        });
    });
}

// ── Magnetic hover effect on CTA buttons ──
document.querySelectorAll('.btn-primary, .btn-primary-sm').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translateY(-3px) translate(${x * 0.08}px, ${y * 0.08}px)`;
    });

    btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
    });
});

// ── Tilt effect on feature cards (subtle 3D) ──
document.querySelectorAll('.feature-card, .privacy-card, .tech-card, .what-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `translateY(-4px) perspective(800px) rotateX(${y * -3}deg) rotateY(${x * 3}deg)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
    });
});

// ── Stagger animation for list items ──
const staggerObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const items = entry.target.querySelectorAll('li');
            items.forEach((item, i) => {
                item.style.opacity = '0';
                item.style.transform = 'translateX(-15px)';
                item.style.transition = `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * 80}ms`;
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateX(0)';
                }, 100);
            });
            staggerObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.2 });

document.querySelectorAll('.showcase-features, .stories-features').forEach(list => {
    staggerObserver.observe(list);
});

console.log('✨ Loop Marked Website Loaded — Apple-style animations active');
