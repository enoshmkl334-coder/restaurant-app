// Rate limit error handling utilities

/**
 * Check if error is a rate limit error
 */
export const isRateLimitError = (error) => {
  if (!error) return false;
  
  // Check for 429 status code
  if (error.status === 429 || error.statusCode === 429) {
    return true;
  }
  
  // Check error message
  const message = error.message?.toLowerCase() || '';
  return message.includes('too many') || 
         message.includes('rate limit') || 
         message.includes('try again later');
};

/**
 * Extract retry-after time from error
 */
export const getRetryAfter = (error) => {
  // Try to get from error response
  if (error.retryAfter) {
    return error.retryAfter;
  }
  
  // Default retry times based on error message
  const message = error.message?.toLowerCase() || '';
  
  if (message.includes('15 minutes')) return 15 * 60;
  if (message.includes('hour')) return 60 * 60;
  if (message.includes('few minutes')) return 5 * 60;
  
  // Default to 1 minute
  return 60;
};

/**
 * Format retry time for display
 */
export const formatRetryTime = (seconds) => {
  if (seconds < 60) {
    return `${seconds} seconds`;
  }
  
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
  
  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours > 1 ? 's' : ''}`;
};

/**
 * Get user-friendly rate limit message
 */
export const getRateLimitMessage = (error) => {
  const retryAfter = getRetryAfter(error);
  const timeString = formatRetryTime(retryAfter);
  
  const message = error.message || '';
  
  if (message.includes('login')) {
    return `Too many login attempts. Please try again in ${timeString}.`;
  }
  
  if (message.includes('registration') || message.includes('accounts')) {
    return `Too many registration attempts. Please try again in ${timeString}.`;
  }
  
  if (message.includes('order')) {
    return `Too many orders placed. Please wait ${timeString} before placing another order.`;
  }
  
  if (message.includes('upload')) {
    return `Too many file uploads. Please wait ${timeString} before uploading more.`;
  }
  
  if (message.includes('menu')) {
    return `Too many menu changes. Please wait ${timeString} before making more changes.`;
  }
  
  // Generic message
  return `Too many requests. Please try again in ${timeString}.`;
};

/**
 * Store rate limit state in localStorage
 */
export const storeRateLimitState = (endpoint, retryAfter) => {
  const resetTime = Date.now() + (retryAfter * 1000);
  localStorage.setItem(`rateLimit_${endpoint}`, resetTime.toString());
};

/**
 * Check if endpoint is currently rate limited
 */
export const isEndpointRateLimited = (endpoint) => {
  const resetTime = localStorage.getItem(`rateLimit_${endpoint}`);
  if (!resetTime) return false;
  
  const now = Date.now();
  const reset = parseInt(resetTime);
  
  if (now < reset) {
    return true;
  }
  
  // Clean up expired rate limit
  localStorage.removeItem(`rateLimit_${endpoint}`);
  return false;
};

/**
 * Get remaining time for rate limited endpoint
 */
export const getRemainingTime = (endpoint) => {
  const resetTime = localStorage.getItem(`rateLimit_${endpoint}`);
  if (!resetTime) return 0;
  
  const now = Date.now();
  const reset = parseInt(resetTime);
  const remaining = Math.max(0, Math.ceil((reset - now) / 1000));
  
  return remaining;
};

/**
 * Clear rate limit state for endpoint
 */
export const clearRateLimitState = (endpoint) => {
  localStorage.removeItem(`rateLimit_${endpoint}`);
};

/**
 * Handle rate limit error in API call
 */
export const handleRateLimitError = (error, endpoint) => {
  if (!isRateLimitError(error)) {
    return false;
  }
  
  const retryAfter = getRetryAfter(error);
  storeRateLimitState(endpoint, retryAfter);
  
  return {
    isRateLimited: true,
    message: getRateLimitMessage(error),
    retryAfter,
    formattedTime: formatRetryTime(retryAfter)
  };
};

/**
 * React hook for rate limit countdown
 */
export const useRateLimitCountdown = (endpoint) => {
  const [remaining, setRemaining] = React.useState(0);
  const [isLimited, setIsLimited] = React.useState(false);

  React.useEffect(() => {
    const checkRateLimit = () => {
      if (isEndpointRateLimited(endpoint)) {
        const time = getRemainingTime(endpoint);
        setRemaining(time);
        setIsLimited(time > 0);
      } else {
        setRemaining(0);
        setIsLimited(false);
      }
    };

    checkRateLimit();
    const interval = setInterval(checkRateLimit, 1000);

    return () => clearInterval(interval);
  }, [endpoint]);

  return {
    isLimited,
    remaining,
    formattedTime: formatRetryTime(remaining)
  };
};

// Export React for the hook
import React from 'react';
