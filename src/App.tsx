import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

const App: React.FC = () => {
  const modules = [
    { name: 'Onboarding', path: '/modules/onboarding/index.html', description: 'User onboarding module' },
    { name: 'Wallet', path: '/modules/wallet/index.html', description: 'Wallet management module' },
    { name: 'Post Gig', path: '/modules/post-gig/index.html', description: 'Post gig functionality' },
    { name: 'Complete Gig', path: '/modules/complete-gig/index.html', description: 'Complete gig module' },
    { name: 'Feed', path: '/modules/feed/index.html', description: 'Feed module' },
    { name: 'Referral', path: '/modules/referral/index.html', description: 'Referral system' },
    { name: 'Credit-to-Token Conversion', path: '/modules/credit-to-token-conversion/index.html', description: 'Credit conversion module' },
    { name: 'Notifications & Reminders', path: '/modules/notifications-reminders/index.html', description: 'Notifications system' },
    { name: 'Admin Clustering Dashboard', path: '/modules/admin-clustering-dashboard/index.html', description: 'Admin clustering' },
    { name: 'Analytics & Reporting', path: '/modules/analytics-reporting/index.html', description: 'Analytics dashboard' }
  ];

  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <div className="header-content">
            <div className="logo">
              <span className="logo-talent">talent</span><span className="logo-konnect">konnect</span>
            </div>
            <h1>TalentKonnect Monorepo</h1>
          </div>
        </header>

        <main className="app-main-content">
          <div className="modules-grid">
            <h2>Available Modules</h2>
            <p>Click on any module to view it in its original form:</p>
            
            <div className="modules-list">
              {modules.map((module, index) => (
                <div key={index} className="module-card">
                  <h3>{module.name}</h3>
                  <p>{module.description}</p>
                  <a 
                    href={module.path} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="module-link"
                  >
                    Open Module
                  </a>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </Router>
  );
};

export default App;