export interface ClusterItem {
  id: string;
  preview: string;
  suggestedTags: string[];
  currentCategory: string;
  status: 'pending_review' | 'approved' | 'reviewed';
  createdAt: string;
  author: string;
}

export interface KPIData {
  dailyCredits: number;
  activeUsers: number;
  newGigs: number;
  referrals: number;
}

export interface TrendData {
  dailyCredits: number[];
  activeUsers: number[];
  newGigs: number[];
  referrals: number[];
}

export interface AnalyticsData {
  kpi: KPIData;
  trends: TrendData;
}