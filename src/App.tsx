import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Users, BarChart3, Zap } from 'lucide-react';
import AdminClusteringDashboard from './modules/AdminClusteringDashboard/AdminClusteringDashboard';
import AnalyticsReporting from './modules/AnalyticsReporting/AnalyticsReporting';
import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <div className="header-content">
            <div className="logo">
              <Zap size={28} />
              <span className="logo-talent">talent</span><span className="logo-konnect">konnect</span>
            </div>
            
            <nav className="main-navigation">
              <Link to="/admin-clustering" className="nav-link">
                <Users size={20} />
                <span>Admin Clustering</span>
              </Link>
              <Link to="/analytics-reporting" className="nav-link">
                <BarChart3 size={20} />
                <span>Analytics & Reporting</span>
              </Link>
            </nav>
          </div>
        </header>

        <main className="app-main-content">
          <Routes>
            <Route path="/admin-clustering" element={<AdminClusteringDashboard />} />
            <Route path="/analytics-reporting" element={<AnalyticsReporting />} />
            <Route path="/" element={<Navigate to="/admin-clustering" replace />} />
            <Route path="*" element={
              <div className="welcome-screen">
                <div className="welcome-content">
                  <div className="welcome-icon">
                    <Zap size={64} />
                  </div>
                  <h1>Welcome to TalentKonnect</h1>
                  <p className="welcome-description">
                    A gamified micro-task marketplace that turns everyday expertise into 
                    earnings and raffle credits—connecting hidden at-home talent with brands 
                    and peers for 5–15 min gigs, skill sharing, and community growth.
                  </p>
                  <div className="welcome-actions">
                    <Link to="/admin-clustering" className="welcome-button primary">
                      <Users size={20} />
                      Admin Clustering Dashboard
                    </Link>
                    <Link to="/analytics-reporting" className="welcome-button secondary">
                      <BarChart3 size={20} />
                      Analytics & Reporting
                    </Link>
                  </div>
                </div>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;