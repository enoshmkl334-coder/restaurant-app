// load environment variables from .env file (install dotenv if needed)
require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const db = require("./db");
const dbHelpers = require("./utils/dbHelpers");
const { verifyGoogleToken } = require("./googleAuth"); // google token verifier
const { 
  generateToken, 
  authenticateToken, 
  requireRole, 
  requireRestaurantAccess 
} = require("./middleware/auth");
const {
  validateLogin,
  validateRegister,
  validateGoogleAuth,
  validateMenuItemCreate,
  validateMenuItemUpdate,
  validateMenuItemDelete,
  validateOrderCreate,
  validateOrderId,
  validateImageUpload,
  validateRestaurantQuery,
  validateCategoryParam
} = require("./middleware/validators");
const {
  authLimiter,
  registerLimiter,
  apiLimiter,
  orderLimiter,
  menuModifyLimiter,
  uploadLimiter,
  readLimiter,
  kitchenLimiter,
  configureTrustProxy
} = require("./middleware/rateLimiter");

const app = express();

// Configure trust proxy for rate limiting (important if behind nginx/load balancer)
configureTrustProxy(app);

// Allow a dev CORS origin (Vite usually on 5173) or use env var (comma-separated list supported)
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
const ALLOWED_ORIGINS = CORS_ORIGIN.split(",").map((s) => s.trim());

// ========== ADD CORS SUPPORT ==========
const isLocalhostOrigin = (origin) => {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    return (
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "::1"
    );
  } catch (e) {
    return false;
  }
};

app.use((req, res, next) => {
  const origin = req.headers.origin;
  let allowedOrigin;

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    allowedOrigin = origin;
  } else if (isLocalhostOrigin(origin)) {
    allowedOrigin = origin;
    console.log(`✅ CORS: allowing localhost origin ${origin}`);
  } else if (ALLOWED_ORIGINS.includes("*")) {
    allowedOrigin = "*";
  } else {
    // fallback to first allowed origin (useful for dev)
    allowedOrigin = ALLOWED_ORIGINS[0] || "*";
    if (origin && origin !== allowedOrigin) {
      console.warn(
        `⚠️ CORS: request origin ${origin} not in ALLOWED_ORIGINS, using fallback ${allowedOrigin}`,
      );
    }
  }

  res.header("Access-Control-Allow-Origin", allowedOrigin);
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  // Only send credentials header when not using wildcard origin
  if (allowedOrigin !== "*") {
    res.header("Access-Control-Allow-Credentials", "true");
  }

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
// ========== END CORS ==========
const PORT = 80;

// Apply general API rate limiter to all /api routes
app.use('/api/', apiLimiter);

app.use(express.urlencoded({ extended: true }));
// Allow larger payloads for image uploads (dev only) — increased to handle base64 overhead
app.use(express.json({ limit: "12mb" }));

// Ensure uploads folder exists and serve uploads
const uploadsDir = path.join(__dirname, "public", "uploads");
try {
  fs.mkdirSync(uploadsDir, { recursive: true });
} catch (e) {
  console.error("Failed to create uploads dir:", e);
}
app.use("/uploads", express.static(uploadsDir));

// ---------- GOOGLE AUTH ROUTE ----------
app.post("/api/auth/google", authLimiter, validateGoogleAuth, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).send({ 
        success: false, 
        message: "No token provided" 
      });
    }

    // Verify Google token
    const ticket = await verifyGoogleToken(token);
    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const email = payload.email ? payload.email.toLowerCase() : null;
    const name = payload.name || email; // Get user's full name from Google

    // Look for existing user
    let user = await dbHelpers.getUserByGoogleId(googleId, email);

    if (user) {
      // Update Google credentials if not set
      if (!user.google_id) {
        await dbHelpers.updateUserGoogleCredentials(user.id, googleId, email);
      }
      
      // Ensure permission exists (keep existing role)
      await dbHelpers.ensureUserPermission(user.id, user.permission || 'guest');
    } else {
      // Determine role based on email (you can customize this)
      let role = 'guest'; // Default role
      
      // OPTIONAL: Auto-assign roles based on email
      // Uncomment and customize these if you want automatic role assignment
      /*
      if (email === 'admin@himalayan-feast.com') {
        role = 'admin';
      } else if (email === 'owner@himalayan-feast.com' || email === 'owner2@himalayan-feast.com') {
        role = 'owner';
      } else if (email && email.includes('kitchen@')) {
        role = 'kitchen';
      }
      */
      
      // Create new user
      const userId = await dbHelpers.createUser({
        username: name, // Use Google name instead of email
        password: null,
        googleId,
        googleEmail: email,
        isGoogleUser: true,
        restaurantId: null
      });

      // Create permission with determined role
      await dbHelpers.ensureUserPermission(userId, role);

      // Fetch the new user
      user = await dbHelpers.getUserByGoogleId(googleId, email);
    }

    // Generate token
    const jwtToken = generateToken(
      user.id, 
      user.permission || "guest", 
      user.restaurant_id
    );

    // Get restaurant name if exists
    let restaurantName = null;
    if (user.restaurant_id) {
      const restaurant = await dbHelpers.getRestaurantById(user.restaurant_id);
      restaurantName = restaurant?.restaurant || null;
    }

    return res.send({
      success: true,
      message: "Login successful",
      role: user.permission || "guest",
      userId: user.id,
      username: user.username || name, // Send username in response
      restaurantId: user.restaurant_id || null,
      restaurantName,
      token: jwtToken,
    });
  } catch (error) {
    console.error("Google auth error:", error);
    return res.send({ success: false, message: "Server error" });
  }
});

