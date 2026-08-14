const { query } = require('../config/db');

const userModel = {
  async findById(id) {
    const [rows] = await query('SELECT id, full_name, email, phone_number, role, profile_image_url, address, bio, is_active, created_at, updated_at FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByEmail(email) {
    const [rows] = await query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  },

  async create(userData) {
    const { fullName, email, passwordHash, phoneNumber, role, profileImageUrl } = userData;
    const [result] = await query(
      `INSERT INTO users (full_name, email, password_hash, phone_number, role, profile_image_url) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [fullName, email, passwordHash, phoneNumber || null, role || 'traveler', profileImageUrl || null]
    );
    return result.insertId;
  },

  async findAll(limit = 20, offset = 0) {
    const [rows] = await query('SELECT id, full_name, email, role, is_active, created_at FROM users LIMIT ? OFFSET ?', [limit, offset]);
    return rows;
  },
};

module.exports = userModel;
