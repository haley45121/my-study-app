import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-fallback animate-in" style={{
          padding: '4rem 2rem',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Oops!</h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Something went wrong while loading this page. This usually happens if there's a connection issue with the database.
          </p>
          <div className="panel" style={{ textAlign: 'left', marginBottom: '2rem', fontSize: '0.9rem', color: '#ef4444' }}>
            <code>{this.state.error?.toString()}</code>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={() => window.location.reload()}
            style={{ padding: '0.75rem 2rem' }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
