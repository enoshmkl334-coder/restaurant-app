import React from 'react';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // Update state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      const { fallback, showDetails = false } = this.props;
      
      // If custom fallback provided, use it
      if (fallback) {
        return typeof fallback === 'function' 
          ? fallback(this.state.error, this.handleReset)
          : fallback;
      }

      // Default fallback UI
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.iconContainer}>
              <span style={styles.icon}>⚠️</span>
            </div>
            
            <h1 style={styles.title}>Oops! Something went wrong</h1>
            
            <p style={styles.message}>
              We're sorry for the inconvenience. The application encountered an unexpected error.
            </p>

            {showDetails && this.state.error && (
              <details style={styles.details}>
                <summary style={styles.summary}>Error Details</summary>
                <pre style={styles.errorText}>
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div style={styles.buttonContainer}>
              <button 
                onClick={this.handleReset} 
                style={styles.button}
              >
                Try Again
              </button>
              
              <button 
                onClick={this.handleReload} 
                style={{...styles.button, ...styles.secondaryButton}}
              >
                Reload Page
              </button>
            </div>

            {this.state.errorCount > 2 && (
              <p style={styles.persistentError}>
                This error keeps occurring. Please contact support if the problem persists.
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Inline styles for the error boundary
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '40px',
    maxWidth: '600px',
    width: '100%',
    textAlign: 'center'
  },
  iconContainer: {
    marginBottom: '20px'
  },
  icon: {
    fontSize: '64px'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '16px'
  },
  message: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '24px',
    lineHeight: '1.5'
  },
  details: {
    textAlign: 'left',
    marginBottom: '24px',
    backgroundColor: '#f9f9f9',
    padding: '16px',
    borderRadius: '4px',
    border: '1px solid #e0e0e0'
  },
  summary: {
    cursor: 'pointer',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#666'
  },
  errorText: {
    fontSize: '12px',
    color: '#d32f2f',
    overflow: 'auto',
    maxHeight: '200px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  buttonContainer: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  button: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '500',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: '#007bff',
    color: 'white',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#0056b3'
    }
  },
  secondaryButton: {
    backgroundColor: '#6c757d'
  },
  persistentError: {
    marginTop: '20px',
    padding: '12px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '4px',
    color: '#856404',
    fontSize: '14px'
  }
};

export default ErrorBoundary;
