import { useState, useCallback } from 'react';

/**
 * Custom hook for handling async errors
 * Provides error state management and error handling utilities
 */
export function useErrorHandler() {
  const [error, setError] = useState(null);
  const [isError, setIsError] = useState(false);

  /**
   * Handle error
   */
  const handleError = useCallback((error) => {
    console.error('Error caught by useErrorHandler:', error);
    setError(error);
    setIsError(true);
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
    setIsError(false);
  }, []);

  /**
   * Wrap async function with error handling
   */
  const wrapAsync = useCallback((asyncFn) => {
    return async (...args) => {
      try {
        clearError();
        return await asyncFn(...args);
      } catch (error) {
        handleError(error);
        throw error; // Re-throw so caller can handle if needed
      }
    };
  }, [handleError, clearError]);

  return {
    error,
    isError,
    handleError,
    clearError,
    wrapAsync
  };
}

/**
 * Custom hook for safe async operations
 * Automatically handles errors and loading states
 */
export function useSafeAsync() {
  const [loading, setLoading] = useState(false);
  const { error, isError, handleError, clearError } = useErrorHandler();

  /**
   * Execute async function safely
   */
  const execute = useCallback(async (asyncFn, ...args) => {
    try {
      setLoading(true);
      clearError();
      const result = await asyncFn(...args);
      return result;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError]);

  return {
    loading,
    error,
    isError,
    execute,
    clearError
  };
}

export default useErrorHandler;
