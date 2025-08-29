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
            <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke="currentColor" strokeWidth="2"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor"/>
          </svg>
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;