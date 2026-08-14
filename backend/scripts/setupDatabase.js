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
  multipleStatements: true,
};

const DB_NAME = process.env.DB_NAME || 'travel_booking_db';
const SCHEMA_FILE = path.resolve(__dirname, '../../database/schema.sql');
const SEED_FILE = path.resolve(__dirname, '../../database/seed.sql');

async function setupDatabase() {
  console.log('=====================================================');
  console.log('  Travel Planning & Booking Database Setup (Phase 3) ');
  console.log('=====================================================\n');

  let connection;
  try {
    console.log(`[1/4] Connecting to MySQL server at ${config.host}:${config.port}...`);
    connection = await mysql.createConnection(config);
    console.log('✔ Connected to MySQL server successfully.\n');

    console.log(`[2/4] Executing schema definitions from database/schema.sql...`);
    const schemaSql = fs.readFileSync(SCHEMA_FILE, 'utf8');
    await connection.query(schemaSql);
    console.log(`✔ Database "${DB_NAME}" and all 10 tables created successfully.\n`);

    console.log(`[3/4] Seeding initial data from database/seed.sql...`);
    const seedSql = fs.readFileSync(SEED_FILE, 'utf8');
    await connection.query(seedSql);
    console.log('✔ Seed records inserted successfully.\n');

    console.log(`[4/4] Verifying created tables and row counts...`);
    await connection.query(`USE \`${DB_NAME}\`;`);

    const tables = [
      'users',
      'destinations',
      'packages',
      'trips',
      'trip_itineraries',
      'bookings',
      'payments',
      'reviews',
      'favorites',
      'notifications',
    ];

    const results = [];
    for (const table of tables) {
      const [rows] = await connection.query(`SELECT COUNT(*) AS count FROM \`${table}\``);
      results.push({ Table: table, Records: rows[0].count, Status: 'Ready' });
    }

    console.table(results);
    console.log('🎉 Phase 3 Database Setup Completed Successfully!\n');
  } catch (error) {
    console.error('\n❌ Database setup encountered an error:');
    console.error(error.message || error);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Troubleshooting:');
      console.error('  1. Ensure your local MySQL service is running (e.g. MySQL 8.0, XAMPP, or MariaDB).');
      console.error('  2. Verify DB_HOST, DB_USER, DB_PASSWORD, and DB_PORT in backend/.env.');
      console.error('  3. Alternatively, execute database/schema.sql and database/seed.sql directly in MySQL Workbench.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Troubleshooting:');
      console.error('  1. Access denied for user. Please set DB_PASSWORD in backend/.env to your MySQL root/user password.');
    }
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };
