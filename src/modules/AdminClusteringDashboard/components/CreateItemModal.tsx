import React, { useState } from 'react';
import { Plus, Tag, User, FolderOpen } from 'lucide-react';
import { categories } from '../../../mocks/adminClusters';
import Modal from '../../../components/Modal';
import Input from '../../../components/Input';
import Textarea from '../../../components/Textarea';
import Select from '../../../components/Select';
import Button from '../../../components/Button';
import Badge from '../../../components/Badge';
import './CreateItemModal.css';

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateItem: (itemData: CreateItemData) => void;
}

export interface CreateItemData {
  preview: string;
  suggestedTags: string[];
  currentCategory: string;
  author: string;
}

const CreateItemModal: React.FC<CreateItemModalProps> = ({
  isOpen,
  onClose,
  onCreateItem
}) => {
  const [formData, setFormData] = useState<CreateItemData>({
    preview: '',
    suggestedTags: [],
    currentCategory: '',
    author: ''
  });
  
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof CreateItemData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryOptions = [
    { value: '', label: 'Select a category...' },
    ...categories.map(cat => ({ value: cat, label: cat }))
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateItemData, string>> = {};

    if (!formData.preview.trim()) {
      newErrors.preview = 'Content preview is required';
    } else if (formData.preview.trim().length < 20) {
      newErrors.preview = 'Preview must be at least 20 characters long';
    } else if (formData.preview.trim().length > 200) {
      newErrors.preview = 'Preview must be less than 200 characters';
    }

    if (!formData.author.trim()) {
      newErrors.author = 'Author name is required';
    } else if (formData.author.trim().length < 2) {
      newErrors.author = 'Author name must be at least 2 characters';
    }

    if (!formData.currentCategory) {
      newErrors.currentCategory = 'Category selection is required';
    }

    if (formData.suggestedTags.length === 0) {
      newErrors.suggestedTags = 'At least one tag is required';
    } else if (formData.suggestedTags.length > 8) {
      newErrors.suggestedTags = 'Maximum 8 tags allowed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CreateItemData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    
    if (!trimmedTag) return;
    
    if (formData.suggestedTags.includes(trimmedTag)) {
      return; // Tag already exists
    }
    
    if (formData.suggestedTags.length >= 8) {
      return; // Max tags reached
    }

    setFormData(prev => ({
      ...prev,
      suggestedTags: [...prev.suggestedTags, trimmedTag]
    }));
    setTagInput('');
    
    // Clear tags error if it exists
    if (errors.suggestedTags) {
      setErrors(prev => ({ ...prev, suggestedTags: undefined }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      suggestedTags: prev.suggestedTags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      onCreateItem(formData);
      
      // Reset form
      setFormData({
        preview: '',
        suggestedTags: [],
        currentCategory: '',
        author: ''
      });
      setTagInput('');
      setErrors({});
      
      onClose();
    } catch (error) {
      console.error('Failed to create item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Cluster Item"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="create-item-form">
        <div className="form-section">
          <div className="section-header">
            <User size={20} />
            <h3>Author Information</h3>
          </div>
          
          <Input
            label="Author Name"
            placeholder="Enter the author's name..."
            value={formData.author}
            onChange={(e) => handleInputChange('author', e.target.value)}
            error={errors.author}
            fullWidth
            disabled={isSubmitting}
          />
        </div>

        <div className="form-section">
          <div className="section-header">
            <FolderOpen size={20} />
            <h3>Content Details</h3>
          </div>
          
          <Textarea
            label="Content Preview"
            placeholder="Enter a detailed preview of the content (20-200 characters)..."
            value={formData.preview}
            onChange={(e) => handleInputChange('preview', e.target.value)}
            error={errors.preview}
            helperText={`${formData.preview.length}/200 characters`}
            fullWidth
            disabled={isSubmitting}
            rows={4}
          />
          
          <Select
            label="Category"
            options={categoryOptions}
            value={formData.currentCategory}
            onChange={(e) => handleInputChange('currentCategory', e.target.value)}
            error={errors.currentCategory}
            disabled={isSubmitting}
          />
        </div>

        <div className="form-section">
          <div className="section-header">
            <Tag size={20} />
            <h3>Tags</h3>
          </div>
          
          <div className="tag-input-section">
            <div className="tag-input-wrapper">
              <Input
                label="Add Tags"
                placeholder="Type a tag and press Enter or click Add..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagInputKeyPress}
                helperText={`${formData.suggestedTags.length}/8 tags added`}
                disabled={isSubmitting || formData.suggestedTags.length >= 8}
                fullWidth
              />
              <Button
                type="button"
                onClick={handleAddTag}
                disabled={!tagInput.trim() || formData.suggestedTags.length >= 8 || isSubmitting}
                icon={Plus}
                variant="secondary"
                size="md"
              >
                Add Tag
              </Button>
            </div>
            
            {errors.suggestedTags && (
              <span className="tag-error">{errors.suggestedTags}</span>
            )}
            
            {formData.suggestedTags.length > 0 && (
              <div className="tags-preview">
                <h4>Current Tags:</h4>
                <div className="tags-list">
                  {formData.suggestedTags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="primary"
                      size="md"
                      className="removable-tag"
                      onClick={() => !isSubmitting && handleRemoveTag(tag)}
                    >
                      {tag}
                      {!isSubmitting && <span className="remove-tag">×</span>}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <Button
            type="button"
            onClick={handleClose}
            variant="ghost"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Item...' : 'Create Item'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateItemModal;