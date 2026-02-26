/**
 * Response helper utilities to standardize API responses
 */

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {Object} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
function sendSuccess(res, data = {}, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data
  });
}

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {Object} additionalData - Additional error data
 */
function sendError(res, message = 'An error occurred', statusCode = 500, additionalData = {}) {
  return res.status(statusCode).json({
    success: false,
    message,
    ...additionalData
  });
}

/**
 * Send database error response
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 * @param {string} context - Context where error occurred
 */
function sendDatabaseError(res, error, context = 'Database operation') {
  console.error(`${context} error:`, error);
  return sendError(res, 'Database error', 500);
}

/**
 * Send validation error response
 * @param {Object} res - Express response object
 * @param {string} message - Validation error message
 * @param {Array} errors - Array of validation errors
 */
function sendValidationError(res, message = 'Validation failed', errors = []) {
  return res.status(400).json({
    success: false,
    message,
    errors
  });
}

/**
 * Send not found error response
 * @param {Object} res - Express response object
 * @param {string} resource - Resource that was not found
 */
function sendNotFound(res, resource = 'Resource') {
  return sendError(res, `${resource} not found`, 404);
}

/**
 * Send unauthorized error response
 * @param {Object} res - Express response object
 * @param {string} message - Unauthorized message
 */
function sendUnauthorized(res, message = 'Unauthorized') {
  return sendError(res, message, 401);
}

/**
 * Send forbidden error response
 * @param {Object} res - Express response object
 * @param {string} message - Forbidden message
 */
function sendForbidden(res, message = 'Forbidden') {
  return sendError(res, message, 403);
}

/**
 * Handle async route errors
 * @param {Function} fn - Async route handler
 * @returns {Function} Express middleware
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorHandler(err, req, res, next) {
  console.error('Unhandled error:', err);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return sendValidationError(res, err.message, err.errors);
  }

  if (err.name === 'UnauthorizedError') {
    return sendUnauthorized(res, err.message);
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return sendError(res, 'Duplicate entry', 409);
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return sendError(res, 'Referenced record not found', 400);
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  return sendError(res, message, statusCode);
}

module.exports = {
  sendSuccess,
  sendError,
  sendDatabaseError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  asyncHandler,
  errorHandler
};
