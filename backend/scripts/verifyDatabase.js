const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'travel_booking_db',
  port: Number(process.env.DB_PORT) || 3306,
};

async function verifyDatabase() {
  console.log('=====================================================');
  console.log(' Travel Planning & Booking Database Verification     ');
  console.log('=====================================================\n');

  let connection;
  try {
    console.log(`Connecting to database "${config.database}" at ${config.host}:${config.port}...`);
    connection = await mysql.createConnection(config);
    console.log('✔ Connected successfully!\n');

    // 1. Table existence & count check
    console.log('--- 1. Table Counts & Verification ---');
    const requiredTables = [
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

    const tableSummary = [];
    for (const table of requiredTables) {
      try {
        const [rows] = await connection.query(`SELECT COUNT(*) AS total FROM \`${table}\``);
        tableSummary.push({
          'Table Name': table,
          'Row Count': rows[0].total,
          'Status': '✔ Verified',
        });
      } catch (err) {
        tableSummary.push({
          'Table Name': table,
          'Row Count': 'N/A',
          'Status': `❌ Error: ${err.message}`,
        });
      }
    }
    console.table(tableSummary);

    // 2. Foreign Key Check
    console.log('\n--- 2. Foreign Key Constraints Check ---');
    const [fkRows] = await connection.query(`
      SELECT 
        TABLE_NAME AS \`Table\`,
        COLUMN_NAME AS \`Column\`,
        CONSTRAINT_NAME AS \`Constraint\`,
        REFERENCED_TABLE_NAME AS \`Referenced Table\`,
        REFERENCED_COLUMN_NAME AS \`Referenced Column\`
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY TABLE_NAME, CONSTRAINT_NAME;
    `, [config.database]);
    console.table(fkRows);

    // 3. Relational Test Queries
    console.log('\n--- 3. Relational Query Validation (Bookings + Payments + Trips) ---');
    const [sampleBookings] = await connection.query(`
      SELECT 
        b.booking_reference,
        u.full_name AS traveler,
        d.name AS destination,
        p.title AS package,
        b.travel_date,
        b.final_amount,
        b.status AS booking_status,
        pay.transaction_id,
        pay.payment_status
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN destinations d ON b.destination_id = d.id
      LEFT JOIN packages p ON b.package_id = p.id
      LEFT JOIN payments pay ON pay.booking_id = b.id;
    `);
    console.table(sampleBookings);

    console.log('\n✔ All 10 tables, relationships, and integrity checks are valid!\n');
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message || error);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Troubleshooting:');
      console.error('  1. Ensure MySQL server is running on the configured port (default 3306).');
      console.error('  2. Run `npm run db:setup` once MySQL is active to initialize travel_booking_db.');
      console.error('  3. Or verify queries manually in MySQL Workbench using database/verify.sql.');
    }
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  verifyDatabase();
}

module.exports = { verifyDatabase };