// ---------- LOGIN ROUTE ----------
app.post("/api/login", authLimiter, validateLogin, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Get user with permission
    const user = await dbHelpers.getUserByUsername(username);

    if (!user) {
      return res.send({ success: false, message: "Login failed" });
    }

    // Check password
    const storedPassword = user.password.trim();
    const isHashed = storedPassword.startsWith("$2a$") ||
                     storedPassword.startsWith("$2b$") ||
                     storedPassword.startsWith("$2y$");

    const passwordMatch = isHashed
      ? await bcrypt.compare(password, storedPassword)
      : password === storedPassword;

    if (!passwordMatch || Number(user.isActive) !== 1) {
      return res.send({ success: false, message: "Login failed" });
    }

    // Get role
    const role = user.permission?.trim().toLowerCase() || "guest";

    // Get restaurant ID
    let restaurantId = user.restaurant_id;
    if (!restaurantId) {
      const userRestaurant = await dbHelpers.queryOne(
        "SELECT restaurantId FROM user_restaurant WHERE userId = ? ORDER BY id DESC LIMIT 1",
        [user.id]
      );
      restaurantId = userRestaurant?.restaurantId || null;
    }

    // Generate JWT token
    const token = generateToken(user.id, role, restaurantId);

    console.log("✅ Login success for user:", {
      id: user.id,
      username: username,
      role: role,
      restaurantId,
    });

    // Get restaurant name if exists
    let restaurantName = null;
    if (restaurantId) {
      const restaurant = await dbHelpers.getRestaurantById(restaurantId);
      restaurantName = restaurant?.restaurant || null;
    }

    return res.send({
      success: true,
      message: "Login successful",
      role,
      userId: user.id,
      restaurantId,
      restaurantName,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.send({ success: false, message: "Server error" });
  }
});

