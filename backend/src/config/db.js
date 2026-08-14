const mysql = require('mysql2/promise');
const config = require('./environment');

// Initialize connection pool
const pool = mysql.createPool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
  waitForConnections: true,
  connectionLimit: config.database.connectionLimit,
  queueLimit: 0,
  dateStrings: true,
});

/**
 * Executes a prepared SQL query with parameters.
 * @param {string} sql - SQL query string with ? placeholders
 * @param {Array} params - Parameter values
 * @returns {Promise<[Array, Array]>}
 */
async function query(sql, params = []) {
  return pool.query(sql, params);
}

/**
 * Tests database connectivity
 * @returns {Promise<boolean>}
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[Database] Connected to MySQL (${config.database.host}:${config.database.port}/${config.database.name})`);
    connection.release();
    return true;
  } catch (error) {
    console.warn(`[Database] Connection warning (${error.code || error.message}). Database features will activate when MySQL is running.`);
    return false;
  }
}

module.exports = {
  pool,
  query,
  testConnection,
};
