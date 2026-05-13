(function () {
  /* ── Styles ── */
  const style = document.createElement('style');
  style.textContent = `
    nav{position:sticky;top:0;z-index:100;background:rgba(13,13,13,.95);backdrop-filter:blur(12px);border-bottom:1px solid rgba(201,168,76,.2);padding:0 2rem}
    .nav-inner{max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:62px}
    .nav-brand{display:flex;align-items:center;gap:.75rem;text-decoration:none}
    .nav-logo{width:36px;height:36px;border-radius:6px;background:#C9A84C;display:grid;place-items:center;font-size:1.1rem;flex-shrink:0;color:#0D0D0D}
    .brand-title{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;color:#E8E4DC;letter-spacing:.02em}
    .brand-sub{font-size:.52rem;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:#C9A84C}
    .nav-links{display:flex;align-items:center;gap:.25rem;list-style:none}
    .nav-links a{padding:.45rem .9rem;font-size:.8rem;font-weight:600;color:#888;border-radius:4px;transition:color .2s,background .2s;text-decoration:none;letter-spacing:.01em}
    .nav-links a:hover{color:#E8E4DC;background:rgba(255,255,255,.06)}
    .nav-links a.nav-active{color:#C9A84C;background:rgba(201,168,76,.08)}
    .hamburger{display:none;flex-direction:column;gap:5px;background:none;border:1px solid rgba(201,168,76,.2);border-radius:4px;padding:8px;cursor:pointer;width:38px;height:38px;align-items:center;justify-content:center}
    .hamburger span{display:block;width:18px;height:1.5px;background:#E8E4DC;border-radius:2px;transition:all .3s}
    .hamburger.open span:nth-child(1){transform:translateY(6.5px) rotate(45deg)}
    .hamburger.open span:nth-child(2){opacity:0}
    .hamburger.open span:nth-child(3){transform:translateY(-6.5px) rotate(-45deg)}
    .aa-mobile-nav{position:fixed;top:62px;left:0;right:0;bottom:0;background:rgba(13,13,13,.97);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.75rem;opacity:0;pointer-events:none;transition:opacity .3s;z-index:99}
    .aa-mobile-nav.open{opacity:1;pointer-events:all}
    .aa-mobile-nav a{font-family:'Playfair Display',serif;font-size:1.5rem;color:#E8E4DC;transition:color .2s;text-decoration:none}
    .aa-mobile-nav a:hover{color:#C9A84C}
    @media(max-width:860px){.nav-links{display:none!important}.hamburger{display:flex!important}}
  `;
  document.head.appendChild(style);

  /* ── Active link detection ── */
  const page = window.location.pathname.split('/').pop() || 'index.html';
  function isActive(href) {
    return page === href ? 'class="nav-active"' : '';
  }

  /* ── HTML ── */
  const navHTML = `
  <nav aria-label="Hauptnavigation">
    <div class="nav-inner">
      <a href="index.html" class="nav-brand" aria-label="Amana Aktien Startseite">
        <div class="nav-logo" aria-hidden="true">☪</div>
        <div>
          <div class="brand-title">Amana Aktien</div>
          <div class="brand-sub">Halal Investieren</div>
        </div>
      </a>
      <ul class="nav-links" role="list">
        <li><a href="aktien-analysen.html" ${isActive('aktien-analysen.html')}>Halal Aktien-Analysen</a></li>
        <li><a href="halal-etf-liste.html" ${isActive('halal-etf-liste.html')}>Halal ETFs</a></li>
        <li><a href="blog.html" ${isActive('blog.html')}>Blog</a></li>
      </ul>
      <button class="hamburger" id="aa-hamburgerBtn" aria-expanded="false" aria-label="Menü öffnen">
        <span></span><span></span><span></span>
      </button>
    </div>
  </nav>
  <div class="aa-mobile-nav" id="aa-mobileNav" role="dialog" aria-modal="true" aria-label="Mobilmenü">
    <a href="index.html">Startseite</a>
    <a href="aktien-analysen.html">Halal Aktien-Analysen</a>
    <a href="halal-etf-liste.html">Halal ETFs</a>
    <a href="blog.html">Blog</a>
  </div>`;

  /* ── Inject ── */
  const placeholder = document.getElementById('site-nav');
  if (placeholder) {
    placeholder.outerHTML = navHTML;
  } else {
    document.body.insertAdjacentHTML('afterbegin', navHTML);
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
    mob.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      mob.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }));
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
