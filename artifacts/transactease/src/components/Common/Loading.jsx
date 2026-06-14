import React from 'react';

const Loading = ({ message = 'Loading…' }) => {
  return (
    <div className="app-loading">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ animation: 'spin 0.9s linear infinite' }}
        >
          <circle cx="20" cy="20" r="17" stroke="rgba(198,40,40,0.2)" strokeWidth="4" />
          <path
            d="M20 3 A17 17 0 0 1 37 20"
            stroke="#c62828"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
        <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#7a1f1f', letterSpacing: '0.01em' }}>
          {message}
        </span>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Loading;
