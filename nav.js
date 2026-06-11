/* ════════════════════════════════════════════════════════════════
   AMANA AKTIEN – nav.js (Anpassung: Nur Light Mode & Watchlist)
   ════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Theme System (Fixiert auf Light) ─────────────────────────── */
  // Wir setzen das Theme hart auf light und entfernen die Umschalt-Logik
  document.documentElement.setAttribute('data-theme', 'light');

  /* ── Styles ───────────────────────────────────────────────── */
  const style = document.createElement('style');
  style.textContent = `
    :root {
      --bg:#F8F6F1; --bg2:#FFFFFF; --bg3:#F0EDE6;
      --text:#1A1814; --text2:#444; --muted:#888;
      --border:rgba(160,120,48,.25);
      --gold:#A07830; --gold-glow:rgba(160,120,48,.1);
      --nav-bg:rgba(248,246,241,.97);
    }
    body {
      background:var(--bg) !important;
      color:var(--text) !important;
    }
    #aa-nav {
      position:sticky; top:0; z-index:200;
      background:var(--nav-bg);
      backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);
      border-bottom:1px solid var(--border);
      padding:0 2rem;
    }
    .aa-nav-inner {
      max-width:1100px; margin:0 auto;
      display:flex; align-items:center; justify-content:space-between;
      height:62px; gap:1rem;
    }
    .aa-nav-brand { display:flex; align-items:center; gap:.75rem; text-decoration:none; }
    .aa-nav-logo {
      width:36px; height:36px; border-radius:6px;
      background:var(--gold); display:grid; place-items:center;
      font-size:1.1rem; color:#fff;
    }
    .aa-brand-title {
      font-family:'Playfair Display', serif;
      font-size:1.05rem; font-weight:700; color:var(--text);
    }
    .aa-brand-sub {
      font-size:.5rem; font-weight:700; letter-spacing:.22em;
      text-transform:uppercase; color:var(--gold);
    }
    .aa-nav-links {
      display:flex; align-items:center; gap:.25rem;
      list-style:none; margin:0; padding:0;
    }
    .aa-nav-links a {
      font-family:'DM Sans', sans-serif;
      font-size:.8rem; font-weight:600;
      padding:.45rem .9rem; border-radius:4px;
      color:var(--muted); text-decoration:none;
      transition:color .2s, background .2s;
      white-space:nowrap;
    }
    .aa-nav-links a:hover { color:var(--text); background:var(--gold-glow); }
    .aa-nav-links a.aa-nav-active { color:var(--gold); background:var(--gold-glow); }
    
    /* Styling für den neuen Watchlist Button */
    .aa-nav-links a.aa-nav-watchlist {
      border: 1px solid var(--gold);
      color: var(--gold);
      margin-left: 0.5rem;
    }
    .aa-nav-links a.aa-nav-watchlist:hover {
      background: var(--gold);
      color: #fff;
    }

    .aa-nav-right { display:flex; align-items:center; gap:.5rem; }
    
    /* Theme Button versteckt, da nur Light Mode */
    #aa-theme-btn { display: none; }

    .aa-hamburger {
      display:none; flex-direction:column; gap:5px;
      background:none; border:1px solid var(--border);
      border-radius:4px; padding:8px;
      cursor:pointer; width:38px; height:38px;
      align-items:center; justify-content:center;
    }
    .aa-hamburger span {
      display:block; width:18px; height:1.5px;
      background:var(--text); border-radius:2px;
      transition:all .3s;
    }
    .aa-hamburger.open span:nth-child(1) { transform:translateY(6.5px) rotate(45deg); }
    .aa-hamburger.open span:nth-child(2) { opacity:0; }
    .aa-hamburger.open span:nth-child(3) { transform:translateY(-6.5px) rotate(-45deg); }
    
    .aa-mobile-nav {
      position:fixed; top:62px; left:0; right:0; bottom:0;
      background:var(--bg);
      display:flex; flex-direction:column;
      align-items:center; justify-content:center; gap:2rem;
      opacity:0; pointer-events:none;
      transition:opacity .3s; z-index:199;
    }
    .aa-mobile-nav.open { opacity:1; pointer-events:all; }
    .aa-mobile-nav a {
      font-family:'Playfair Display', serif;
      font-size:1.6rem; color:var(--text);
      text-decoration:none;
    }
    .aa-mobile-nav a.aa-mobile-watchlist {
      color:var(--gold);
      font-weight:700;
    }
    @media (max-width:768px) {
      .aa-nav-links { display:none !important; }
      .aa-hamburger { display:flex !important; }
    }
  `;
  document.head.appendChild(style);

  /* ── Active-Link Erkennung ── */
  const page = window.location.pathname.split('/').pop() || 'index.html';
  const isActive = (href) => page === href ? 'class="aa-nav-active"' : '';

  /* ── HTML zusammenbauen ── */
  const navHTML = `
  <nav id="aa-nav" aria-label="Hauptnavigation">
    <div class="aa-nav-inner">
      <a href="index.html" class="aa-nav-brand">
        <div class="aa-nav-logo">☪</div>
        <div>
          <div class="aa-brand-title">Amana Aktien</div>
          <div class="aa-brand-sub">Halal Investieren</div>
        </div>
      </a>
      <ul class="aa-nav-links" role="list">
        <li><a href="aktien-analysen.html" ${isActive('aktien-analysen.html')}>Halal Aktienanalysen</a></li>
        <li><a href="halal-etf-liste.html" ${isActive('halal-etf-liste.html')}>Halal ETFs</a></li>
        <li><a href="blog.html" ${isActive('blog.html')}>Blog</a></li>
        <!-- Premium ersetzt durch Watchlist -->
        <li><a href="halal-aktien-watchlist.html" ${isActive('halal-aktien-watchlist.html')} class="aa-nav-watchlist">⭐ Watchlist</a></li>
      </ul>
      <div class="aa-nav-right">
        <button class="aa-hamburger" id="aa-hamburgerBtn" aria-label="Menü">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </nav>
  <div class="aa-mobile-nav" id="aa-mobileNav">
    <a href="index.html">Startseite</a>
    <a href="aktien-analysen.html">Halal Aktienanalysen</a>
    <a href="halal-etf-liste.html">Halal ETFs</a>
    <a href="blog.html">Blog</a>
    <a href="halal-aktien-watchlist.html" class="aa-mobile-watchlist">⭐ Halal Aktien Watchlist</a>
  </div>`;

  /* ── Nav einfügen ── */
  function injectNav() {
    const placeholder = document.getElementById('site-nav');
    if (placeholder) {
      placeholder.outerHTML = navHTML;
    } else {
      document.body.insertAdjacentHTML('afterbegin', navHTML);
    }

    const btn = document.getElementById('aa-hamburgerBtn');
    const mob = document.getElementById('aa-mobileNav');
    if (btn && mob) {
      btn.addEventListener('click', () => {
        const open = mob.classList.toggle('open');
        btn.classList.toggle('open', open);
        document.body.style.overflow = open ? 'hidden' : '';
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectNav);
  } else {
    injectNav();
  }
})();
