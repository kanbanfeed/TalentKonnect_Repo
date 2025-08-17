import React, { useState, useEffect} from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState('onboarding');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [ticketCount, setTicketCount] = useState<number>(0);

// read last used userId (set by raffle form / success page)
const currentUserId =
  (typeof window !== 'undefined' && (sessionStorage.getItem('raffle_userId') || localStorage.getItem('raffle_userId'))) ||
  'demo-user-1'; // fallback for demo

async function refreshTickets() {
  try {
    if (!currentUserId) return;
    const base = location.hostname === 'localhost' ? 'http://localhost:3000' : '';
    const r = await fetch(`${base}/api/raffle/tickets/${encodeURIComponent(currentUserId)}`);
    if (!r.ok) return;
    const data = await r.json();
    setTicketCount(Number(data?.tickets || 0));
  } catch {}
}

useEffect(() => {
  refreshTickets();

  // update when tab is focused again (e.g., after Stripe)
  const onFocus = () => refreshTickets();
  document.addEventListener('visibilitychange', onFocus);
  window.addEventListener('focus', onFocus);

  // also check when storage changes (another tab/success page could write)
  const onStorage = (e: StorageEvent) => {
    if (e.key === 'tk_pending_checkout' || e.key === 'raffle_entries') refreshTickets();
  };
  window.addEventListener('storage', onStorage);

  return () => {
    document.removeEventListener('visibilitychange', onFocus);
    window.removeEventListener('focus', onFocus);
    window.removeEventListener('storage', onStorage);
  };
}, []);

  const modules = [
    { 
      name: 'Onboarding', 
      key: 'onboarding',
      icon: '👤',
      url: 'https://marvelous-salamander-ad0b63.netlify.app/',
      description: 'User onboarding & skill declaration'
    },
    { 
      name: 'Wallet', 
      key: 'wallet',
      icon: '💰',
      url: 'https://illustrious-conkies-8acc67.netlify.app/',
      description: 'Credit wallet & ledger API'
    },
    { 
      name: 'Post Gig', 
      key: 'post-gig',
      icon: '📝',
      url: 'https://684d1b298370479379eda1a8--candidate-003-talentkonnect-module-po.netlify.app/',
      description: 'Micro-task posting'
    },
    { 
      name: 'Complete Gig', 
      key: 'complete-gig',
      icon: '✅',
      url: 'https://candidate-004-talentkonnect-module-co.netlify.app/',
      description: 'Micro-task matching & completion'
    },
    { 
      name: 'Feed', 
      key: 'feed',
      icon: '📰',
      url: 'https://sweet-phoenix-fee6a2.netlify.app/',
      description: 'Feed & discovery'
    },
    { 
      name: 'Referral', 
      key: 'referral',
      icon: '🤝',
      url: 'https://starlit-blini-d5e2d3.netlify.app/',
      description: 'Referral widget'
    },
    { 
      name: 'Credit Conversion', 
      key: 'credit-conversion',
      icon: '🔄',
      url: 'https://talentkonnect-shujath.netlify.app/',
      description: 'Credit-to-token conversion'
    },
    { 
      name: 'Notifications', 
      key: 'notifications',
      icon: '🔔',
      url: 'https://talentkonnect-assessment.netlify.app/',
      description: 'Notifications & reminders'
    },
    { 
      name: 'Admin Clustering', 
      key: 'admin-clustering',
      icon: '👥',
      url: 'https://talentkonnect-clustering-ayushmaan.netlify.app/',
      description: 'Admin clustering dashboard'
    },
    { 
      name: 'Analytics', 
      key: 'analytics',
      icon: '📊',
      url: 'https://merry-bunny-e481b5.netlify.app/',
      description: 'Analytics & reporting'
    },
    {
  name: 'Qualification Gate',
  key: 'qualification',
  icon: '🧪',
  url: '/modules/qualification-gate/index.html',
  description: 'Qualification quiz (paid/free) with validation'
},
{
  name: 'Daily Spotlight',
  key: 'spotlight',
  icon: '🌟',
  url: '/modules/daily-spotlight/index.html',
  description: 'Daily winner dashboard (04:30 IST)'
},
{
  name: 'Raffle',
  key: 'raffle',
  icon: '🎟️',
  url: '/modules/raffle/index.html',
  description: 'Buy raffle entries (Stripe test mode)'
}

  ];

  const currentModule = modules.find(m => m.key === activeModule);



  // ... your component code

  useEffect(() => {
    // ⬅️ Paste your actual Stripe Payment Link (test mode) here
    const PAYMENT_LINK = 'https://buy.stripe.com/test_4gMeVf92uc8j4KMdUU1VK00';

    const onMsg = (e: MessageEvent) => {
      const msg = e.data;
      if (msg?.type === 'TK_CHECKOUT_REQUEST') {
        const { userId, entries } = msg.payload || {};
          sessionStorage.setItem('raffle_userId', userId);
          sessionStorage.setItem('raffle_entries', String(entries));
        // stash info so success page can credit tickets
        localStorage.setItem(
          'tk_pending_checkout',
          JSON.stringify({
            userId: String(userId || ''),
            entries: Number(entries || 1),
            ts: Date.now(),
          })
        );

        // top-level navigation to Payment Link (no popup)
        window.location.assign(PAYMENT_LINK);
      }
    };

    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);




  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <div className="header-content">
            <button
            className="menu-btn"
            aria-label="Toggle navigation"
            aria-controls="sidebar"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen(v => !v)}>
            ☰
            </button>
              <h1>Gamified Micro-Task Marketplace</h1>
            <div className="logo">
              <span className="logo-talent">talent</span><span className="logo-konnect">konnect</span>
            </div>
            
          </div>
        </header>

        <div className="app-layout">
          <nav className={`sidebar ${sidebarOpen ? 'open' : ''} `} id="sidebar">
            <div className="nav-section">
              <h3>Modules</h3>
              {modules.map((module, index) => (
  <button
    key={index}
     onClick={() => {
      setActiveModule(module.key);
      if (window.innerWidth < 1024) setSidebarOpen(false);}}
    className={`nav-link ${activeModule === module.key ? 'active' : ''}`}
    aria-label={`Open ${module.name} module`}
  >
    <span className="nav-icon">{module.icon}</span>
    <span className="nav-text">{module.name}</span>

    {/* Badge for Raffle */}
    {module.key === 'raffle' && (
      <span
        className="ml-auto inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-medium"
        style={{
          backgroundColor: '#2563EB22',           // action color, faint
          color: '#ffffff',                        // #2563EB
          border: '1px solid #2563EB33',
          minWidth: 24
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
           {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
          <main className="main-content">
            <div className="module-header">
              <h2>{currentModule?.name}</h2>
              <p>{currentModule?.description}</p>
            </div>
            
            <div className="module-frame">
              {currentModule && (
              <iframe 
              src={currentModule.url}
              title={currentModule.name}
              className="module-iframe no-scrollbar"
              sandbox="allow-scripts allow-same-origin allow-forms allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
              />
              )}
            </div>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;