// ---------- REGISTER ROUTE ----------
app.post("/api/register", registerLimiter, validateRegister, async (req, res) => {
  try {
    const { username, password, restaurantId } = req.body;

    // Check if username exists
    const existingUser = await dbHelpers.queryOne(
      "SELECT id FROM user WHERE LOWER(username) = LOWER(?)",
      [username]
    );

    if (existingUser) {
      return res.send({ 
        success: false, 
        message: "Username already exists" 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = await dbHelpers.createUser({
      username,
      password: hashedPassword,
      googleId: null,
      googleEmail: null,
      isGoogleUser: false,
      restaurantId: restaurantId || null
    });

    // If restaurant ID provided but user creation didn't set it, try fallback table
    if (restaurantId && !restaurantId) {
      try {
        await dbHelpers.query(
          "INSERT INTO user_restaurant (userId, restaurantId) VALUES (?, ?)",
          [userId, restaurantId]
        );
      } catch (err) {
        console.warn("Unable to insert into user_restaurant:", err.message);
      }
    }

    // Create default permission
    await dbHelpers.ensureUserPermission(userId, 'guest');

    return res.send({
      success: true,
      message: "Account created successfully",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.send({ 
      success: false, 
      message: "Database error" 
    });
  }
});

// ---------- SELECT RESTAURANT ROUTE (for Google OAuth users) ----------
app.post("/api/user/select-restaurant", apiLimiter, async (req, res) => {
  try {
    const { userId, restaurantId } = req.body;

    if (!userId || !restaurantId) {
      return res.status(400).send({
        success: false,
        message: "User ID and Restaurant ID are required"
      });
    }

    // Update user's restaurant
    await dbHelpers.query(
      "UPDATE user SET restaurant_id = ? WHERE id = ?",
      [restaurantId, userId]
    );

    // Get restaurant name
    const restaurant = await dbHelpers.getRestaurantById(restaurantId);

    return res.send({
      success: true,
      message: "Restaurant selected successfully",
      restaurantId,
      restaurantName: restaurant?.restaurant || null
    });
  } catch (error) {
    console.error("Select restaurant error:", error);
    return res.status(500).send({
      success: false,
      message: "Server error"
    });
  }
});

// ---------- ADMIN USER MANAGEMENT ROUTES ----------

// Get all users (admin only)
app.get("/api/admin/users", authenticateToken, requireRole('admin'), readLimiter, async (req, res) => {
  try {
    // Get the logged-in user's restaurant ID from the JWT token
    const adminRestaurantId = req.user.restaurantId;
    
    // If admin has no restaurant, show all users (super admin)
    // If admin has a restaurant, only show users from that restaurant
    let query = `
      SELECT 
        u.id,
        u.username,
        u.google_email,
        u.google_id,
        u.isActive,
        u.lastLogin,
        u.restaurant_id
      FROM user u
    `;
    
    let params = [];
    
    // Filter by restaurant if admin belongs to a specific restaurant
    if (adminRestaurantId) {
      query += ` WHERE u.restaurant_id = ?`;
      params.push(adminRestaurantId);
    }
    
    query += ` ORDER BY u.id DESC`;
    
    const users = await dbHelpers.query(query, params);

    // Then get permissions separately
    for (const user of users) {
      try {
        const permission = await dbHelpers.queryOne(
          "SELECT permission FROM permission_for_user WHERE userId = ?",
          [user.id]
        );
        user.permission = permission?.permission || 'guest';
      } catch (err) {
        user.permission = 'guest';
      }
      
      // Get restaurant name if exists
      if (user.restaurant_id) {
        try {
          const restaurant = await dbHelpers.getRestaurantById(user.restaurant_id);
          user.restaurant = restaurant?.restaurant || null;
        } catch (err) {
          user.restaurant = null;
        }
      } else {
        user.restaurant = null;
      }
    }

    return res.send({
      success: true,
      users,
      adminRestaurantId // Send this so frontend knows which restaurant admin is viewing
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).send({
      success: false,
      message: "Server error: " + error.message
    });
  }
});

// Update user role (admin only)
app.put("/api/admin/users/role", authenticateToken, requireRole('admin'), apiLimiter, async (req, res) => {
  try {
    const { userId, role } = req.body;
    const adminRestaurantId = req.user.restaurantId;

    if (!userId || !role) {
      return res.status(400).send({
        success: false,
        message: "User ID and role are required"
      });
    }

    // Validate role
    const validRoles = ['guest', 'owner', 'admin', 'kitchen'];
    if (!validRoles.includes(role)) {
      return res.status(400).send({
        success: false,
        message: "Invalid role"
      });
    }

    // Check if user belongs to admin's restaurant
    if (adminRestaurantId) {
      const user = await dbHelpers.queryOne(
        "SELECT restaurant_id FROM user WHERE id = ?",
        [userId]
      );
      
      if (!user || user.restaurant_id !== adminRestaurantId) {
        return res.status(403).send({
          success: false,
          message: "You can only manage users from your restaurant"
        });
      }
    }

    // Update or insert permission
    await dbHelpers.query(`
      INSERT INTO permission_for_user (userId, permission)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE permission = ?
    `, [userId, role, role]);

    return res.send({
      success: true,
      message: "Role updated successfully"
    });
  } catch (error) {
    console.error("Error updating role:", error);
    return res.status(500).send({
      success: false,
      message: "Server error"
    });
  }
});

// Update user status (admin only)
app.put("/api/admin/users/status", authenticateToken, requireRole('admin'), apiLimiter, async (req, res) => {
  try {
    const { userId, isActive } = req.body;
    const adminRestaurantId = req.user.restaurantId;

    if (!userId || isActive === undefined) {
      return res.status(400).send({
        success: false,
        message: "User ID and status are required"
      });
    }

    // Check if user belongs to admin's restaurant
    if (adminRestaurantId) {
      const user = await dbHelpers.queryOne(
        "SELECT restaurant_id FROM user WHERE id = ?",
        [userId]
      );
      
      if (!user || user.restaurant_id !== adminRestaurantId) {
        return res.status(403).send({
          success: false,
          message: "You can only manage users from your restaurant"
        });
      }
    }

    await dbHelpers.query(
      "UPDATE user SET isActive = ? WHERE id = ?",
      [isActive, userId]
    );

    return res.send({
      success: true,
      message: "Status updated successfully"
    });
  } catch (error) {
    console.error("Error updating status:", error);
    return res.status(500).send({
      success: false,
      message: "Server error"
    });
  }
});

// Bulk update user roles (admin only)
app.put("/api/admin/users/bulk-role", authenticateToken, requireRole('admin'), apiLimiter, async (req, res) => {
  try {
    const { userIds, role } = req.body;
    const adminRestaurantId = req.user.restaurantId;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !role) {
      return res.status(400).send({
        success: false,
        message: "User IDs array and role are required"
      });
    }

    // Validate role
    const validRoles = ['guest', 'owner', 'admin', 'kitchen'];
    if (!validRoles.includes(role)) {
      return res.status(400).send({
        success: false,
        message: "Invalid role"
      });
    }

    // Check if all users belong to admin's restaurant
    if (adminRestaurantId) {
      for (const userId of userIds) {
        const user = await dbHelpers.queryOne(
          "SELECT restaurant_id FROM user WHERE id = ?",
          [userId]
        );
        
        if (!user || user.restaurant_id !== adminRestaurantId) {
          return res.status(403).send({
            success: false,
            message: "You can only manage users from your restaurant"
          });
        }
      }
    }

    // Update all users
    for (const userId of userIds) {
      await dbHelpers.query(`
        INSERT INTO permission_for_user (userId, permission)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE permission = ?
      `, [userId, role, role]);
    }

    return res.send({
      success: true,
      message: `Updated ${userIds.length} users successfully`
    });
  } catch (error) {
    console.error("Error bulk updating roles:", error);
    return res.status(500).send({
      success: false,
      message: "Server error"
    });
  }
});

// ========== ADMIN ORDER MANAGEMENT ENDPOINTS ==========

// Get all orders with customer info (admin only)
app.get("/api/admin/orders", authenticateToken, requireRole('admin', 'owner'), readLimiter, async (req, res) => {
  try {
    const ordersSql = `
      SELECT 
        o.id,
        o.created_at,
        o.status,
        o.total_price,
        o.customer_id,
        u.username as customer_name,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN user u ON o.customer_id = u.customer_id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id, o.created_at, o.status, o.total_price, o.customer_id, u.username
      ORDER BY o.created_at DESC
      LIMIT 500
    `;

    const orders = await dbHelpers.query(ordersSql);
    
    res.json({
      success: true,
      orders: orders
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders"
    });
  }
});

// Get order details with items (admin only)
app.get("/api/admin/orders/:id/details", authenticateToken, requireRole('admin', 'owner'), readLimiter, async (req, res) => {
  try {
    const { id } = req.params;

    // Get order info
    const orderSql = `
      SELECT 
        o.*,
        u.username as customer_name
      FROM orders o
      LEFT JOIN user u ON o.customer_id = u.customer_id
      WHERE o.id = ?
    `;
    
    const order = await dbHelpers.queryOne(orderSql, [id]);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Get order items
    const itemsSql = `
      SELECT 
        oi.*,
        mi.name,
        mi.description
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = ?
    `;
    
    const items = await dbHelpers.query(itemsSql, [id]);
    
    res.json({
      success: true,
      order: {
        ...order,
        items: items.map(item => ({
          ...item,
          price: parseFloat(item.item_price),
          quantity: item.quantity
        }))
      }
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching order details"
    });
  }
});

// Update order status (admin only)
app.put("/api/admin/orders/:id/status", authenticateToken, requireRole('admin', 'owner'), apiLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['new', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    const updateSql = "UPDATE orders SET status = ? WHERE id = ?";
    await dbHelpers.query(updateSql, [status, id]);

    res.json({
      success: true,
      message: "Order status updated successfully"
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating order status"
    });
  }
});

// Sales Report API (admin only)
app.get("/api/admin/reports/sales", authenticateToken, requireRole('admin', 'owner'), readLimiter, async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;

    // Get orders in date range
    const ordersSql = `
      SELECT 
        o.id,
        o.created_at,
        o.status,
        o.total_price,
        o.customer_id,
        u.username as customer_name,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN user u ON o.customer_id = u.customer_id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE DATE(o.created_at) BETWEEN ? AND ?
      GROUP BY o.id, o.created_at, o.status, o.total_price, o.customer_id, u.username
      ORDER BY o.created_at DESC
    `;

    const orders = await dbHelpers.query(ordersSql, [startDate, endDate]);

    // Calculate summary
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get top selling items
    const topItemsSql = `
      SELECT 
        mi.name,
        SUM(oi.quantity) as quantity,
        SUM(oi.discounted_total) as revenue
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      JOIN orders o ON oi.order_id = o.id
      WHERE DATE(o.created_at) BETWEEN ? AND ?
      GROUP BY mi.id, mi.name
      ORDER BY quantity DESC
      LIMIT 10
    `;

    const topItems = await dbHelpers.query(topItemsSql, [startDate, endDate]);

    res.json({
      success: true,
      report: {
        summary: {
          totalOrders,
          totalRevenue,
          avgOrder,
          completedOrders
        },
        orders,
        topItems
      }
    });
  } catch (error) {
    console.error("Error generating sales report:", error);
    res.status(500).json({
      success: false,
      message: "Error generating report"
    });
  }
});

// ========================================
// KITCHEN ROUTES
// ========================================

// Get active orders for kitchen (kitchen staff, admin, owner)
app.get("/api/kitchen/orders", authenticateToken, requireRole('kitchen', 'admin', 'owner'), kitchenLimiter, async (req, res) => {
  try {
    const ordersSql = `
      SELECT 
        o.id,
        o.customer_id,
        o.total_price,
        o.status,
        o.created_at,
        u.username as customer_name,
        GROUP_CONCAT(
          CONCAT(oi.quantity, 'x ', mi.name) 
          SEPARATOR ', '
        ) as items_text
      FROM orders o
      LEFT JOIN user u ON o.customer_id = u.customer_id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE mi.restaurant_id = ?
      GROUP BY o.id, o.customer_id, o.total_price, o.status, o.created_at, u.username
      ORDER BY 
        CASE o.status
          WHEN 'new' THEN 1
          WHEN 'pending' THEN 1
          WHEN 'preparing' THEN 2
          WHEN 'ready' THEN 3
          ELSE 4
        END,
        o.created_at ASC
    `;

    const orders = await dbHelpers.query(ordersSql, [req.user.restaurantId]);

    // Format orders for frontend
    const formattedOrders = orders.map(order => ({
      id: order.id,
      customer_id: order.customer_id,
      customer_name: order.customer_name || 'Guest',
      total_amount: order.total_price,
      status: order.status,
      created_at: order.created_at,
      items: order.items_text || 'No items'
    }));

    res.json({
      success: true,
      orders: formattedOrders || []
    });
  } catch (error) {
    console.error("Error fetching kitchen orders:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders"
    });
  }
});

// Update order status (kitchen staff, admin, owner)
app.put("/api/kitchen/orders/:id/status", authenticateToken, requireRole('kitchen', 'admin', 'owner'), apiLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['new', 'pending', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    // Verify order exists and belongs to user's restaurant
    const orderCheck = await dbHelpers.queryOne(
      `SELECT o.id 
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
       WHERE o.id = ? AND mi.restaurant_id = ?
       LIMIT 1`,
      [id, req.user.restaurantId]
    );

    if (!orderCheck) {
      return res.status(404).json({
        success: false,
        message: "Order not found or access denied"
      });
    }

    const updateSql = "UPDATE orders SET status = ? WHERE id = ?";
    await dbHelpers.query(updateSql, [status, id]);

    res.json({
      success: true,
      message: "Order status updated successfully"
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating order status"
    });
  }
});

