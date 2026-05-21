// Google Tag (gtag.js)
const gtagScript = document.createElement('script');
gtagScript.async = true;
gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-VBKDTGTEV9';
document.head.appendChild(gtagScript);

window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-VBKDTGTEV9');


(function () {
  'use strict';

  /* ── Theme System ─────────────────────────────────────────── */
  const THEME_KEY = 'aa_theme';

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    const btn = document.getElementById('aa-theme-btn');
    if (btn) {
      btn.setAttribute('aria-label', theme === 'dark' ? 'Helles Design aktivieren' : 'Dunkles Design aktivieren');
      btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  /* Apply saved theme immediately (before DOM loads) to avoid flash */
  const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  /* ── CSS Variables for both themes ───────────────────────── */
  const style = document.createElement('style');
  style.textContent = `
    /* ── THEME TOKENS ── */
    :root, [data-theme="dark"] {
      --bg: #0D0D0D;
      --bg2: #161616;
      --bg3: #1E1E1E;
      --text: #E8E4DC;
      --text2: #bbb;
      --muted: #666;
      --border: rgba(201,168,76,.2);
      --gold: #C9A84C;
      --gold-glow: rgba(201,168,76,.12);
      --gold-dim: #A07830;
      --green: #3D9970;
      --nav-bg: rgba(13,13,13,.96);
      --shadow: 0 8px 32px rgba(0,0,0,.5);
    }
    [data-theme="light"] {
      --bg: #F8F6F1;
      --bg2: #FFFFFF;
      --bg3: #F0EDE6;
      --text: #1A1814;
      --text2: #444;
      --muted: #888;
      --border: rgba(160,120,48,.25);
      --gold: #A07830;
      --gold-glow: rgba(160,120,48,.1);
      --gold-dim: #7A5C20;
      --green: #2D7A55;
      --nav-bg: rgba(248,246,241,.97);
      --shadow: 0 8px 32px rgba(0,0,0,.12);
    }

    /* ── GLOBAL BODY TRANSITION ── */
    body {
      background: var(--bg) !important;
      color: var(--text) !important;
      transition: background .25s ease, color .25s ease;
    }

    /* ── NAV ── */
    #aa-nav {
      position: sticky;
      top: 0;
      z-index: 200;
      background: var(--nav-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border);
      padding: 0 2rem;
      transition: background .25s ease, border-color .25s ease;
    }
    .aa-nav-inner {
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 62px;
      gap: 1rem;
    }
    .aa-nav-brand {
      display: flex;
      align-items: center;
      gap: .75rem;
      text-decoration: none;
      flex-shrink: 0;
    }
    .aa-nav-logo {
      width: 36px;
      height: 36px;
      border-radius: 6px;
      background: var(--gold);
      display: grid;
      place-items: center;
      font-size: 1.1rem;
      flex-shrink: 0;
      color: #fff;
      transition: background .25s;
    }
    .aa-brand-title {
      font-family: 'Playfair Display', serif;
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text);
      letter-spacing: .02em;
      transition: color .25s;
    }
    .aa-brand-sub {
      font-size: .5rem;
      font-weight: 700;
      letter-spacing: .22em;
      text-transform: uppercase;
      color: var(--gold);
      transition: color .25s;
    }
    .aa-nav-links {
      display: flex;
      align-items: center;
      gap: .25rem;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .aa-nav-links a {
      font-family: 'DM Sans', sans-serif;
      font-size: .8rem;
      font-weight: 600;
      padding: .45rem .9rem;
      border-radius: 4px;
      color: var(--muted);
      text-decoration: none;
      transition: color .2s, background .2s;
      letter-spacing: .01em;
      white-space: nowrap;
    }
    .aa-nav-links a:hover {
      color: var(--text);
      background: var(--gold-glow);
    }
    .aa-nav-links a.aa-nav-active {
      color: var(--gold);
      background: var(--gold-glow);
    }
    .aa-nav-right {
      display: flex;
      align-items: center;
      gap: .5rem;
      flex-shrink: 0;
    }

    /* Theme Toggle Button */
    #aa-theme-btn {
      background: var(--bg3);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: .3rem .7rem;
      cursor: pointer;
      font-size: .9rem;
      line-height: 1;
      transition: background .2s, border-color .2s, transform .15s;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #aa-theme-btn:hover {
      border-color: var(--gold);
      transform: scale(1.05);
    }

    /* Premium / CTA Button */
    .aa-nav-cta {
      font-family: 'DM Sans', sans-serif;
      font-size: .76rem;
      font-weight: 700;
      padding: .42rem 1rem;
      border-radius: 4px;
      background: var(--gold);
      color: #0D0D0D !important;
      text-decoration: none;
      letter-spacing: .04em;
      transition: opacity .2s, transform .15s;
      white-space: nowrap;
    }
    .aa-nav-cta:hover {
      opacity: .88;
      transform: translateY(-1px);
    }

    /* Hamburger */
    .aa-hamburger {
      display: none;
      flex-direction: column;
      gap: 5px;
      background: none;
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 8px;
      cursor: pointer;
      width: 38px;
      height: 38px;
      align-items: center;
      justify-content: center;
      transition: border-color .2s;
    }
    .aa-hamburger:hover { border-color: var(--gold); }
    .aa-hamburger span {
      display: block;
      width: 18px;
      height: 1.5px;
      background: var(--text);
      border-radius: 2px;
      transition: all .3s;
    }
    .aa-hamburger.open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
    .aa-hamburger.open span:nth-child(2) { opacity: 0; }
    .aa-hamburger.open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

    /* Mobile nav overlay */
    .aa-mobile-nav {
      position: fixed;
      top: 62px;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--bg);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2rem;
      opacity: 0;
      pointer-events: none;
      transition: opacity .3s;
      z-index: 199;
    }
    .aa-mobile-nav.open {
      opacity: 1;
      pointer-events: all;
    }
    .aa-mobile-nav a {
      font-family: 'Playfair Display', serif;
      font-size: 1.6rem;
      color: var(--text);
      text-decoration: none;
      transition: color .2s;
    }
    .aa-mobile-nav a:hover { color: var(--gold); }
    .aa-mobile-nav .aa-mobile-cta {
      font-family: 'DM Sans', sans-serif;
      font-size: 1rem;
      font-weight: 700;
      background: var(--gold);
      color: #0D0D0D;
      padding: .65rem 2rem;
      border-radius: 4px;
    }

    @media (max-width: 768px) {
      .aa-nav-links { display: none !important; }
      .aa-hamburger { display: flex !important; }
      .aa-nav-cta { display: none !important; }
    }
    @media (max-width: 480px) {
      #aa-nav { padding: 0 1rem; }
    }
  `;
  document.head.appendChild(style);

  /* ── Active link detection ── */
  const page = window.location.pathname.split('/').pop() || 'index.html';
  function isActive(href) {
    return page === href ? 'class="aa-nav-active"' : '';
  }

  /* ── Build HTML ── */
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const themeIcon = currentTheme === 'dark' ? '☀️' : '🌙';
  const themeLabel = currentTheme === 'dark' ? 'Helles Design aktivieren' : 'Dunkles Design aktivieren';

  const navHTML = `
  <nav id="aa-nav" aria-label="Hauptnavigation">
    <div class="aa-nav-inner">
      <a href="index.html" class="aa-nav-brand" aria-label="Amana Aktien Startseite">
        <div class="aa-nav-logo" aria-hidden="true">☪</div>
        <div>
          <div class="aa-brand-title">Amana Aktien</div>
          <div class="aa-brand-sub">Halal Investieren</div>
        </div>
      </a>

      <ul class="aa-nav-links" role="list">
        <li><a href="aktien-analysen.html" ${isActive('aktien-analysen.html')}>Halal Aktienanalysen</a></li>
        <li><a href="halal-etf-liste.html" ${isActive('halal-etf-liste.html')}>Halal ETFs</a></li>
      </ul>

      <div class="aa-nav-right">
        <button id="aa-theme-btn" aria-label="${themeLabel}">${themeIcon}</button>
        <a href="premium.html" class="aa-nav-cta">☪ Premium</a>
        <button class="aa-hamburger" id="aa-hamburgerBtn" aria-expanded="false" aria-label="Menü öffnen">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </nav>

  <div class="aa-mobile-nav" id="aa-mobileNav" role="dialog" aria-modal="true" aria-label="Mobilmenü">
    <a href="index.html">Startseite</a>
    <a href="aktien-analysen.html">Halal Aktienanalysen</a>
    <a href="halal-etf-liste.html">Halal ETFs</a>
    <a href="premium.html" class="aa-mobile-cta">☪ Premium</a>
  </div>`;

  /* ── Inject nav ── */
  const placeholder = document.getElementById('site-nav');
  if (placeholder) {
    placeholder.outerHTML = navHTML;
  } else {
    document.body.insertAdjacentHTML('afterbegin', navHTML);
  }

  /* ── Wire up theme toggle ── */
  const themeBtn = document.getElementById('aa-theme-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }

  /* ── Hamburger logic ── */
  function initHamburger() {
    const btn = document.getElementById('aa-hamburgerBtn');
    const mob = document.getElementById('aa-mobileNav');
    if (!btn || !mob) return;

    btn.addEventListener('click', () => {
      const open = mob.classList.toggle('open');
      btn.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });

    mob.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mob.classList.remove('open');
        btn.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && mob.classList.contains('open')) {
        mob.classList.remove('open');
        btn.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHamburger);
  } else {
    initHamburger();
  }
})();
