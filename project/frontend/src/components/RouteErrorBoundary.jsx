import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Route-specific Error Boundary
 * Provides navigation options when errors occur in specific routes
 */
class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Route Error:', error, errorInfo);
    this.setState({ error });
  }

  render() {
    if (this.state.hasError) {
      return (
        <RouteErrorFallback 
          error={this.state.error}
          routeName={this.props.routeName}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Fallback UI for route errors
 */
function RouteErrorFallback({ error, routeName }) {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <span style={styles.icon}>🚧</span>
        
        <h2 style={styles.title}>
          {routeName ? `Error in ${routeName}` : 'Page Error'}
        </h2>
        
        <p style={styles.message}>
          This page encountered an error and couldn't be displayed properly.
        </p>

        {error && (
          <div style={styles.errorBox}>
            <strong>Error:</strong> {error.message}
          </div>
        )}

        <div style={styles.buttonContainer}>
          <button onClick={handleGoBack} style={styles.button}>
            ← Go Back
          </button>
          
          <button 
            onClick={handleGoHome} 
            style={{...styles.button, ...styles.primaryButton}}
          >
            🏠 Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '80vh',
    padding: '20px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '40px',
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center'
  },
  icon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '16px'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '12px'
  },
  message: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '20px'
  },
  errorBox: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '4px',
    padding: '12px',
    marginBottom: '20px',
    fontSize: '14px',
    color: '#856404',
    textAlign: 'left'
  },
  buttonContainer: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center'
  },
  button: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    borderRadius: '4px',
    border: '1px solid #ddd',
    cursor: 'pointer',
    backgroundColor: 'white',
    color: '#333',
    transition: 'all 0.2s'
  },
  primaryButton: {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none'
  }
};

export default RouteErrorBoundary;
