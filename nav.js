(function () {
  const style = document.createElement('style');
  style.textContent = `
    nav{position:sticky;top:0;z-index:100;background:rgba(13,13,13,.95);backdrop-filter:blur(12px);border-bottom:1px solid rgba(201,168,76,.2);padding:0 2rem}
    .nav-inner{max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:62px}
    .nav-brand{display:flex;align-items:center;gap:.75rem;text-decoration:none}
    .nav-logo{width:36px;height:36px;border-radius:6px;background:#C9A84C;display:grid;place-items:center;font-size:1.1rem;flex-shrink:0}
    .brand-title{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;color:#E8E4DC;letter-spacing:.02em}
    .brand-sub{font-size:.52rem;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:#C9A84C}
    .nav-links{display:flex;align-items:center;gap:.35rem;list-style:none}
    .nav-links a{padding:.45rem .85rem;font-size:.78rem;font-weight:500;color:#888;border-radius:4px;transition:color .2s,background .2s;text-decoration:none}
    .nav-links a:hover{color:#E8E4DC;background:rgba(255,255,255,.06)}
    .hamburger{display:none;flex-direction:column;gap:5px;background:none;border:1px solid rgba(201,168,76,.2);border-radius:4px;padding:8px;cursor:pointer;width:38px;height:38px;align-items:center;justify-content:center}
    .hamburger span{display:block;width:18px;height:1.5px;background:#E8E4DC;border-radius:2px;transition:all .3s}
    .hamburger.open span:nth-child(1){transform:translateY(6.5px) rotate(45deg)}
    .hamburger.open span:nth-child(2){opacity:0}
    .hamburger.open span:nth-child(3){transform:translateY(-6.5px) rotate(-45deg)}
    .mobile-nav{position:fixed;top:62px;left:0;right:0;bottom:0;background:rgba(13,13,13,.97);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.5rem;opacity:0;pointer-events:none;transition:opacity .3s;z-index:99}
    .mobile-nav.open{opacity:1;pointer-events:all}
    .mobile-nav a{font-family:'Playfair Display',serif;font-size:1.5rem;color:#E8E4DC;transition:color .2s;text-decoration:none}
    .mobile-nav a:hover{color:#C9A84C}
    @media(max-width:860px){.nav-links{display:none!important}.hamburger{display:flex!important}}
  `;
  document.head.appendChild(style);

  const html = `
  <nav aria-label="Hauptnavigation">
    <div class="nav-inner">
      <a href="index.html" class="nav-brand" aria-label="Amana Aktien Startseite">
        <div class="nav-logo">☪</div>
        <div>
          <div class="brand-title">Amana Aktien</div>
          <div class="brand-sub">Halal Investieren</div>
        </div>
      </a>
      <ul class="nav-links" role="list">
        <li><a href="blog.html">Blog</a></li>
        <li><a href="halal-etf-liste.html">ETF Liste</a></li>
        <li>
          <a href="https://www.youtube.com/@AmanaAktien" target="_blank" rel="noopener noreferrer nofollow" aria-label="YouTube"
             style="display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:8px;background:rgba(255,0,0,.15);border:1px solid rgba(255,0,0,.35);transition:background .2s;"
             onmouseover="this.style.background='rgba(255,0,0,.3)'" onmouseout="this.style.background='rgba(255,0,0,.15)'">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="#FF0000">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </a>
        </li>
        <li>
          <a href="https://www.tiktok.com/@amanaaktien" target="_blank" rel="noopener noreferrer nofollow" aria-label="TikTok"
             style="display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:8px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);transition:background .2s;"
             onmouseover="this.style.background='rgba(255,255,255,.2)'" onmouseout="this.style.background='rgba(255,255,255,.08)'">
            <svg viewBox="0 0 24 24" width="21" height="21" fill="#ffffff">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.79a8.18 8.18 0 0 0 4.78 1.52V6.85a4.85 4.85 0 0 1-1.01-.16z"/>
            </svg>
          </a>
        </li>
        <li>
          <a href="https://www.instagram.com/amanaaktien" target="_blank" rel="noopener noreferrer nofollow" aria-label="Instagram"
             style="display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:8px;background:rgba(193,53,132,.15);border:1px solid rgba(193,53,132,.4);transition:background .2s;"
             onmouseover="this.style.background='rgba(193,53,132,.32)'" onmouseout="this.style.background='rgba(193,53,132,.15)'">
            <svg viewBox="0 0 24 24" width="21" height="21">
              <defs><linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#f09433"/><stop offset="50%" stop-color="#dc2743"/><stop offset="100%" stop-color="#bc1888"/></linearGradient></defs>
              <path fill="url(#ig)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
            </svg>
          </a>
        </li>
      </ul>
      <button class="hamburger" id="hamburgerBtn" aria-expanded="false" aria-label="Menü öffnen">
        <span></span><span></span><span></span>
      </button>
    </div>
  </nav>
  <div class="mobile-nav" id="mobileNav" role="dialog" aria-modal="true" aria-label="Mobilmenü">
    <a href="index.html">Startseite</a>
    <a href="blog.html">Blog</a>
    <a href="halal-etf-liste.html">ETF Liste</a>
    <a href="https://www.youtube.com/@AmanaAktien" target="_blank" rel="noopener noreferrer nofollow">▶ YouTube ↗</a>
    <a href="https://www.tiktok.com/@amanaaktien" target="_blank" rel="noopener noreferrer nofollow">TikTok ↗</a>
    <a href="https://www.instagram.com/amanaaktien" target="_blank" rel="noopener noreferrer nofollow">Instagram ↗</a>
  </div>`;

  const placeholder = document.getElementById('site-nav');
  if (placeholder) placeholder.outerHTML = html;

  document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('hamburgerBtn');
    const mob = document.getElementById('mobileNav');
    if (btn && mob) {
      btn.addEventListener('click', () => {
        const o = mob.classList.toggle('open');
        btn.classList.toggle('open', o);
        btn.setAttribute('aria-expanded', String(o));
        document.body.style.overflow = o ? 'hidden' : '';
      });
      mob.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        mob.classList.remove('open');
        btn.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }));
    }
  });
})();