// Simple endpoint to list restaurants for the frontend dropdown. Tries common table names and returns an empty list on failure.
app.get("/api/restaurants", readLimiter, async (req, res) => {
  try {
    // Try primary table first
    let restaurants = await dbHelpers.query(
      "SELECT id, restaurant FROM restaurants"
    );

    // Fallback to alternate table if empty
    if (!restaurants || restaurants.length === 0) {
      restaurants = await dbHelpers.query(
        "SELECT id, restaurant FROM restaurant"
      );
    }

    return res.send({ success: true, restaurants });
  } catch (error) {
    console.warn("Could not fetch restaurants:", error.message);
    return res.send({ success: false, restaurants: [] });
  }
});

// ---------- HELPER FUNCTIONS ----------

/**
 * Get menu item ID by name (with fallback to default)
 * @param {string} itemName - Menu item name
 * @returns {Promise<number>} Menu item ID
 */
async function getMenuItemIdByName(itemName) {
  try {
    const item = await dbHelpers.queryOne(
      'SELECT id FROM menu_items WHERE name = ? LIMIT 1',
      [itemName]
    );
    return item ? item.id : 1; // Fallback to ID 1 if not found
  } catch (error) {
    console.warn('Error fetching menu item ID:', error);
    return 1; // Fallback to ID 1
  }
}

/**
 * Determine customer loyalty level based on order history
 * @param {number} totalOrders - Total number of orders
 * @param {number} totalSpent - Total amount spent
 * @returns {string} Loyalty level (VIP, Regular, Occasional, New)
 */
function getLoyaltyLevel(totalOrders, totalSpent) {
  if (totalOrders >= 10 || totalSpent >= 5000) return "VIP";
  if (totalOrders >= 5 || totalSpent >= 2000) return "Regular";
  if (totalOrders >= 2) return "Occasional";
  return "New";
}

