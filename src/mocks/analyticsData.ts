import { KPIData, TrendData } from '../types';

const generateTrendData = (baseValue: number, variance: number = 0.2): number[] => {
  return Array.from({ length: 7 }, (_, i) => {
    const trend = Math.sin(i * 0.5) * 0.1; // Slight upward trend
    const noise = (Math.random() - 0.5) * variance;
    return Math.max(0, Math.floor(baseValue * (1 + trend + noise)));
  });
};

export const getAnalyticsSummaryMock = (): Promise<KPIData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        dailyCredits: Math.floor(Math.random() * 500) + 750, // 750-1250
        activeUsers: Math.floor(Math.random() * 2000) + 2500, // 2500-4500
        newGigs: Math.floor(Math.random() * 80) + 120, // 120-200
        referrals: Math.floor(Math.random() * 40) + 35, // 35-75
      });
    }, 600);
  });
};

export const getAnalyticsTrendsMock = (): Promise<TrendData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        dailyCredits: generateTrendData(800, 0.15),
        activeUsers: generateTrendData(3200, 0.1),
        newGigs: generateTrendData(150, 0.2),
        referrals: generateTrendData(55, 0.25),
      });
    }, 400);
  });
};

// Additional analytics data for enhanced dashboard
export const getDetailedAnalyticsMock = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        userEngagement: {
          averageSessionDuration: '12m 34s',
          bounceRate: '23.4%',
          pageViewsPerSession: 4.2,
          returningUserRate: '67.8%'
        },
        revenueMetrics: {
          totalRevenue: '$12,450',
          averageOrderValue: '$34.20',
          conversionRate: '3.8%',
          monthlyRecurringRevenue: '$8,900'
        },
        contentPerformance: {
          topCategories: [
            { name: 'Tech & Dev', engagement: 92 },
            { name: 'Health & Wellness', engagement: 87 },
            { name: 'Home & Living', engagement: 78 },
            { name: 'Art & Craft', engagement: 73 }
          ],
          completionRates: {
            quickTips: '89%',
            tutorials: '76%',
            guides: '68%'
          }
        }
      });
    }, 500);
  });
};