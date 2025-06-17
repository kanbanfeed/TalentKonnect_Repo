import React, { useState } from 'react';
import { CheckCircle, FolderOpen, AlertTriangle } from 'lucide-react';
import { categories } from '../../../mocks/adminClusters';
import Button from '../../../components/Button';
import Select from '../../../components/Select';
import './BulkActions.css';

interface BulkActionsProps {
  onApprove: () => void;
  onReassignCategory: (category: string) => void;
  hasSelectedItems: boolean;
  selectedCount: number;
}

const BulkActions: React.FC<BulkActionsProps> = ({ 
  onApprove, 
  onReassignCategory, 
  hasSelectedItems,
  selectedCount 
}) => {
  const [reassignCategory, setReassignCategory] = useState('');

  const categoryOptions = [
    { value: '', label: 'Select category to reassign...' },
    ...categories.map(cat => ({ value: cat, label: cat }))
  ];

  const handleReassignClick = () => {
    if (reassignCategory && hasSelectedItems) {
      onReassignCategory(reassignCategory);
      setReassignCategory('');
    }
  };

  const handleApproveClick = () => {
    if (hasSelectedItems) {
      onApprove();
    }
  };

  return (
    <div className="bulk-actions">
      <div className="bulk-actions-header">
        <h3>Bulk Actions</h3>
        {hasSelectedItems && (
          <span className="selected-count">
            {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
          </span>
        )}
      </div>

      <div className="actions-grid">
        <div className="action-group">
          <Button
            onClick={handleApproveClick}
            disabled={!hasSelectedItems}
            icon={CheckCircle}
            variant="primary"
            size="md"
            fullWidth
          >
            Approve Selected
          </Button>
          <p className="action-description">
            Mark selected items as approved for publication
          </p>
        </div>

        <div className="action-group">
          <div className="reassign-controls">
            <Select
              options={categoryOptions}
              value={reassignCategory}
              onChange={(e) => setReassignCategory(e.target.value)}
              disabled={!hasSelectedItems}
              size="md"
            />
            <Button
              onClick={handleReassignClick}
              disabled={!hasSelectedItems || !reassignCategory}
              icon={FolderOpen}
              variant="secondary"
              size="md"
            >
              Reassign
            </Button>
          </div>
          <p className="action-description">
            Move selected items to a different category
          </p>
        </div>
      </div>

      {!hasSelectedItems && (
        <div className="no-selection-notice">
          <AlertTriangle size={16} />
          <span>Select items to enable bulk actions</span>
        </div>
      )}
    </div>
  );
};

export default BulkActions;