// ---------- ORDER ROUTES ----------
// ---------- ORDER ROUTES ----------
// ---------- ORDER ROUTES ----------
app.post("/api/orders", authenticateToken, orderLimiter, validateOrderCreate, async (req, res) => {
  // ✅ FIX: Use db.promise directly (it's already the promise pool)
  const connection = await db.promise.getConnection();
  
  try {
    const { userId, items, totalAmount } = req.body;
    console.log("POST /api/orders payload:", {
      userId,
      totalAmount,
      itemsCount: Array.isArray(items) ? items.length : 0,
    });

    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No items in order" });
    }

    // Validate and normalize items
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it) {
        return res
          .status(400)
          .json({ success: false, message: `Invalid item at index ${i}` });
      }

      if (typeof it.price === "string") it.price = Number(it.price);
      if (typeof it.quantity === "string") it.quantity = Number(it.quantity);

      if (
        typeof it.price !== "number" ||
        typeof it.quantity !== "number" ||
        isNaN(it.price) ||
        isNaN(it.quantity)
      ) {
        console.error("Invalid item in order payload at index", i, it);
        return res.status(400).json({
          success: false,
          message: `Invalid order items at index ${i}: price and quantity must be numbers`,
        });
      }

      it.quantity = Math.floor(it.quantity);
    }

    // ✅ Start transaction with promise-based API
    await connection.beginTransaction();

    try {
      // 1. Check if customer exists
      const [userResults] = await connection.query(
        `SELECT customer_id FROM user WHERE id = ?`,
        [userId]
      );

      let customerId = userResults[0]?.customer_id;

      // 2. If no customer_id, create customer
      if (!customerId) {
        const [nameResults] = await connection.query(
          `SELECT username FROM user WHERE id = ?`,
          [userId]
        );

        const username = nameResults[0]?.username || `Customer ${userId}`;

        const [customerResult] = await connection.query(
          `INSERT INTO customer (name, contact_method, contact_detail) VALUES (?, 'email', ?)`,
          [username, `${username}@example.com`]
        );

        customerId = customerResult.insertId;

        // Update user table with customer_id
        await connection.query(
          `UPDATE user SET customer_id = ? WHERE id = ?`,
          [customerId, userId]
        );
      }

      // 3. Create order
      const [orderResult] = await connection.query(
        `INSERT INTO orders (customer_id, total_price, status, created_at) VALUES (?, ?, 'new', NOW())`,
        [customerId, totalAmount]
      );

      const orderId = orderResult.insertId;

      // 4. Add order items
      for (const item of items) {
        // Get menuItemId
        const menuItemId =
          item.menuItemId && Number(item.menuItemId)
            ? Number(item.menuItemId)
            : getMenuItemId(item.name);

        console.log("Adding order item with menuItemId:", menuItemId, "for item:", item);

        // Verify menuItemId exists
        const [menuItemRows] = await connection.query(
          `SELECT id FROM menu_items WHERE id = ?`,
          [menuItemId]
        );

        if (!menuItemRows || menuItemRows.length === 0) {
          throw new Error(`Invalid menu item id: ${menuItemId}`);
        }

        const discountedTotal = item.price * item.quantity;

        // Insert order item
        await connection.query(
          `INSERT INTO order_items (order_id, menu_item_id, quantity, item_price, discounted_total) VALUES (?, ?, ?, ?, ?)`,
          [orderId, menuItemId, item.quantity, item.price, discountedTotal]
        );
      }

      // ✅ Commit transaction
      await connection.commit();

      res.json({
        success: true,
        message: "Order placed successfully",
        orderId: orderId,
      });

    } catch (error) {
      // ✅ Rollback on error
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    console.error("Order error:", error);
    res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`,
    });
  } finally {
    // ✅ Always release connection
    connection.release();
  }
});

// Get all orders - Protected: owner/admin only
app.get("/api/orders", authenticateToken, requireRole('owner', 'admin'), readLimiter, (req, res) => {
  const sql = `SELECT * FROM orders ORDER BY created_at DESC`;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching orders:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }
    res.json({ success: true, orders: results });
  });
});

// Get order items - Protected
app.get("/api/orders/:id/items", authenticateToken, readLimiter, validateOrderId, (req, res) => {
  const orderId = req.params.id;

  const sql = `
    SELECT oi.*, mi.name, mi.description 
    FROM order_items oi
    LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
    WHERE oi.order_id = ?
  `;

  db.query(sql, [orderId], (err, results) => {
    if (err) {
      console.error("Error fetching order items:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }
    res.json({ success: true, items: results });
  });
});
// Owner Dashboard API - Daily/Monthly Revenue - Protected
app.get("/api/owner/revenue", authenticateToken, requireRole('owner', 'admin'), readLimiter, async (req, res) => {
  try {
    // Today's revenue
    const todayRevenueSql = `
      SELECT SUM(total_price) as revenue
      FROM orders 
      WHERE DATE(created_at) = CURDATE()
    `;

    // Weekly revenue (last 7 days) - FIXED
    const weeklyRevenueSql = `
  SELECT 
    DATE(created_at) as date,
    SUM(total_price) as daily_revenue
  FROM orders
  WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
  GROUP BY DATE(created_at)
  ORDER BY date
`;

    // Monthly revenue (last 30 days) - FIXED
    const monthlyRevenueSql = `
  SELECT 
    DATE(created_at) as date,
    SUM(total_price) as daily_revenue
  FROM orders
  WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
  GROUP BY DATE(created_at)
  ORDER BY date
`;

    // Execute queries using promise wrapper
    const todayResult = await new Promise((resolve, reject) => {
      db.query(todayRevenueSql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    const weeklyResult = await new Promise((resolve, reject) => {
      db.query(weeklyRevenueSql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    const monthlyResult = await new Promise((resolve, reject) => {
      db.query(monthlyRevenueSql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    res.json({
      success: true,
      revenue: {
        today: todayResult[0]?.revenue || 0,
        weekly: weeklyResult,
        monthly: monthlyResult,
      },
    });
  } catch (error) {
    console.error("Revenue API error details:", {
      message: error.message,
      sqlMessage: error.sqlMessage,
      code: error.code,
    });
    res.status(500).json({
      success: false,
      message: "Revenue data error: " + error.message,
    });
  }
});
// API for Today's Orders Count - Protected
app.get("/api/owner/today-stats", authenticateToken, requireRole('owner', 'admin'), readLimiter, async (req, res) => {
  try {
    // Total orders today
    const ordersTodaySql = `
      SELECT COUNT(*) as total_orders
      FROM orders 
      WHERE DATE(created_at) = CURDATE()
    `;

    // Unique customers today
    const customersTodaySql = `
      SELECT COUNT(DISTINCT customer_id) as unique_customers
      FROM orders 
      WHERE DATE(created_at) = CURDATE()
      AND customer_id IS NOT NULL
    `;

    // Average order value today
    const avgOrderValueSql = `
      SELECT AVG(total_price) as avg_order_value
      FROM orders 
      WHERE DATE(created_at) = CURDATE()
    `;

    const ordersResult = await new Promise((resolve, reject) => {
      db.query(ordersTodaySql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    const customersResult = await new Promise((resolve, reject) => {
      db.query(customersTodaySql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    const avgValueResult = await new Promise((resolve, reject) => {
      db.query(avgOrderValueSql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    res.json({
      success: true,
      stats: {
        totalOrders: ordersResult[0]?.total_orders || 0,
        uniqueCustomers: customersResult[0]?.unique_customers || 0,
        avgOrderValue: avgValueResult[0]?.avg_order_value || 0,
      },
    });
  } catch (error) {
    console.error("Today stats API error:", error);
    res.status(500).json({
      success: false,
      message: "Stats data error: " + error.message,
    });
  }
});
// Popular Items API - Most ordered items - Protected
app.get("/api/owner/popular-items", authenticateToken, requireRole('owner', 'admin'), readLimiter, async (req, res) => {
  try {
    const popularItemsSql = `
      SELECT 
        mi.name,
        mi.description,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.discounted_total) as total_revenue,
        COUNT(DISTINCT oi.order_id) as order_count
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY mi.id, mi.name, mi.description
      ORDER BY total_quantity DESC
      LIMIT 10
    `;

    const popularItems = await new Promise((resolve, reject) => {
      db.query(popularItemsSql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    res.json({
      success: true,
      popularItems: popularItems,
    });
  } catch (error) {
    console.error("Popular items API error:", error);
    res.status(500).json({
      success: false,
      message: "Popular items data error: " + error.message,
    });
  }
});
// Customer Favorites API - Individual customer preferences - Protected
app.get("/api/owner/customer-favorites", authenticateToken, requireRole('owner', 'admin'), readLimiter, async (req, res) => {
  try {
    const customerFavoritesSql = `
  SELECT 
    u.username,
    o.customer_id,
    COUNT(DISTINCT o.id) as total_orders,
    SUM(o.total_price) as total_spent,
    AVG(o.total_price) as avg_order_value,
    GROUP_CONCAT(DISTINCT mi.name ORDER BY oi.quantity DESC SEPARATOR ', ') as favorite_items,
    MAX(o.created_at) as last_order_date
  FROM orders o
  JOIN order_items oi ON o.id = oi.order_id
  JOIN menu_items mi ON oi.menu_item_id = mi.id
  JOIN user u ON o.customer_id = u.customer_id  -- FIXED JOIN
  WHERE o.customer_id IS NOT NULL
  GROUP BY o.customer_id, u.username
  HAVING total_orders >= 1
  ORDER BY total_spent DESC
  LIMIT 15
