import { ClusterItem } from '../types';

export const mockClusterItems: ClusterItem[] = [
  {
    id: 'c1',
    preview: 'How to organize your pantry for maximum efficiency and reduce food waste - a complete guide.',
    suggestedTags: ['home', 'organization', 'cooking', 'sustainability'],
    currentCategory: 'Home & Living',
    status: 'pending_review',
    createdAt: '2024-01-15T10:30:00Z',
    author: 'Sarah M.'
  },
  {
    id: 'c2',
    preview: 'Quick debugging tips for React hooks - common pitfalls and solutions every developer should know.',
    suggestedTags: ['tech', 'programming', 'react', 'debugging'],
    currentCategory: 'Tech & Dev',
    status: 'approved',
    createdAt: '2024-01-14T14:22:00Z',
    author: 'Alex K.'
  },
  {
    id: 'c3',
    preview: 'Best core strengthening exercises you can do at home without any equipment - 15 minute routine.',
    suggestedTags: ['fitness', 'workout', 'health', 'core', 'home-workout'],
    currentCategory: 'Health & Wellness',
    status: 'pending_review',
    createdAt: '2024-01-14T09:15:00Z',
    author: 'Mike R.'
  },
  {
    id: 'c4',
    preview: 'Creative upcycling ideas for old furniture - transform discarded items into beautiful decor pieces.',
    suggestedTags: ['diy', 'upcycling', 'furniture', 'sustainability', 'crafts'],
    currentCategory: 'Art & Craft',
    status: 'pending_review',
    createdAt: '2024-01-13T16:45:00Z',
    author: 'Emma L.'
  },
  {
    id: 'c5',
    preview: 'Time management strategies for remote workers - boost productivity while maintaining work-life balance.',
    suggestedTags: ['productivity', 'remote-work', 'time-management', 'work-life-balance'],
    currentCategory: 'Career & Business',
    status: 'reviewed',
    createdAt: '2024-01-13T11:20:00Z',
    author: 'David P.'
  },
  {
    id: 'c6',
    preview: 'Beginner-friendly indoor herb garden setup - grow fresh herbs year-round in small spaces.',
    suggestedTags: ['gardening', 'herbs', 'indoor', 'beginners', 'sustainable-living'],
    currentCategory: 'Home & Living',
    status: 'pending_review',
    createdAt: '2024-01-12T13:10:00Z',
    author: 'Lisa T.'
  },
  {
    id: 'c7',
    preview: 'Photography composition rules that will instantly improve your smartphone photos.',
    suggestedTags: ['photography', 'smartphone', 'composition', 'tips', 'creative'],
    currentCategory: 'Art & Craft',
    status: 'approved',
    createdAt: '2024-01-12T08:30:00Z',
    author: 'Carlos J.'
  },
  {
    id: 'c8',
    preview: 'Quick and healthy meal prep ideas for busy professionals - 30 minutes Sunday prep for the week.',
    suggestedTags: ['meal-prep', 'healthy-eating', 'time-saving', 'nutrition', 'busy-lifestyle'],
    currentCategory: 'Health & Wellness',
    status: 'pending_review',
    createdAt: '2024-01-11T19:25:00Z',
    author: 'Nina S.'
  }
];

export const categories = [
  'Home & Living',
  'Tech & Dev',
  'Health & Wellness',
  'Art & Craft',
  'Career & Business',
  'Education & Learning',
  'Finance & Investment',
  'Travel & Adventure',
  'Food & Cooking',
  'Other'
];

export const getAdminClustersMock = (): Promise<ClusterItem[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockClusterItems);
    }, 800); // Realistic loading time
  });
};

export const updateAdminClusterMock = (
  id: string,
  newTags: string[],
  newCategory: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const itemIndex = mockClusterItems.findIndex(item => item.id === id);
      if (itemIndex !== -1) {
        mockClusterItems[itemIndex].suggestedTags = newTags;
        mockClusterItems[itemIndex].currentCategory = newCategory;
        mockClusterItems[itemIndex].status = 'reviewed';
        console.log(`Updated cluster ${id}:`, mockClusterItems[itemIndex]);
        resolve();
      } else {
        reject(new Error('Cluster item not found'));
      }
    }, 400);
  });
};

export const createAdminClusterMock = (
  itemData: {
    preview: string;
    suggestedTags: string[];
    currentCategory: string;
    author: string;
  }
): Promise<ClusterItem> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newItem: ClusterItem = {
        id: `c${Date.now()}`, // Simple ID generation
        preview: itemData.preview,
        suggestedTags: itemData.suggestedTags,
        currentCategory: itemData.currentCategory,
        status: 'pending_review',
        createdAt: new Date().toISOString(),
        author: itemData.author
      };
      
      mockClusterItems.unshift(newItem); // Add to beginning of array
      console.log('Created new cluster item:', newItem);
      resolve(newItem);
    }, 600);
  });
};

export const bulkUpdateClustersMock = (
  ids: string[],
  updates: Partial<Pick<ClusterItem, 'currentCategory' | 'status'>>
): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      ids.forEach(id => {
        const itemIndex = mockClusterItems.findIndex(item => item.id === id);
        if (itemIndex !== -1) {
          if (updates.currentCategory) {
            mockClusterItems[itemIndex].currentCategory = updates.currentCategory;
          }
          if (updates.status) {
            mockClusterItems[itemIndex].status = updates.status;
          }
        }
      });
      console.log(`Bulk updated ${ids.length} items:`, updates);
      resolve();
    }, 600);
  });
};