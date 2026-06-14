import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Uncaught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 52%, #dc2626 100%)',
          }}
        >
          <div
            style={{
              width: 'min(100%, 480px)',
              background: 'rgba(255,251,240,0.97)',
              borderRadius: '20px',
              padding: '36px 28px',
              boxShadow: '0 24px 60px rgba(106,21,25,0.28)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#7a1f1f' }}>
              Something went wrong
            </h1>
            <p style={{ marginTop: 10, fontSize: '0.9rem', color: '#8a5a2b', lineHeight: 1.6 }}>
              An unexpected error occurred. Try refreshing the page — if the problem persists, check your Firebase configuration.
            </p>
            {this.state.error?.message && (
              <pre
                style={{
                  marginTop: 16,
                  padding: '12px 14px',
                  background: '#fff5f5',
                  border: '1px solid #fecaca',
                  borderRadius: 10,
                  fontSize: '0.75rem',
                  color: '#b91c1c',
                  textAlign: 'left',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: 120,
                  overflow: 'auto',
                }}
              >
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: 24,
                width: '100%',
                padding: '13px 16px',
                border: 0,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #b71c1c 0%, #d62828 100%)',
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