`;

    const customerFavorites = await new Promise((resolve, reject) => {
      db.query(customerFavoritesSql, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Format the data
    const formattedCustomers = customerFavorites.map((customer) => ({
      customerId: customer.customer_id,
      username: customer.username || `Customer #${customer.customer_id}`, // NEW: Add username
      totalOrders: customer.total_orders,
      totalSpent: parseFloat(customer.total_spent || 0),
      avgOrderValue: parseFloat(customer.avg_order_value || 0),
      favoriteItems: customer.favorite_items
        ? customer.favorite_items.split(", ").slice(0, 3).join(", ")
        : "No favorites",
      lastOrderDate: customer.last_order_date,
      loyaltyLevel: getLoyaltyLevel(
        customer.total_orders,
        customer.total_spent,
      ),
    }));

    res.json({
      success: true,
      customers: formattedCustomers,
    });
  } catch (error) {
    console.error("Customer favorites API error:", error);
    res.status(500).json({
      success: false,
      message: "Customer favorites error: " + error.message,
    });
  }
});

// Helper function to determine loyalty level
function getLoyaltyLevel(totalOrders, totalSpent) {
  if (totalOrders >= 10 || totalSpent >= 5000) return "VIP";
  if (totalOrders >= 5 || totalSpent >= 2000) return "Regular";
  if (totalOrders >= 2) return "Occasional";
  return "New";
}

// ========== ADVANCED ANALYTICS ENDPOINTS ==========

// 1. Monthly Sales Comparison
app.get("/api/owner/analytics/monthly-comparison", authenticateToken, requireRole('owner', 'admin'), readLimiter, async (req, res) => {
  try {
    const monthlySql = `
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(id) as total_orders,
        SUM(total_price) as total_revenue,
        AVG(total_price) as avg_order_value
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
    `;

    const results = await dbHelpers.query(monthlySql);
    
    res.json({
      success: true,
      data: results.map(row => ({
        month: row.month,
        totalOrders: row.total_orders,
        totalRevenue: parseFloat(row.total_revenue || 0),
        avgOrderValue: parseFloat(row.avg_order_value || 0)
      }))
    });
  } catch (error) {
    console.error("Monthly comparison error:", error);
    res.status(500).json({ success: false, message: "Error fetching monthly data" });
  }
});

// 2. Peak Hours Analysis
app.get("/api/owner/analytics/peak-hours", authenticateToken, requireRole('owner', 'admin'), readLimiter, async (req, res) => {
  try {
    const peakHoursSql = `
      SELECT 
        HOUR(created_at) as hour,
        COUNT(id) as order_count,
        SUM(total_price) as revenue
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY HOUR(created_at)
      ORDER BY hour
    `;

    const results = await dbHelpers.query(peakHoursSql);
    
    res.json({
      success: true,
      data: results.map(row => ({
        hour: row.hour,
        orderCount: row.order_count,
        revenue: parseFloat(row.revenue || 0)
      }))
    });
  } catch (error) {
    console.error("Peak hours error:", error);
    res.status(500).json({ success: false, message: "Error fetching peak hours data" });
  }
});

