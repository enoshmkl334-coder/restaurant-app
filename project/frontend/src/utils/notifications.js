/**
 * Notification utility for user feedback
 * Can be replaced with a toast library like react-toastify later
 */

/**
 * Show success notification
 * @param {string} message - Success message
 */
export function showSuccess(message) {
  // For now using alert, can be replaced with toast library
  alert(`✅ ${message}`);
}

/**
 * Show error notification
 * @param {string} message - Error message
 */
export function showError(message) {
  alert(`❌ ${message}`);
}

/**
 * Show warning notification
 * @param {string} message - Warning message
 */
export function showWarning(message) {
  alert(`⚠️ ${message}`);
}

/**
 * Show info notification
 * @param {string} message - Info message
 */
export function showInfo(message) {
  alert(`ℹ️ ${message}`);
}

/**
 * Show confirmation dialog
 * @param {string} message - Confirmation message
 * @returns {boolean} User's choice
 */
export function showConfirm(message) {
  return window.confirm(message);
}

/**
 * Show loading notification (for future implementation)
 * @param {string} message - Loading message
 */
export function showLoading(message) {
  console.log(`⏳ ${message}`);
}

/**
 * Hide loading notification (for future implementation)
 */
export function hideLoading() {
  // Placeholder for future implementation
}

// Export all as default for convenience
export default {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  confirm: showConfirm,
  loading: showLoading,
  hideLoading
};
