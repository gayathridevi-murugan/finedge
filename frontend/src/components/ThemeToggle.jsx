import React from 'react';
import { useTheme } from '../store/ThemeContext';
import '../styles/ThemeToggle.css';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-label={`Current theme: ${theme}`}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