// 3. Category Performance
app.get("/api/owner/analytics/category-performance", authenticateToken, requireRole('owner', 'admin'), readLimiter, async (req, res) => {
  try {
    const categorySql = `
      SELECT 
        mi.category,
        COUNT(DISTINCT oi.order_id) as order_count,
        SUM(oi.quantity) as items_sold,
        SUM(oi.discounted_total) as total_revenue
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY mi.category
      ORDER BY total_revenue DESC
    `;

    const results = await dbHelpers.query(categorySql);
    
    res.json({
      success: true,
      data: results.map(row => ({
        category: row.category || 'Uncategorized',
        orderCount: row.order_count,
        itemsSold: row.items_sold,
        totalRevenue: parseFloat(row.total_revenue || 0)
      }))
    });
  } catch (error) {
    console.error("Category performance error:", error);
    res.status(500).json({ success: false, message: "Error fetching category data" });
  }
});

// 4. Customer Retention Metrics
app.get("/api/owner/analytics/customer-retention", authenticateToken, requireRole('owner', 'admin'), readLimiter, async (req, res) => {
  try {
    // Get new vs returning customers
    const retentionSql = `
      SELECT 
        COUNT(DISTINCT CASE WHEN order_count = 1 THEN customer_id END) as new_customers,
        COUNT(DISTINCT CASE WHEN order_count > 1 THEN customer_id END) as returning_customers,
        COUNT(DISTINCT customer_id) as total_customers,
        AVG(order_count) as avg_orders_per_customer
      FROM (
        SELECT customer_id, COUNT(id) as order_count
        FROM orders
        WHERE customer_id IS NOT NULL
          AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY customer_id
      ) as customer_orders
    `;

    const result = await dbHelpers.queryOne(retentionSql);
    
    const newCustomers = result.new_customers || 0;
    const returningCustomers = result.returning_customers || 0;
    const totalCustomers = result.total_customers || 0;
    const retentionRate = totalCustomers > 0 
      ? ((returningCustomers / totalCustomers) * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        newCustomers,
        returningCustomers,
        totalCustomers,
        retentionRate: parseFloat(retentionRate),
        avgOrdersPerCustomer: parseFloat(result.avg_orders_per_customer || 0).toFixed(1)
      }
    });
  } catch (error) {
    console.error("Customer retention error:", error);
    res.status(500).json({ success: false, message: "Error fetching retention data" });
  }
});

// ========== MENU ITEMS API ROUTES ==========

// 1. GET all menu items
app.get("/api/menu-items", readLimiter, validateRestaurantQuery, async (req, res) => {
  try {
    const { restaurantId } = req.query;

    let sql, params = [];

    if (restaurantId) {
      sql = "SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY category, name";
      params.push(Number(restaurantId));
    } else {
      sql = "SELECT * FROM menu_items ORDER BY category, name";
    }

    const results = await dbHelpers.query(sql, params);

    // Parse options JSON and normalize numeric fields
    const items = results.map((item) => {
      try {
        const parsedOptions = item.options ? JSON.parse(item.options) : null;
        const normalizedOptions = parsedOptions
          ? parsedOptions.map((opt) => ({
              ...opt,
              price: typeof opt.price === "string" ? Number(opt.price) : opt.price,
            }))
          : null;

        return {
          ...item,
          price: typeof item.price === "string" ? Number(item.price) : item.price,
          options: normalizedOptions,
        };
      } catch (e) {
        console.error("Error parsing options for item:", item.id, e);
        return {
          ...item,
          price: typeof item.price === "string" ? Number(item.price) : item.price,
          options: null,
        };
      }
    });

    res.json(items);
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return res.status(500).json({
      success: false,
      message: "Database error",
    });
  }
});

