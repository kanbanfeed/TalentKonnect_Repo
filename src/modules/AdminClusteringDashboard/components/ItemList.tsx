import React from 'react';
import { Calendar, User, Tag, Edit3 } from 'lucide-react';
import { ClusterItem } from '../../../types';
import { categories } from '../../../mocks/adminClusters';
import Card from '../../../components/Card';
import Badge from '../../../components/Badge';
import Select from '../../../components/Select';
import './ItemList.css';

interface ItemListProps {
  items: ClusterItem[];
  onUpdateItem: (id: string, newTags: string[], newCategory: string) => void;
  onToggleSelect: (id: string) => void;
  selectedItems: string[];
}

const ItemList: React.FC<ItemListProps> = ({ 
  items, 
  onUpdateItem, 
  onToggleSelect, 
  selectedItems 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusVariant = (status: ClusterItem['status']) => {
    switch (status) {
      case 'pending_review': return 'warning';
      case 'approved': return 'success';
      case 'reviewed': return 'primary';
      default: return 'neutral';
    }
  };

  const getStatusLabel = (status: ClusterItem['status']) => {
    switch (status) {
      case 'pending_review': return 'Pending Review';
      case 'approved': return 'Approved';
      case 'reviewed': return 'Reviewed';
      default: return status;
    }
  };

  const categoryOptions = categories.map(cat => ({
    value: cat,
    label: cat
  }));

  return (
    <div className="item-list">
      {items.map((item) => (
        <Card 
          key={item.id} 
          className={`item-card ${item.status === 'pending_review' ? 'pending-review' : ''}`}
          interactive={false}
        >
          <div className="item-header">
            <div className="item-selection">
              <input
                type="checkbox"
                id={`select-${item.id}`}
                checked={selectedItems.includes(item.id)}
                onChange={() => onToggleSelect(item.id)}
                className="item-checkbox"
              />
              <label htmlFor={`select-${item.id}`} className="sr-only">
                Select item
              </label>
            </div>
            
            <div className="item-meta">
              <div className="meta-item">
                <User size={14} />
                <span>{item.author}</span>
              </div>
              <div className="meta-item">
                <Calendar size={14} />
                <span>{formatDate(item.createdAt)}</span>
              </div>
            </div>

            <Badge variant={getStatusVariant(item.status)} size="sm">
              {getStatusLabel(item.status)}
            </Badge>
          </div>

          <div className="item-content">
            <p className="item-preview">{item.preview}</p>
            
            <div className="item-tags">
              <div className="tags-header">
                <Tag size={16} />
                <span>Suggested Tags</span>
              </div>
              <div className="tags-list">
                {item.suggestedTags.map((tag, index) => (
                  <Badge key={index} variant="neutral" size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="item-actions">
            <div className="category-section">
              <label htmlFor={`category-${item.id}`} className="category-label">
                <Edit3 size={16} />
                Category
              </label>
              <Select
                id={`category-${item.id}`}
                options={categoryOptions}
                value={item.currentCategory}
                onChange={(e) => onUpdateItem(item.id, item.suggestedTags, e.target.value)}
                size="sm"
              />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ItemList;