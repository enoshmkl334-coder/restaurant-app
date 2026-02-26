import React from 'react';

/**
 * Reusable error display component
 * Shows error messages in a consistent format
 */
function ErrorDisplay({ error, onRetry, onDismiss }) {
  if (!error) return null;

  const errorMessage = error?.message || 'An unexpected error occurred';

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <span style={styles.icon}>⚠️</span>
        <div style={styles.textContainer}>
          <strong style={styles.title}>Error</strong>
          <p style={styles.message}>{errorMessage}</p>
        </div>
      </div>
      
      <div style={styles.actions}>
        {onRetry && (
          <button onClick={onRetry} style={styles.button}>
            Try Again
          </button>
        )}
        {onDismiss && (
          <button 
            onClick={onDismiss} 
            style={{...styles.button, ...styles.dismissButton}}
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '4px',
    padding: '16px',
    marginBottom: '16px'
  },
  content: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '12px'
  },
  icon: {
    fontSize: '24px',
    marginRight: '12px'
  },
  textContainer: {
    flex: 1
  },
  title: {
    display: 'block',
    color: '#856404',
    marginBottom: '4px',
    fontSize: '14px'
  },
  message: {
    color: '#856404',
    margin: 0,
    fontSize: '14px'
  },
  actions: {
    display: 'flex',
    gap: '8px'
  },
  button: {
    padding: '6px 12px',
    fontSize: '14px',
    borderRadius: '4px',
    border: '1px solid #ffc107',
    backgroundColor: 'white',
    color: '#856404',
    cursor: 'pointer',
    fontWeight: '500'
  },
  dismissButton: {
    backgroundColor: 'transparent',
    border: 'none'
  }
};

export default ErrorDisplay;
