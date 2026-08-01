import React from 'react';
import './Button.css';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  className = '',
  icon,
  loading = false,
  fullWidth = false,
  ...props
}) {
  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    disabled && 'btn-disabled',
    loading && 'btn-loading',
    fullWidth && 'btn-full-width',
    className
  ].filter(Boolean).join(' ');

  // Fallback native click handler for cases where React synthetic events don't work
  const handleNativeClick = (e) => {
    if (onClick && typeof onClick === 'function') {
      onClick(e);
    }
  };

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      onMouseDown={(e) => {
        // Ensure button gets focus for keyboard events
        e.currentTarget.focus();
      }}
      onTouchStart={(e) => {
        // Handle touch events too
        if (onClick && typeof onClick === 'function') {
          onClick(e);
        }
      }}
      onPointerDown={(e) => {
        // Handle pointer events (this covers mouse, touch, and pen)
        if (!disabled && !loading && onClick && typeof onClick === 'function') {
          onClick(e);
        }
      }}
      {...props}
    >
      {loading && <span className="btn-spinner"></span>}
      {icon && <span className="btn-icon">{icon}</span>}
      <span className="btn-text">{children}</span>
    </button>
  );
}
