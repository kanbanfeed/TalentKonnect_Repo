import { 
  getAdminClustersMock, 
  updateAdminClusterMock, 
  createAdminClusterMock,
  bulkUpdateClustersMock 
} from '../mocks/adminClusters';
import { 
  getAnalyticsSummaryMock, 
  getAnalyticsTrendsMock,
  getDetailedAnalyticsMock 
} from '../mocks/analyticsData';
import { ClusterItem, KPIData, TrendData } from '../types';

// Simulated API delay for realistic UX
const withDelay = <T>(promise: Promise<T>, delay: number = 0): Promise<T> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      promise.then(resolve).catch(reject);
    }, delay);
  });
};

export const mockApi = {
  admin: {
    clusters: {
      get: (): Promise<ClusterItem[]> => withDelay(getAdminClustersMock(), 200),
      update: (id: string, newTags: string[], newCategory: string): Promise<void> => 
        withDelay(updateAdminClusterMock(id, newTags, newCategory), 150),
      create: (itemData: {
        preview: string;
        suggestedTags: string[];
        currentCategory: string;
        author: string;
      }): Promise<ClusterItem> => withDelay(createAdminClusterMock(itemData), 300),
      bulkUpdate: (ids: string[], updates: Partial<Pick<ClusterItem, 'currentCategory' | 'status'>>): Promise<void> =>
        withDelay(bulkUpdateClustersMock(ids, updates), 300)
    },
  },
  analytics: {
    summary: {
      get: (): Promise<KPIData> => withDelay(getAnalyticsSummaryMock(), 100),
    },
    trends: {
      get: (): Promise<TrendData> => withDelay(getAnalyticsTrendsMock(), 150),
    },
    detailed: {
      get: (): Promise<any> => withDelay(getDetailedAnalyticsMock(), 200),
    }
  },
};


export async function api(path: string, opts: RequestInit = {}) {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const url = path.startsWith('http') ? path : `${base}${path}`;

  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${text || res.statusText}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
export default api;