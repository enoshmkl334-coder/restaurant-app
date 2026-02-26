const db = require('../db');
const dbPromise = db.promise;

/**
 * Execute a query with promise support
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 */
async function query(sql, params = []) {
  try {
    const [rows] = await dbPromise.query(sql, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Execute a query and return first row
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object|null>} First row or null
 */
async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Execute an insert query and return insertId
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<number>} Insert ID
 */
async function insert(sql, params = []) {
  try {
    const [result] = await dbPromise.query(sql, params);
    return result.insertId;
  } catch (error) {
    console.error('Database insert error:', error);
    throw error;
  }
}

/**
 * Execute an update query and return affected rows
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<number>} Number of affected rows
 */
async function update(sql, params = []) {
  try {
    const [result] = await dbPromise.query(sql, params);
    return result.affectedRows;
  } catch (error) {
    console.error('Database update error:', error);
    throw error;
  }
}

/**
 * Execute a delete query and return affected rows
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<number>} Number of affected rows
 */
async function deleteQuery(sql, params = []) {
  try {
    const [result] = await dbPromise.query(sql, params);
    return result.affectedRows;
  } catch (error) {
    console.error('Database delete error:', error);
    throw error;
  }
}

/**
 * Execute multiple queries in a transaction
 * @param {Function} callback - Async function that receives connection
 * @returns {Promise<any>} Transaction result
 */
async function transaction(callback) {
  const connection = await dbPromise.getConnection();
  
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    console.error('Transaction error:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Get user by username with permission
 * @param {string} username - Username
 * @returns {Promise<Object|null>} User object or null
 */
async function getUserByUsername(username) {
  const sql = `
    SELECT u.id, u.username, u.password, u.isActive, u.google_id, u.restaurant_id, p.permission
    FROM user u
    LEFT JOIN permission_for_user p ON u.id = p.userId
    WHERE LOWER(u.username) = LOWER(?)
  `;
  return await queryOne(sql, [username]);
}

/**
 * Get user by Google ID or email
 * @param {string} googleId - Google ID
 * @param {string} email - Email
 * @returns {Promise<Object|null>} User object or null
 */
async function getUserByGoogleId(googleId, email) {
  const sql = `
    SELECT u.id, u.username, u.isActive, u.google_id, p.permission, u.restaurant_id
    FROM user u
    LEFT JOIN permission_for_user p ON u.id = p.userId
    WHERE u.google_id = ? OR LOWER(u.username) = ?
  `;
  return await queryOne(sql, [googleId, email]);
}

/**
 * Get restaurant by ID
 * @param {number} restaurantId - Restaurant ID
 * @returns {Promise<Object|null>} Restaurant object or null
 */
async function getRestaurantById(restaurantId) {
  // Try primary table first
  let restaurant = await queryOne(
    'SELECT id, restaurant FROM restaurants WHERE id = ?',
    [restaurantId]
  );
  
  // Fallback to alternate table
  if (!restaurant) {
    restaurant = await queryOne(
      'SELECT id, restaurant FROM restaurant WHERE id = ?',
      [restaurantId]
    );
  }
  
  return restaurant;
}

/**
 * Create or ensure user has default permission
 * @param {number} userId - User ID
 * @param {string} permission - Permission level (default: 'guest')
 * @returns {Promise<void>}
 */
async function ensureUserPermission(userId, permission = 'guest') {
  const sql = `
    INSERT INTO permission_for_user (userId, permission)
    SELECT ?, ? WHERE NOT EXISTS (
      SELECT 1 FROM permission_for_user WHERE userId = ?
    )
  `;
  await query(sql, [userId, permission, userId]);
}

/**
 * Update user's Google credentials
 * @param {number} userId - User ID
 * @param {string} googleId - Google ID
 * @param {string} email - Email
 * @returns {Promise<void>}
 */
async function updateUserGoogleCredentials(userId, googleId, email) {
  const sql = `
    UPDATE user 
    SET google_id = ?, google_email = ?, is_google_user = 1 
    WHERE id = ?
  `;
  await update(sql, [googleId, email, userId]);
}

/**
 * Create new user
 * @param {Object} userData - User data
 * @returns {Promise<number>} New user ID
 */
async function createUser(userData) {
  const { username, password, googleId, googleEmail, isGoogleUser, restaurantId } = userData;
  
  const sql = `
    INSERT INTO user
      (username, password, isActive, lastLogin, customer_id, restaurant_id,
       google_id, google_email, is_google_user)
    VALUES (?, ?, 1, NOW(), NULL, ?, ?, ?, ?)
  `;
  
  return await insert(sql, [
    username,
    password || null,
    restaurantId || null,
    googleId || null,
    googleEmail || null,
    isGoogleUser ? 1 : 0
  ]);
}

module.exports = {
  query,
  queryOne,
  insert,
  update,
  deleteQuery,
  transaction,
  getUserByUsername,
  getUserByGoogleId,
  getRestaurantById,
  ensureUserPermission,
  updateUserGoogleCredentials,
  createUser
};
