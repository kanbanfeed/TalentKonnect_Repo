import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import './App.css';
import TkDashboard from './modules/dashboard'; // adjust path if needed


const CROWBAR_LOGIN_URL = 'https://crowbar-master-site.vercel.app/login';
const CROWBAR_CHECKOUT_URL = 'https://crowbar-master-site.vercel.app/demo-checkout';

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState('onboarding');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ticketCount, setTicketCount] = useState<number>(0);
  const [hasCrowbarAccess, setHasCrowbarAccess] = useState(false); // 🔵 new

  /* ---------------- Crowbar access flag (Day-1 demo) -------------- */

  // On load, read from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const flag = window.localStorage.getItem('crowbar_access');
    setHasCrowbarAccess(flag === '1');
  }, []);

  // When user clicks "Login with Crowbar"
  const handleCrowbarLogin = () => {
    if (typeof window !== 'undefined') {
      // Day-1 demo: mark as logged in on this domain
      window.localStorage.setItem('crowbar_access', '1');
      setHasCrowbarAccess(true);
    }
    window.open(CROWBAR_LOGIN_URL, '_blank', 'noopener,noreferrer');
  };

  const handleOpenCrowbarCheckout = () => {
    window.open(CROWBAR_CHECKOUT_URL, '_blank', 'noopener,noreferrer');
  };

  /* ---------------- existing ticket / iframe logic ---------------- */

  function normalizeUserId(src: unknown): string {
    if (typeof src === 'string') return src.trim();
    if (src && typeof (src as any).value === 'string') return String((src as any).value).trim();
    if (src && (src as any).target && typeof (src as any).target.value === 'string')
      return String((src as any).target.value).trim();
    return '';
  }

  const refreshTickets = useCallback(async () => {
    try {
      let uid =
        (typeof window !== 'undefined' &&
          (sessionStorage.getItem('raffle_userId') ||
            localStorage.getItem('raffle_userId'))) ||
        '';

      if (!uid) uid = normalizeUserId((window as any).currentUserId);
      if (!uid) uid = localStorage.getItem('tk_user_id') || 'demo-user-1';
      uid = uid.trim();
      if (!uid) return;

      const baseURL =
        process.env.NODE_ENV === 'production'
          ? 'https://www.talentkonnect.com'
          : 'http://localhost:3000';

      const res = await fetch(
        `${baseURL}/api/raffle/tickets/${encodeURIComponent(uid)}`,
        { headers: { Accept: 'application/json' } }
      );

      if (!res.ok) {
        console.warn('[refreshTickets] fetch failed', res.status);
        return;
      }
      const data = await res.json().catch(() => ({}));
      setTicketCount(Number(data?.tickets || 0));
    } catch (e) {
      console.warn('[refreshTickets] error', e);
    }
  }, []);

  useEffect(() => {
    (window as any).refreshTickets = refreshTickets;
    return () => {
      try {
        delete (window as any).refreshTickets;
      } catch {}
    };
  }, [refreshTickets]);

  useEffect(() => {
    refreshTickets();
    const onFocus = () => refreshTickets();
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'tk_pending_checkout' || e.key === 'raffle_entries') refreshTickets();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onStorage);
    };
  }, [refreshTickets]);

  /* ----------------------- modules list ----------------------- */

  const modules = [
    // 🔹 optional: a future TK dashboard module (iframe)
    {
      name: 'Dashboard',
      key: 'dashboard',
      icon: '📋',
      url: 'src/modules/dashboard/index.html', // placeholder – can be updated later
      description:
        'Post Job, Apply to Job and Messaging preview — powered by Crowbar membership',
    },
    {
      name: 'Onboarding',
      key: 'onboarding',
      icon: '👤',
      url: 'https://marvelous-salamander-ad0b63.netlify.app/',
      description: 'User onboarding & skill declaration',
    },
    {
      name: 'Wallet',
      key: 'wallet',
      icon: '💰',
      url: 'https://illustrious-conkies-8acc67.netlify.app/',
      description: 'Credit wallet & ledger API',
    },
    {
      name: 'Post Gig',
      key: 'post-gig',
      icon: '📝',
      url: 'https://684d1b298370479379eda1a8--candidate-003-talentkonnect-module-po.netlify.app/',
      description: 'Micro-task posting',
    },
    {
      name: 'Complete Gig',
      key: 'complete-gig',
      icon: '✅',
      url: 'https://candidate-004-talentkonnect-module-co.netlify.app/',
      description: 'Micro-task matching & completion',
    },
    {
      name: 'Feed',
      key: 'feed',
      icon: '📰',
      url: 'https://sweet-phoenix-fee6a2.netlify.app/',
      description: 'Feed & discovery',
    },
    {
      name: 'Referral',
      key: 'referral',
      icon: '🤝',
      url: 'https://starlit-blini-d5e2d3.netlify.app/',
      description: 'Referral widget',
    },
    {
      name: 'Credit Conversion',
      key: 'credit-conversion',
      icon: '🔄',
      url: 'https://talentkonnect-shujath.netlify.app/',
      description: 'Credit-to-token conversion',
    },
    {
      name: 'Notifications',
      key: 'notifications',
      icon: '🔔',
      url: 'https://talentkonnect-assessment.netlify.app/',
      description: 'Notifications & reminders',
    },
    {
      name: 'Admin Clustering',
      key: 'admin-clustering',
      icon: '👥',
      url: 'https://talentkonnect-clustering-ayushmaan.netlify.app/',
      description: 'Admin clustering dashboard',
    },
    {
      name: 'Analytics',
      key: 'analytics',
      icon: '📊',
      url: 'https://merry-bunny-e481b5.netlify.app/',
      description: 'Analytics & reporting',
    },
    {
      name: 'Qualification Gate',
      key: 'qualification',
      icon: '🧪',
      url: '/modules/qualification-gate/index.html',
      description: 'Qualification quiz (paid/free) with validation',
    },
    {
      name: 'Daily Spotlight',
      key: 'spotlight',
      icon: '🌟',
      url: '/modules/daily-spotlight/index.html',
      description: 'Daily winner dashboard (04:30 IST)',
    },
    {
      name: 'Talent Credit',
      key: 'talent-credit',
      icon: '🎟️',
      url: '/modules/raffle/index.html',
      description:
        'All rewards are earned through skill, merit, and active participation — no element of chance or lottery is involved',
    },
  ];

  const currentModule = modules.find((m) => m.key === activeModule);

  // existing Stripe Payment Link listener (unchanged)
  useEffect(() => {
    const PAYMENT_LINK = 'https://buy.stripe.com/test_4gMeVf92uc8j4KMdUU1VK00';

    const onMsg = (e: MessageEvent) => {
      const msg = e.data;
      if (msg?.type === 'TK_CHECKOUT_REQUEST') {
        const { userId, entries } = msg.payload || {};
        sessionStorage.setItem('raffle_userId', userId);
        sessionStorage.setItem('raffle_entries', String(entries));
        localStorage.setItem(
          'tk_pending_checkout',
          JSON.stringify({
            userId: String(userId || ''),
            entries: Number(entries || 1),
            ts: Date.now(),
          })
        );
        window.location.assign(PAYMENT_LINK);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  return (
    <Router>
      <div className="app-container">
        {/* ---------- HEADER ---------- */}
        <header className="app-header">
          <div className="header-content">
            <button
              className="menu-btn"
              aria-label="Toggle navigation"
              aria-controls="sidebar"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen((v) => !v)}
            >
              ☰
            </button>

            {/* <h1>Gamified Micro-Task Marketplace</h1> */}

            <div className="logo">
              <span className="logo-talent">talent</span>
              <span className="logo-konnect">konnect</span>
            </div>

            {/* 🔵 New header actions */}
            <div className="header-actions">
              <button
                className="header-btn header-btn-text"
                disabled={!hasCrowbarAccess}
                onClick={() => {
                  if (!hasCrowbarAccess) return;
                  setActiveModule('dashboard'); // selects TK dashboard module
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
              >
                Dashboard
              </button>

              <button
                className="header-btn header-btn-outline"
                onClick={handleCrowbarLogin}
              >
                Login with Crowbar
              </button>

              <button
                className="header-btn header-btn-primary"
                onClick={handleOpenCrowbarCheckout}
              >
                Crowbar Membership
              </button>
            </div>
          </div>
        </header>

        {/* ---------- LAYOUT ---------- */}
        <div className="app-layout">
          {/* Sidebar */}
          <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`} id="sidebar">
            <div className="nav-section">
              <h3>Modules</h3>

              {!hasCrowbarAccess && (
                <p className="sidebar-locked">
                  Please login via <strong>Crowbar</strong> to unlock TalentKonnect
                  modules.
                </p>
              )}

              {hasCrowbarAccess &&
                modules.map((module) => (
                  <button
                    key={module.key}
                    onClick={() => {
                      setActiveModule(module.key);
                      if (window.innerWidth < 1024) setSidebarOpen(false);
                    }}
                    className={`nav-link ${
                      activeModule === module.key ? 'active' : ''
                    }`}
                    aria-label={`Open ${module.name} module`}
                  >
                    <span className="nav-icon">{module.icon}</span>
                    <span className="nav-text">{module.name}</span>

                    {module.key === 'talent-credit' && (
                      <span
                        className="ml-auto inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: '#2563EB22',
                          color: '#ffffff',
                          border: '1px solid #2563EB33',
                          minWidth: 24,
                        }}
                        aria-label={`You have ${ticketCount} raffle tickets`}
                        title={`${ticketCount} tickets`}
                      >
                        {ticketCount}
                      </span>
                    )}
                  </button>
                ))}
            </div>
          </nav>

          {sidebarOpen && (
            <div
              className="sidebar-backdrop"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main content */}
          <main className="main-content">
            {!hasCrowbarAccess ? (
              <div className="locked-state">
                <h2>Access powered by Crowbar Membership</h2>
                <p>
                  To use TalentKonnect modules (Post Job, Apply to Job,
                  Messaging, etc.), please login with your{' '}
                  <strong>Crowbar account</strong>.
                </p>
                <button
                  className="header-btn header-btn-primary"
                  onClick={handleCrowbarLogin}
                >
                  Login with Crowbar
                </button>
              </div>
            ) : (
              <>
                <div className="module-header">
                  <h2>{currentModule?.name}</h2>
                  <p>{currentModule?.description}</p>
                </div>

                <div className="module-frame">
  {hasCrowbarAccess && activeModule === 'dashboard' ? (
    <TkDashboard />
  ) : (
    currentModule &&
    currentModule.key !== 'dashboard' && (
      <iframe
        src={currentModule.url}
        title={currentModule.name}
        className="module-iframe no-scrollbar"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
      />
    )
  )}
</div>

              </>
            )}
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;
