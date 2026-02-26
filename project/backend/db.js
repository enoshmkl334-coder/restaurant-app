require('dotenv').config();
const mysql = require('mysql2');

// Create connection pool
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "127.0.0.1",
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE || "rom",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Create promise-based pool for async/await
const promisePool = pool.promise();

// Test connection
pool.getConnection((err, connection) => {
  if (err) {
    console.log('❌ DB connection error:', err);
  } else {
    console.log('✅ Connected to database');
    connection.release();
  }
});

// Export both callback-based and promise-based pools
module.exports = pool;
module.exports.promise = promisePool;
