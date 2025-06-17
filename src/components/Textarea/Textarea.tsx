import React from 'react';
import './Textarea.css';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  className = '',
  id,
  ...props
}) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  
  const classes = [
    'textarea-wrapper',
    fullWidth && 'textarea-wrapper--full-width',
    error && 'textarea-wrapper--error',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {label && (
        <label htmlFor={textareaId} className="textarea-label">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className="textarea"
        {...props}
      />
      {error && <span className="textarea-error">{error}</span>}
      {helperText && !error && <span className="textarea-helper">{helperText}</span>}
    </div>
  );
};

export default Textarea;