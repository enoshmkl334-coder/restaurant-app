const { body, param, query, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// ========== AUTH VALIDATORS ==========

const validateLogin = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters')
    .matches(/^[a-zA-Z0-9@._-]+$/).withMessage('Username contains invalid characters'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6, max: 100 }).withMessage('Password must be 6-100 characters'),
  
  handleValidationErrors
];

const validateRegister = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters')
    .matches(/^[a-zA-Z0-9@._-]+$/).withMessage('Username can only contain letters, numbers, @, ., _, -')
    .custom(value => {
      // Prevent SQL injection patterns
      const sqlPatterns = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i;
      if (sqlPatterns.test(value)) {
        throw new Error('Invalid username format');
      }
      return true;
    }),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8, max: 100 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
  
  body('restaurantId')
    .optional()
    .isInt({ min: 1 }).withMessage('Invalid restaurant ID')
    .toInt(),
  
  handleValidationErrors
];

const validateGoogleAuth = [
  body('token')
    .notEmpty().withMessage('Google token is required')
    .isString().withMessage('Token must be a string')
    .isLength({ min: 10, max: 5000 }).withMessage('Invalid token format'),
  
  handleValidationErrors
];

// ========== MENU ITEM VALIDATORS ==========

const validateMenuItemCreate = [
  body('name')
    .trim()
    .notEmpty().withMessage('Menu item name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
    .matches(/^[a-zA-Z0-9\s\-()&',]+$/).withMessage('Name contains invalid characters'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 5, max: 500 }).withMessage('Description must be 5-500 characters'),
  
  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0, max: 999999 }).withMessage('Price must be a positive number')
    .toFloat(),
  
  body('category')
    .trim()
    .notEmpty().withMessage('Category is required')
    .isIn(['appetizer', 'main', 'dessert', 'beverage', 'special']).withMessage('Invalid category'),
  
  body('available')
    .optional()
    .isBoolean().withMessage('Available must be true or false')
    .toBoolean(),
  
  body('discount')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Discount must be 0-100')
    .toFloat(),
  
  body('image_url')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Image URL too long')
    .matches(/^(https?:\/\/|\/uploads\/)/).withMessage('Invalid image URL format'),
  
  body('options')
    .optional()
    .custom((value) => {
      if (value === null) return true;
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
          return true;
        } catch {
          throw new Error('Options must be valid JSON');
        }
      }
      if (Array.isArray(value)) return true;
      throw new Error('Options must be an array or JSON string');
    }),
  
  body('restaurant_id')
    .notEmpty().withMessage('Restaurant ID is required')
    .isInt({ min: 1 }).withMessage('Invalid restaurant ID')
    .toInt(),
  
  handleValidationErrors
];

const validateMenuItemUpdate = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid menu item ID')
    .toInt(),
  
  ...validateMenuItemCreate
];

const validateMenuItemDelete = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid menu item ID')
    .toInt(),
  
  handleValidationErrors
];

// ========== ORDER VALIDATORS ==========

const validateOrderCreate = [
  body('userId')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('Invalid user ID')
    .toInt(),
  
  body('items')
    .isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  
  body('items.*.name')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Item name too long'),
  
  body('items.*.price')
    .isFloat({ min: 0 }).withMessage('Item price must be positive')
    .toFloat(),
  
  body('items.*.quantity')
    .isInt({ min: 1, max: 100 }).withMessage('Quantity must be 1-100')
    .toInt(),
  
  body('items.*.menuItemId')
    .optional()
    .isInt({ min: 1 }).withMessage('Invalid menu item ID')
    .toInt(),
  
  body('totalAmount')
    .isFloat({ min: 0 }).withMessage('Total amount must be positive')
    .toFloat()
    .custom((value, { req }) => {
      // Verify total matches sum of items
      const calculatedTotal = req.body.items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);
      
      // Allow small floating point differences
      if (Math.abs(calculatedTotal - value) > 0.01) {
        throw new Error('Total amount does not match items');
      }
      return true;
    }),
  
  handleValidationErrors
];

const validateOrderId = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid order ID')
    .toInt(),
  
  handleValidationErrors
];

// ========== IMAGE UPLOAD VALIDATORS ==========

const validateImageUpload = [
  body('imageBase64')
    .notEmpty().withMessage('Image data is required')
    .matches(/^data:image\/(jpeg|jpg|png|gif|webp);base64,/).withMessage('Invalid image format')
    .isLength({ max: 6000000 }).withMessage('Image too large (max 4MB)'),
  
  body('filename')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Filename too long')
    .matches(/^[a-zA-Z0-9_.-]+$/).withMessage('Invalid filename characters'),
  
  handleValidationErrors
];

// ========== QUERY VALIDATORS ==========

const validateRestaurantQuery = [
  query('restaurantId')
    .optional()
    .isInt({ min: 1 }).withMessage('Invalid restaurant ID')
    .toInt(),
  
  handleValidationErrors
];

const validateCategoryParam = [
  param('category')
    .trim()
    .notEmpty().withMessage('Category is required')
    .isIn(['appetizer', 'main', 'dessert', 'beverage', 'special']).withMessage('Invalid category'),
  
  handleValidationErrors
];

// ========== SANITIZATION HELPERS ==========

// Remove potential XSS and SQL injection patterns
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

module.exports = {
  // Auth validators
  validateLogin,
  validateRegister,
  validateGoogleAuth,
  
  // Menu validators
  validateMenuItemCreate,
  validateMenuItemUpdate,
  validateMenuItemDelete,
  
  // Order validators
  validateOrderCreate,
  validateOrderId,
  
  // Image validators
  validateImageUpload,
  
  // Query validators
  validateRestaurantQuery,
  validateCategoryParam,
  
  // Utilities
  handleValidationErrors,
  sanitizeInput
};
