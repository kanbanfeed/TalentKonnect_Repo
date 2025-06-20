import React, { useEffect, useState, useCallback } from 'react';
import { TrendingUp, Users, Zap, UserPlus, RefreshCw, Clock } from 'lucide-react';
import api from '../../utils/api';
import { KPIData, TrendData } from '../../types';
import KPITiles from './components/KPITiles';
import TrendCharts from './components/TrendCharts';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import './AnalyticsReporting.css';

const AnalyticsReporting: React.FC = () => {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summary, trends] = await Promise.all([
        api.analytics.summary.get(),
        api.analytics.trends.get()
      ]);
      setKpiData(summary);
      setTrendData(trends);
      setLastUpdated(new Date().toLocaleString());
    } catch (err) {
      setError('Failed to fetch analytics data. Please try again.');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    fetchData();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchData, 5 * 60 * 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchData, autoRefresh]);

  const handleManualRefresh = () => {
    fetchData();
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(prev => !prev);
  };

  // Calculate percentage changes (mock data for demo)
  const getPercentageChange = (current: number): string => {
    const change = (Math.random() - 0.5) * 20; // Random change between -10% and +10%
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  const kpiItems = kpiData ? [
    {
      title: 'Daily Credits',
      value: kpiData.dailyCredits,
      icon: Zap,
      color: 'accent',
      change: getPercentageChange(kpiData.dailyCredits),
      isPositive: Math.random() > 0.3
    },
    {
      title: 'Active Users',
      value: kpiData.activeUsers,
      icon: Users,
      color: 'primary',
      change: getPercentageChange(kpiData.activeUsers),
      isPositive: Math.random() > 0.2
    },
    {
      title: 'New Gigs',
      value: kpiData.newGigs,
      icon: TrendingUp,
      color: 'success',
      change: getPercentageChange(kpiData.newGigs),
      isPositive: Math.random() > 0.4
    },
    {
      title: 'Referrals',
      value: kpiData.referrals,
      icon: UserPlus,
      color: 'warning',
      change: getPercentageChange(kpiData.referrals),
      isPositive: Math.random() > 0.3
    }
  ] : [];

  return (
    <div className="analytics-reporting-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Analytics & Reporting</h1>
          <p className="header-description">
            Real-time insights into TalentKonnect's performance and user engagement.
          </p>
        </div>

        <div className="header-controls">
          <div className="refresh-controls">
            <Button
              onClick={handleManualRefresh}
              loading={loading}
              icon={RefreshCw}
              variant="ghost"
              size="sm"
            >
              Refresh
            </Button>
            
            <div className="auto-refresh-toggle">
              <input
                type="checkbox"
                id="auto-refresh"
                checked={autoRefresh}
                onChange={toggleAutoRefresh}
                className="toggle-checkbox"
              />
              <label htmlFor="auto-refresh" className="toggle-label">
                Auto-refresh (5min)
              </label>
            </div>
          </div>

          {lastUpdated && (
            <div className="last-updated">
              <Clock size={16} />
              <span>Last updated: {lastUpdated}</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <Card className="error-card">
          <p className="error-message">{error}</p>
          <Button onClick={() => setError(null)} variant="ghost" size="sm">
            Dismiss
          </Button>
        </Card>
      )}

      {loading && (
        <Card className="loading-card">
          <div className="loading-content">
            <div className="loading-spinner" />
            <p>Loading analytics data...</p>
          </div>
        </Card>
      )}

      {!loading && !error && kpiData && trendData && (
        <div className="analytics-content">
          <div className="kpi-section">
            <div className="section-header">
              <h2>Key Performance Indicators</h2>
              <Badge variant="primary" size="sm">Live Data</Badge>
            </div>
            <KPITiles items={kpiItems} />
          </div>

          <div className="trends-section">
            <div className="section-header">
              <h2>7-Day Trends</h2>
              <Badge variant="secondary" size="sm">Sparklines</Badge>
            </div>
            <TrendCharts data={trendData} />
          </div>
        </div>
      )}

      {!loading && !error && !kpiData && (
        <Card className="empty-state">
          <div className="empty-content">
            <TrendingUp size={48} />
            <h3>No analytics data available</h3>
            <p>Analytics data will appear here once the system starts collecting metrics.</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsReporting;