import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button 
      className="theme-toggle" 
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      style={{
        position: 'relative',
        width: '60px',
        height: '32px',
        background: theme === 'light' ? '#e2e8f0' : '#334155',
        border: 'none',
        borderRadius: '16px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        padding: '2px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: theme === 'light' ? 'flex-start' : 'flex-end'
      }}
    >
      <div 
        style={{
          width: '28px',
          height: '28px',
          background: 'var(--bg-card)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          boxShadow: 'var(--shadow-md)',
          color: 'var(--text-primary)'
        }}
      >
        {theme === 'light' ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
            <path d="m12 1-1 6m1-6 1 6m-1-6v6m8 5-6-1m6 1-6 1m6-1h-6m5 8-6-1m6 1-6 1m6-1h-6m-5 8 1-6m-1 6-1-6m1 6v-6m-8-5 6 1m-6-1 6-1m-6 1h6m-5-8 6 1m-6-1 6-1m-6 1h6" stroke="currentColor" strokeWidth="2"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2"/>
          </svg>
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;