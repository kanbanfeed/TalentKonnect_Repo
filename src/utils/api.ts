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

const api = {
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

export default api;