// 2. GET single menu item by ID
app.get("/api/menu-items/:id", readLimiter, validateMenuItemDelete, async (req, res) => {
  try {
    const { id } = req.params;
    const item = await dbHelpers.queryOne(
      "SELECT * FROM menu_items WHERE id = ?",
      [id]
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    // Parse options
    try {
      const parsedOptions = item.options ? JSON.parse(item.options) : null;
      item.options = parsedOptions
        ? parsedOptions.map((opt) => ({
            ...opt,
            price: typeof opt.price === "string" ? Number(opt.price) : opt.price,
          }))
        : null;
      item.price = typeof item.price === "string" ? Number(item.price) : item.price;
    } catch (e) {
      console.error("Error parsing options for item:", item.id, e);
      item.options = null;
      item.price = typeof item.price === "string" ? Number(item.price) : item.price;
    }

    res.json(item);
  } catch (error) {
    console.error("Error fetching menu item:", error);
    return res.status(500).json({
      success: false,
      message: "Database error",
    });
  }
});

// 3. POST create new menu item - Protected: owner/admin only
app.post("/api/menu-items", authenticateToken, requireRole('owner', 'admin'), requireRestaurantAccess, menuModifyLimiter, validateMenuItemCreate, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      available = 1,
      discount = 0,
      image_url = null,
      options = null,
      restaurant_id,
    } = req.body;

    // Prepare options as JSON string
    const optionsJson = options ? JSON.stringify(options) : null;

    const sql = `
      INSERT INTO menu_items 
      (name, description, price, category, available, discount, image_url, options, restaurant_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const insertId = await dbHelpers.insert(sql, [
      name,
      description,
      price,
      category,
      available,
      discount,
      image_url,
      optionsJson,
      restaurant_id,
    ]);

    res.json({
      success: true,
      message: "Menu item created successfully",
      id: insertId,
    });
  } catch (error) {
    console.error("Error creating menu item:", error);
    return res.status(500).json({
      success: false,
      message: "Database error",
    });
  }
});

// 4. PUT update menu item - Protected: owner/admin only
app.put("/api/menu-items/:id", authenticateToken, requireRole('owner', 'admin'), requireRestaurantAccess, menuModifyLimiter, validateMenuItemUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      category,
      available,
      discount,
      image_url,
      options = null,
      restaurant_id,
    } = req.body;

    // Check if item exists and belongs to correct restaurant
    const existingItem = await dbHelpers.queryOne(
      "SELECT id, restaurant_id FROM menu_items WHERE id = ?",
      [id]
    );

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    // Security check
    if (existingItem.restaurant_id !== restaurant_id) {
      console.warn(
        `⚠️ Security: Admin attempted to update menu item ${id} from restaurant ${restaurant_id}, but it belongs to restaurant ${existingItem.restaurant_id}`
      );
      return res.status(403).json({
        success: false,
        message: "You can only update menu items from your own restaurant",
      });
    }

    // Prepare options JSON
    const optionsJson = options ? JSON.stringify(options) : null;

    // Update the item
    const updateSql = `
      UPDATE menu_items 
      SET name = ?, description = ?, price = ?, category = ?, 
          available = ?, discount = ?, image_url = ?, options = ?, restaurant_id = ?
      WHERE id = ?
    `;

    await dbHelpers.update(updateSql, [
      name,
      description,
      price,
      category,
      available,
      discount,
      image_url,
      optionsJson,
      restaurant_id,
      id,
    ]);

    res.json({
      success: true,
      message: "Menu item updated successfully",
    });
  } catch (error) {
    console.error("Error updating menu item:", error);
    return res.status(500).json({
      success: false,
      message: "Database error",
    });
  }
});

// 5. DELETE menu item - WITH RESTAURANT VALIDATION - Protected: owner/admin only
app.delete("/api/menu-items/:id", authenticateToken, requireRole('owner', 'admin'), requireRestaurantAccess, menuModifyLimiter, validateMenuItemDelete, async (req, res) => {
  try {
    const { id } = req.params;
    const { restaurant_id } = req.body || req.query;
    console.log(`🗑️ Attempting to delete menu item ID: ${id}`);

    // Check if item exists and get its restaurant_id
    const existingItem = await dbHelpers.queryOne(
      "SELECT id, restaurant_id FROM menu_items WHERE id = ?",
      [id]
    );

    if (!existingItem) {
      console.log(`❌ Item ${id} not found`);
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    // Security check
    if (existingItem.restaurant_id !== restaurant_id) {
      console.warn(
        `⚠️ Security: Admin attempted to delete menu item ${id} from restaurant ${restaurant_id}, but it belongs to restaurant ${existingItem.restaurant_id}`
      );
      return res.status(403).json({
        success: false,
        message: "You can only delete menu items from your own restaurant",
      });
    }

    console.log(
      `✅ Item ${id} exists and belongs to restaurant ${restaurant_id}, proceeding with delete...`
    );

    // Disable foreign key checks temporarily
    await dbHelpers.query("SET FOREIGN_KEY_CHECKS = 0");

    // Delete the item
    await dbHelpers.deleteQuery("DELETE FROM menu_items WHERE id = ?", [id]);

    // Re-enable foreign key checks
    await dbHelpers.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log(`✅ Successfully deleted item ${id}`);
    res.json({
      success: true,
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete error:", error);
    // Make sure to re-enable foreign key checks
    try {
      await dbHelpers.query("SET FOREIGN_KEY_CHECKS = 1");
    } catch (e) {}
    
    return res.status(500).json({
      success: false,
      message: "Delete failed: " + error.message,
    });
  }
});

// 6. GET menu items by category
app.get("/api/menu-items/category/:category", readLimiter, validateCategoryParam, async (req, res) => {
  try {
    const { category } = req.params;
    const results = await dbHelpers.query(
      "SELECT * FROM menu_items WHERE category = ? AND available = 1 ORDER BY name",
      [category]
    );
    res.json(results);
  } catch (error) {
    console.error("Error fetching menu items by category:", error);
    return res.status(500).json({
      success: false,
      message: "Database error",
    });
  }
});

// 7. POST upload image (DEV helper) - Protected: owner/admin only
app.post("/api/upload-image", authenticateToken, requireRole('owner', 'admin'), uploadLimiter, validateImageUpload, async (req, res) => {
  try {
    const { imageBase64, filename } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ 
        success: false, 
        message: "No image provided" 
      });
    }

    const match = imageBase64.match(/^data:(image\/(\w+));base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid image data" 
      });
    }

    const ext = match[2];
    const data = match[3];
    const buffer = Buffer.from(data, "base64");

    // Size limit safety (binary size)
    const maxUploadBytes = 4 * 1024 * 1024; // 4MB
    if (buffer.length > maxUploadBytes) {
      return res.status(413).json({
        success: false,
        message: `Image too large. Server limit is ${Math.round(maxUploadBytes / 1024)} KB.`,
      });
    }

    const safeName =
      (filename && filename.replace(/[^a-z0-9.\-]/gi, "_")) ||
      `img_${Date.now()}.${ext}`;
    const filePath = path.join(uploadsDir, safeName);

    // Write file using promises
    await fs.promises.writeFile(filePath, buffer);

    // Construct an absolute URL
    const fullUrl = `${req.protocol}://${req.get("host")}/uploads/${safeName}`;
    
    return res.json({ success: true, url: fullUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});
// ========== END OF MENU ITEMS API ==========
// ========== CATCH-ALL FOR REACT (MUST BE LAST) ==========
// app.get("/*", (req, res) => {
//   // Don't redirect API routes
//   if (req.originalUrl.startsWith("/api/")) {
//     return res.status(404).json({ error: "API route not found" });
//   }
//   // Redirect everything else to React frontend
//   res.redirect(`http://localhost:3001${req.originalUrl}`);
// });

// ---------- START SERVER ----------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📱 Access from mobile: http://192.168.18.80:${PORT}`);
});
