/**
 * Premium Guard Script
 * Schützt Premium-Content vor unbefugtem Zugriff
 * Einfach am Anfang jeder Premium-Seite einbinden: <script src="/premium-guard.js"></script>
 */

function checkPremiumAccess() {
  const token = localStorage.getItem('premiumToken');
  const email = localStorage.getItem('premiumEmail');
  const expiry = localStorage.getItem('premiumExpiry');

  // Debugging
  console.log('🔍 Premium Check:', {
    hasToken: !!token,
    hasEmail: !!email,
    expiry: expiry ? new Date(parseInt(expiry)) : null,
    isExpired: expiry ? Date.now() > parseInt(expiry) : true
  });

  // Token fehlt oder abgelaufen
  if (!token || !email || !expiry || Date.now() > parseInt(expiry)) {
    console.warn('❌ Premium Zugang abgelaufen oder fehlt');
    
    // Optionen:
    // 1. Zur Pricing-Page weiterleiten
    // window.location.href = '/amana_club_pricing_page.html';
    
    // 2. Modal anzeigen
    showPremiumModal();
    
    return false;
  }

  // Zugang gewährt
  console.log('✅ Premium Zugang aktiv für:', email);
  showUserInfo(email);
  return true;
}

function showUserInfo(email) {
  const userInfoEl = document.getElementById('user-info');
  if (userInfoEl) {
    userInfoEl.innerHTML = `
      <div style="background: #27ae60; color: white; padding: 10px; border-radius: 5px; text-align: center;">
        ✅ Premium aktiv | ${email} | <a href="#" onclick="logout(); return false;" style="color: white; text-decoration: underline;">Logout</a>
      </div>
    `;
  }
}

function showPremiumModal() {
  const modal = document.createElement('div');
  modal.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    ">
      <div style="
        background: white;
        padding: 40px;
        border-radius: 10px;
        text-align: center;
        max-width: 500px;
      ">
        <h2>🔒 Premium Content</h2>
        <p>Du benötigst einen aktiven Premium-Zugang um diese Inhalte zu sehen.</p>
        <button onclick="window.location.href='/amana_club_pricing_page.html'" style="
          background: #667eea;
          color: white;
          border: none;
          padding: 12px 30px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
        ">
          🎯 Zum Premium Club
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Content verstecken
  document.body.style.overflow = 'hidden';
}

function logout() {
  localStorage.removeItem('premiumToken');
  localStorage.removeItem('premiumEmail');
  localStorage.removeItem('premiumExpiry');
  console.log('👋 Logout erfolgreich');
  window.location.href = '/amana_club_pricing_page.html';
}

// Beim Laden der Seite prüfen
document.addEventListener('DOMContentLoaded', checkPremiumAccess);
