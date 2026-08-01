import React from 'react';
import './Card.css';

export default function Card({
  children,
  className = '',
  hover = false,
  glass = false,
  padding = 'md',
  ...props
}) {
  const classes = [
    'card',
    hover && 'card-hover',
    glass && 'card-glass',
    `card-p-${padding}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
