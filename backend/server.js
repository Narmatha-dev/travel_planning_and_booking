const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const { pool } = require('./config/db');

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Travel Planning & Booking API',
    status: 'success',
  });
});

app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    const [rows] = await pool.query('SELECT 1 AS ready');
    if (rows && rows.length > 0) {
      dbStatus = 'connected';
    }
  } catch (err) {
    dbStatus = `unavailable (${err.code || err.message})`;
  }

  res.json({
    status: 'ok',
    message: 'Travel Planning & Booking System backend is running',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/db-status', async (req, res) => {
  try {
    const [tables] = await pool.query(`
      SELECT TABLE_NAME, TABLE_ROWS 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE();
    `);
    res.json({
      status: 'ok',
      database: process.env.DB_NAME || 'travel_booking_db',
      tableCount: tables.length,
      tables,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
