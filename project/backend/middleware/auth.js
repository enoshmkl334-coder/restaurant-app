const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Generate JWT token
function generateToken(userId, role, restaurantId = null) {
  return jwt.sign(
    { 
      userId, 
      role,
      restaurantId 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Verify JWT token middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    
    req.user = user; // Attach user info to request
    next();
  });
}

// Check if user has required role
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
}

// Check if user owns the restaurant (for owner/admin operations)
function requireRestaurantAccess(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }

  const requestedRestaurantId = req.body.restaurant_id || 
                                 req.query.restaurantId || 
                                 req.params.restaurantId;

  // Admin can access all restaurants
  if (req.user.role === 'admin') {
    return next();
  }

  // Owner can only access their own restaurant
  if (req.user.role === 'owner' && req.user.restaurantId) {
    if (requestedRestaurantId && Number(requestedRestaurantId) !== Number(req.user.restaurantId)) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only access your own restaurant data' 
      });
    }
    return next();
  }

  return res.status(403).json({ 
    success: false, 
    message: 'Insufficient permissions' 
  });
}

module.exports = {
  generateToken,
  authenticateToken,
  requireRole,
  requireRestaurantAccess
};
