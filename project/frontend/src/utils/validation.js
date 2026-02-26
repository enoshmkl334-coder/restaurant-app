// Frontend validation utilities

export const validators = {
  // Username validation
  username: (value) => {
    if (!value || value.trim().length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (value.length > 50) {
      return 'Username must be less than 50 characters';
    }
    if (!/^[a-zA-Z0-9@._-]+$/.test(value)) {
      return 'Username can only contain letters, numbers, @, ., _, -';
    }
    return null;
  },

  // Password validation
  password: (value) => {
    if (!value || value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (value.length > 100) {
      return 'Password must be less than 100 characters';
    }
    if (!/(?=.*[a-z])/.test(value)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(value)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(value)) {
      return 'Password must contain at least one number';
    }
    return null;
  },

  // Email validation
  email: (value) => {
    if (!value) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  // Menu item name validation
  menuItemName: (value) => {
    if (!value || value.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (value.length > 100) {
      return 'Name must be less than 100 characters';
    }
    if (!/^[a-zA-Z0-9\s\-()&',]+$/.test(value)) {
      return 'Name contains invalid characters';
    }
    return null;
  },

  // Description validation
  description: (value) => {
    if (!value || value.trim().length < 5) {
      return 'Description must be at least 5 characters';
    }
    if (value.length > 500) {
      return 'Description must be less than 500 characters';
    }
    return null;
  },

  // Price validation
  price: (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      return 'Price must be a number';
    }
    if (num < 0) {
      return 'Price must be positive';
    }
    if (num > 999999) {
      return 'Price is too high';
    }
    return null;
  },

  // Quantity validation
  quantity: (value) => {
    const num = parseInt(value);
    if (isNaN(num)) {
      return 'Quantity must be a number';
    }
    if (num < 1) {
      return 'Quantity must be at least 1';
    }
    if (num > 100) {
      return 'Quantity cannot exceed 100';
    }
    return null;
  },

  // Category validation
  category: (value) => {
    const validCategories = ['appetizer', 'main', 'dessert', 'beverage', 'special'];
    if (!validCategories.includes(value)) {
      return 'Invalid category';
    }
    return null;
  },

  // Discount validation
  discount: (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      return 'Discount must be a number';
    }
    if (num < 0 || num > 100) {
      return 'Discount must be between 0 and 100';
    }
    return null;
  }
};

// Validate entire form
export const validateForm = (fields, rules) => {
  const errors = {};
  
  for (const [fieldName, value] of Object.entries(fields)) {
    if (rules[fieldName]) {
      const error = rules[fieldName](value);
      if (error) {
        errors[fieldName] = error;
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Sanitize input to prevent XSS
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

// Real-time validation hook for React
export const useFormValidation = (initialState, validationRules) => {
  const [values, setValues] = React.useState(initialState);
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});

  const handleChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Validate on change if field was touched
    if (touched[name] && validationRules[name]) {
      const error = validationRules[name](value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate on blur
    if (validationRules[name]) {
      const error = validationRules[name](values[name]);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const validateAll = () => {
    const newErrors = {};
    for (const [name, rule] of Object.entries(validationRules)) {
      const error = rule(values[name]);
      if (error) {
        newErrors[name] = error;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    setValues
  };
};
