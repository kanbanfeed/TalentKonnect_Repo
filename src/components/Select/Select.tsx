import React from 'react';
import { ChevronDown } from 'lucide-react';
import './Select.css';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder,
  error,
  label,
  size = 'md',
  className = '',
  id,
  ...props
}) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  
  const classes = [
    'select-wrapper',
    `select-wrapper--${size}`,
    error && 'select-wrapper--error',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {label && (
        <label htmlFor={selectId} className="select-label">
          {label}
        </label>
      )}
      <div className="select-container">
        <select id={selectId} className="select" {...props}>
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="select-icon" size={16} />
      </div>
      {error && <span className="select-error">{error}</span>}
    </div>
  );
};

export default Select;