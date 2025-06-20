import React, { useEffect, useState, useCallback } from 'react';
import { Search, Filter, RefreshCw, CheckCircle, Clock, Users, Plus } from 'lucide-react';
import api from '../../utils/api';
import { ClusterItem } from '../../types';
import ItemList from './components/ItemList';
import BulkActions from './components/BulkActions';
import FilterBar from './components/FilterBar';
import CreateItemModal, { CreateItemData } from './components/CreateItemModal';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import './AdminClusteringDashboard.css';

const AdminClusteringDashboard: React.FC = () => {
  const [clusterItems, setClusterItems] = useState<ClusterItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ClusterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchClusterItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.clusters.get();
      setClusterItems(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError('Failed to fetch cluster items. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter items based on search and filters
  useEffect(() => {
    let filtered = clusterItems;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.preview.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.suggestedTags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.currentCategory === categoryFilter);
    }

    setFilteredItems(filtered);
  }, [clusterItems, searchTerm, statusFilter, categoryFilter]);

  useEffect(() => {
    fetchClusterItems();
  }, [fetchClusterItems]);

  const handleItemUpdate = async (id: string, newTags: string[], newCategory: string) => {
    try {
      await api.admin.clusters.update(id, newTags, newCategory);
      setClusterItems(prevItems =>
        prevItems.map(item =>
          item.id === id 
            ? { ...item, suggestedTags: newTags, currentCategory: newCategory, status: 'reviewed' } 
            : item
        )
      );
      // Remove from selection after update
      setSelectedItems(prev => prev.filter(itemId => itemId !== id));
    } catch (err) {
      console.error('Failed to update item:', err);
      setError('Failed to update item. Please try again.');
    }
  };

  const handleCreateItem = async (itemData: CreateItemData) => {
    try {
      const newItem = await api.admin.clusters.create(itemData);
      setClusterItems(prevItems => [newItem, ...prevItems]);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to create item:', err);
      setError('Failed to create new item. Please try again.');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedItems.length === 0) return;
    
    try {
      await api.admin.clusters.bulkUpdate(selectedItems, { status: 'approved' });
      setClusterItems(prevItems =>
        prevItems.map(item =>
          selectedItems.includes(item.id)
            ? { ...item, status: 'approved' }
            : item
        )
      );
      setSelectedItems([]);
    } catch (err) {
      console.error('Failed to approve items:', err);
      setError('Failed to approve selected items. Please try again.');
    }
  };

  const handleBulkReassign = async (newCategory: string) => {
    if (selectedItems.length === 0) return;
    
    try {
      await api.admin.clusters.bulkUpdate(selectedItems, { 
        currentCategory: newCategory, 
        status: 'reviewed' 
      });
      setClusterItems(prevItems =>
        prevItems.map(item =>
          selectedItems.includes(item.id)
            ? { ...item, currentCategory: newCategory, status: 'reviewed' }
            : item
        )
      );
      setSelectedItems([]);
    } catch (err) {
      console.error('Failed to reassign items:', err);
      setError('Failed to reassign selected items. Please try again.');
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prevSelected =>
      prevSelected.includes(id)
        ? prevSelected.filter(item => item !== id)
        : [...prevSelected, id]
    );
  };

  const selectAllVisible = () => {
    const visibleIds = filteredItems.map(item => item.id);
    setSelectedItems(visibleIds);
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  // Stats for dashboard header
  const stats = {
    total: clusterItems.length,
    pending: clusterItems.filter(item => item.status === 'pending_review').length,
    approved: clusterItems.filter(item => item.status === 'approved').length,
    reviewed: clusterItems.filter(item => item.status === 'reviewed').length,
  };

  return (
    <div className="admin-clustering-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Admin Clustering Dashboard</h1>
          <p className="header-description">
            Review and manage community submissions with intelligent clustering and bulk actions.
          </p>
          {lastUpdated && (
            <p className="last-updated">Last updated: {lastUpdated}</p>
          )}
        </div>
        
        <div className="dashboard-stats">
          <div className="stat-item">
            <Users size={20} />
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Items</span>
          </div>
          <div className="stat-item">
            <Clock size={20} />
            <span className="stat-value">{stats.pending}</span>
            <span className="stat-label">Pending Review</span>
          </div>
          <div className="stat-item">
            <CheckCircle size={20} />
            <span className="stat-value">{stats.approved}</span>
            <span className="stat-label">Approved</span>
          </div>
        </div>
      </div>

      <div className="dashboard-controls">
        <Card className="controls-card">
          <div className="search-section">
            <div className="search-input-wrapper">
              <Search size={20} />
              <input
                type="text"
                placeholder="Search by content, tags, or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="header-actions">
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                icon={Plus}
                variant="primary"
                size="sm"
              >
                Create Item
              </Button>
              <Button 
                onClick={fetchClusterItems} 
                loading={loading}
                icon={RefreshCw}
                variant="ghost"
                size="sm"
              >
                Refresh
              </Button>
            </div>
          </div>

          <FilterBar
            statusFilter={statusFilter}
            categoryFilter={categoryFilter}
            onStatusChange={setStatusFilter}
            onCategoryChange={setCategoryFilter}
          />

          {selectedItems.length > 0 && (
            <div className="selection-info">
              <Badge variant="primary" size="md">
                {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
              </Badge>
              <div className="selection-actions">
                <Button onClick={selectAllVisible} variant="ghost" size="sm">
                  Select All Visible ({filteredItems.length})
                </Button>
                <Button onClick={clearSelection} variant="ghost" size="sm">
                  Clear Selection
                </Button>
              </div>
            </div>
          )}

          <BulkActions
            onApprove={handleBulkApprove}
            onReassignCategory={handleBulkReassign}
            hasSelectedItems={selectedItems.length > 0}
            selectedCount={selectedItems.length}
          />
        </Card>
      </div>

      {error && (
        <Card className="error-card">
          <p className="error-message">{error}</p>
          <Button onClick={() => setError(null)} variant="ghost" size="sm">
            Dismiss
          </Button>
        </Card>
      )}

      <div className="items-section">
        {loading && (
          <Card className="loading-card">
            <div className="loading-content">
              <div className="loading-spinner" />
              <p>Loading cluster items...</p>
            </div>
          </Card>
        )}

        {!loading && filteredItems.length === 0 && !error && (
          <Card className="empty-state">
            <div className="empty-content">
              <Filter size={48} />
              <h3>No items found</h3>
              <p>
                {clusterItems.length === 0 
                  ? "No cluster items to display yet." 
                  : "Try adjusting your search or filter criteria."}
              </p>
            </div>
          </Card>
        )}

        {!loading && filteredItems.length > 0 && (
          <ItemList
            items={filteredItems}
            onUpdateItem={handleItemUpdate}
            onToggleSelect={toggleSelectItem}
            selectedItems={selectedItems}
          />
        )}
      </div>

      <CreateItemModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateItem={handleCreateItem}
      />
    </div>
  );
};

export default AdminClusteringDashboard;