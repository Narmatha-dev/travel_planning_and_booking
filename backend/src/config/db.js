const mysql = require('mysql2/promise');
const config = require('./environment');

// Construct pool configuration with support for cloud MySQL providers
let poolConfig;

if (config.database.url) {
  poolConfig = {
    uri: config.database.url,
    waitForConnections: true,
    connectionLimit: config.database.connectionLimit,
    queueLimit: 0,
    dateStrings: true,
  };
  if (config.database.ssl) {
    poolConfig.ssl = { rejectUnauthorized: false };
  }
} else {
  poolConfig = {
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name,
    waitForConnections: true,
    connectionLimit: config.database.connectionLimit,
    queueLimit: 0,
    dateStrings: true,
  };
  if (config.database.ssl) {
    poolConfig.ssl = { rejectUnauthorized: false };
  }
}

// Initialize connection pool
const pool = mysql.createPool(poolConfig);

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
