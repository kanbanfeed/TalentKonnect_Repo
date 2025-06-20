import React from 'react';
import { Filter } from 'lucide-react';
import { categories } from '../../../mocks/adminClusters';
import Select from '../../../components/Select';
import './FilterBar.css';

interface FilterBarProps {
  statusFilter: string;
  categoryFilter: string;
  onStatusChange: (status: string) => void;
  onCategoryChange: (category: string) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  statusFilter,
  categoryFilter,
  onStatusChange,
  onCategoryChange,
}) => {
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'reviewed', label: 'Reviewed' },
  ];

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...categories.map(cat => ({ value: cat, label: cat })),
  ];

  return (
    <div className="filter-bar">
      <div className="filter-header">
        <Filter size={16} />
        <span>Filters</span>
      </div>
      
      <div className="filter-controls">
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          size="sm"
          label="Status"
        />
        
        <Select
          options={categoryOptions}
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          size="sm"
          label="Category"
        />
      </div>
    </div>
  );
};

export default FilterBar;