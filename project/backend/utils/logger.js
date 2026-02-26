/**
 * Centralized logging utility
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
  SUCCESS: 'SUCCESS'
};

const LOG_COLORS = {
  ERROR: '❌',
  WARN: '⚠️',
  INFO: 'ℹ️',
  DEBUG: '🔍',
  SUCCESS: '✅'
};

/**
 * Format log message with timestamp
 */
function formatMessage(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const icon = LOG_COLORS[level] || '';
  const prefix = `[${timestamp}] ${icon} ${level}:`;
  
  if (data) {
    return `${prefix} ${message}`;
  }
  return `${prefix} ${message}`;
}

/**
 * Log error message
 */
function error(message, error = null) {
  const formatted = formatMessage(LOG_LEVELS.ERROR, message);
  if (error) {
    console.error(formatted, error);
  } else {
    console.error(formatted);
  }
}

/**
 * Log warning message
 */
function warn(message, data = null) {
  const formatted = formatMessage(LOG_LEVELS.WARN, message);
  if (data) {
    console.warn(formatted, data);
  } else {
    console.warn(formatted);
  }
}

/**
 * Log info message
 */
function info(message, data = null) {
  const formatted = formatMessage(LOG_LEVELS.INFO, message);
  if (data) {
    console.log(formatted, data);
  } else {
    console.log(formatted);
  }
}

/**
 * Log debug message (only in development)
 */
function debug(message, data = null) {
  if (process.env.NODE_ENV !== 'production') {
    const formatted = formatMessage(LOG_LEVELS.DEBUG, message);
    if (data) {
      console.log(formatted, data);
    } else {
      console.log(formatted);
    }
  }
}

/**
 * Log success message
 */
function success(message, data = null) {
  const formatted = formatMessage(LOG_LEVELS.SUCCESS, message);
  if (data) {
    console.log(formatted, data);
  } else {
    console.log(formatted);
  }
}

/**
 * Log database operation
 */
function database(operation, details = null) {
  info(`Database: ${operation}`, details);
}

/**
 * Log authentication event
 */
function auth(event, userId = null, details = null) {
  const message = userId ? `Auth: ${event} (User: ${userId})` : `Auth: ${event}`;
  info(message, details);
}

/**
 * Log API request
 */
function request(method, path, userId = null) {
  const user = userId ? ` [User: ${userId}]` : '';
  debug(`${method} ${path}${user}`);
}

/**
 * Log security event
 */
function security(event, details = null) {
  warn(`Security: ${event}`, details);
}

module.exports = {
  error,
  warn,
  info,
  debug,
  success,
  database,
  auth,
  request,
  security,
  LOG_LEVELS
};
