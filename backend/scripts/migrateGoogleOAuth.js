const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'travel_booking_db',
  multipleStatements: true,
};

async function runMigration() {
  console.log('=====================================================');
  console.log('  Applying Google OAuth 2.0 Database Migration       ');
  console.log('=====================================================\n');

  let connection;
  try {
    console.log(`[1/3] Connecting to database "${config.database}"...`);
    connection = await mysql.createConnection(config);
    console.log('✔ Connected successfully.\n');

    console.log('[2/3] Executing migration statements...');
    // Execute each step safely
    // 1. Modify password_hash to allow null
    await connection.query('ALTER TABLE `users` MODIFY COLUMN `password_hash` VARCHAR(255) NULL;');

    // 2. Check if google_id column exists
    const [googleIdCols] = await connection.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'google_id'",
      [config.database]
    );
    if (googleIdCols.length === 0) {
      await connection.query(
        "ALTER TABLE `users` ADD COLUMN `google_id` VARCHAR(255) DEFAULT NULL AFTER `password_hash`;"
      );
      console.log('  + Added `google_id` column to users table.');
    } else {
      console.log('  = Column `google_id` already exists.');
    }

    // 3. Check if auth_provider column exists
    const [providerCols] = await connection.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'auth_provider'",
      [config.database]
    );
    if (providerCols.length === 0) {
      await connection.query(
        "ALTER TABLE `users` ADD COLUMN `auth_provider` ENUM('local', 'google') NOT NULL DEFAULT 'local' AFTER `google_id`;"
      );
      console.log('  + Added `auth_provider` column to users table.');
    } else {
      console.log('  = Column `auth_provider` already exists.');
    }

    // 4. Check if uq_users_google_id unique index exists
    const [indexRows] = await connection.query(
      "SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND INDEX_NAME = 'uq_users_google_id'",
      [config.database]
    );
    if (indexRows.length === 0) {
      await connection.query('ALTER TABLE `users` ADD UNIQUE KEY `uq_users_google_id` (`google_id`);');
      console.log('  + Added unique index `uq_users_google_id`.');
    } else {
      console.log('  = Unique index `uq_users_google_id` already exists.');
    }

    console.log('\n[3/3] Verifying users table structure:');
    const [columns] = await connection.query('DESCRIBE users;');
    console.table(columns);

    console.log('🎉 Google OAuth 2.0 Migration Completed Successfully!\n');
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error.message || error);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
