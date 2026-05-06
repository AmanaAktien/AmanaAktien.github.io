/**
 * Amana Aktien – script.js (v3 Final)
 * DSGVO-konform | Kein Tracking | Kein Analytics
 * Autor: Youssef Chafi
 */

'use strict';

// ── Reduced-motion-Unterstützung ──
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Zentrale Bild-Fallback-Funktion ──
function handleImageError(img) {
  const type = img.dataset.fallback;
  if (!type) return;
  if (type === 'ar-img-ph') {
    const wrap = img.closest('.ar-img-wrap');
    if (wrap) wrap.innerHTML = '<div class="ar-img-ph" aria-hidden="true">▶</div>';
  } else if (type === 'hide') {
    img.style.display = 'none';
  }
}

// ── Hamburger Menu ──
function initHamburger() {
  const btn  = document.getElementById('hamburgerBtn');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    btn.classList.toggle('open', isOpen);
    btn.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
    // Fokus ins Menü setzen
    if (isOpen) {
      const firstLink = menu.querySelector('a');
      if (firstLink) firstLink.focus();
    }
  });

  // Nur schließen wenn Menü wirklich offen ist
  document.addEventListener('click', (e) => {
    if (!menu.classList.contains('open')) return;
    if (!menu.contains(e.target) && !btn.contains(e.target)) {
      menu.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      menu.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      btn.focus();
    }
  });
}

// ── FAQ Accordion ──
function initFaq() {
  // NodeList gecacht
  const items = document.querySelectorAll('.faq-item');

  items.forEach((item, index) => {
    const btn = item.querySelector('.faq-q');
    const ans = item.querySelector('.faq-a');
    if (!btn || !ans) return;

    // IDs für aria-controls
    const answerId = `faq-answer-${index + 1}`;
    ans.id = answerId;
    btn.setAttribute('aria-controls', answerId);

    // Sync aria-expanded mit aktuellem Zustand
    const isInitiallyOpen = item.classList.contains('open');
    btn.setAttribute('aria-expanded', String(isInitiallyOpen));

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // Alle schließen
      items.forEach(i => {
        i.classList.remove('open');
        const q = i.querySelector('.faq-q');
        if (q) q.setAttribute('aria-expanded', 'false');
      });
      // Aktuelles öffnen wenn es zu war
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

// ── Bild-Fallbacks (zentral, kein inline onerror) ──
function initImageFallbacks() {
  document.querySelectorAll('img[data-fallback]').forEach(img => {
    if (img.complete && img.naturalWidth === 0) {
      handleImageError(img);
    } else {
      img.addEventListener('error', () => handleImageError(img));
    }
  });
}

// ── Smooth Scroll (mit reduced-motion + edge cases) ──
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;  // Edge Case: leerer Hash
      try {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
            block: 'start',
          });
        }
      } catch {
        // Ungültiger Selektor → nichts tun
      }
    });
  });
}

// ── Tabellen: Scroll-Accessibility ──
function initTables() {
  document.querySelectorAll('.hw').forEach(t => {
    t.setAttribute('role', 'region');
    t.setAttribute('tabindex', '0');
    if (!t.hasAttribute('aria-label')) {
      t.setAttribute('aria-label', 'Halal-Check Tabelle – horizontal scrollbar');
    }
  });
}

// ── Aktiver Nav-Link (robust für GitHub Pages) ──
function initActiveNav() {
  // Leere Segmente filtern, Fallback auf index.html
  const path = location.pathname
    .split('/')
    .filter(Boolean)
    .pop() || 'index.html';

  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(a => {
    const href = (a.getAttribute('href') || '').split('?')[0].split('#')[0];
    if (href === path || (path === 'index.html' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}

// ── Z-Index Guard: Mobile menu soll unter Nav liegen ──
// nav: z-index 100 | mobile-menu: z-index 99 → ist korrekt

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  initHamburger();
  initFaq();
  initImageFallbacks();
  initSmoothScroll();
  initTables();
  initActiveNav();
});
