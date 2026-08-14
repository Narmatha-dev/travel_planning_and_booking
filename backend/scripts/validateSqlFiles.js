const fs = require('fs');
const path = require('path');

const SCHEMA_FILE = path.resolve(__dirname, '../../database/schema.sql');
const SEED_FILE = path.resolve(__dirname, '../../database/seed.sql');
const VERIFY_FILE = path.resolve(__dirname, '../../database/verify.sql');

function validateSqlFiles() {
  console.log('=====================================================');
  console.log(' SQL Script Integrity & Syntax Structural Validator ');
  console.log('=====================================================\n');

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

  // 1. Validate Schema File
  console.log('Checking database/schema.sql...');
  if (!fs.existsSync(SCHEMA_FILE)) {
    throw new Error('schema.sql does not exist!');
  }
  const schemaContent = fs.readFileSync(SCHEMA_FILE, 'utf8');

  console.log('✔ Checking database creation statement...');
  if (!schemaContent.includes('CREATE DATABASE IF NOT EXISTS `travel_booking_db`')) {
    throw new Error('Missing database creation statement for travel_booking_db');
  }

  for (const table of requiredTables) {
    const tableRegex = new RegExp(`CREATE TABLE \`${table}\``, 'i');
    if (!tableRegex.test(schemaContent)) {
      throw new Error(`Missing table definition for "${table}" in schema.sql`);
    }
    console.log(`  ✔ Table "${table}" DDL present`);
  }

  // 2. Validate Foreign Keys and Integrity Constraints
  console.log('\nChecking Foreign Keys & Constraints...');
  const constraints = [
    'fk_packages_destination',
    'fk_trips_user',
    'fk_trips_destination',
    'fk_trips_package',
    'fk_itineraries_trip',
    'fk_bookings_user',
    'fk_bookings_destination',
    'fk_payments_booking',
    'fk_payments_user',
    'fk_reviews_user',
    'fk_favorites_user',
    'fk_notifications_user',
    'chk_destinations_rating',
    'chk_packages_duration_days',
    'chk_trips_dates',
    'chk_bookings_num_travelers',
    'chk_reviews_rating',
  ];

  for (const c of constraints) {
    if (!schemaContent.includes(c)) {
      throw new Error(`Missing constraint or foreign key "${c}" in schema.sql`);
    }
    console.log(`  ✔ Constraint/FK "${c}" verified`);
  }

  // 3. Validate Seed File
  console.log('\nChecking database/seed.sql...');
  if (!fs.existsSync(SEED_FILE)) {
    throw new Error('seed.sql does not exist!');
  }
  const seedContent = fs.readFileSync(SEED_FILE, 'utf8');

  for (const table of requiredTables) {
    const insertRegex = new RegExp(`INSERT INTO \`${table}\``, 'i');
    if (!insertRegex.test(seedContent)) {
      throw new Error(`Missing seed data INSERT for "${table}" in seed.sql`);
    }
    console.log(`  ✔ Seed data for "${table}" present`);
  }

  // Verify bcrypt password hashes in seed
  if (!seedContent.includes('$2a$10$')) {
    throw new Error('Password hash does not adhere to bcrypt format in seed.sql');
  }
  console.log('  ✔ Password hashing (bcrypt format) verified in seed data');

  // 4. Validate Verify File
  console.log('\nChecking database/verify.sql...');
  if (!fs.existsSync(VERIFY_FILE)) {
    throw new Error('verify.sql does not exist!');
  }
  const verifyContent = fs.readFileSync(VERIFY_FILE, 'utf8');
  console.log(`  ✔ verify.sql loaded (${verifyContent.length} bytes)`);

  console.log('\n=====================================================');
  console.log('🎉 ALL 10 TABLES, FOREIGN KEYS & SQL FILES VALIDATED! ');
  console.log('=====================================================\n');
}

try {
  validateSqlFiles();
} catch (err) {
  console.error('\n❌ SQL Validation Error:', err.message);
  process.exit(1);
}
