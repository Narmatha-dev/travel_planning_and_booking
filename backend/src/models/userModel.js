const { query } = require('../config/db');

const userModel = {
  async findById(id) {
    const [rows] = await query(
      `SELECT id, full_name, email, phone_number, role, profile_image_url, address, bio, is_active, created_at, updated_at 
       FROM users WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async findByEmail(email) {
    const [rows] = await query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  },

  async create(userData) {
    const { fullName, email, passwordHash, phoneNumber, role, profileImageUrl, address, bio } = userData;
    const [result] = await query(
      `INSERT INTO users (full_name, email, password_hash, phone_number, role, profile_image_url, address, bio) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fullName,
        email,
        passwordHash,
        phoneNumber || null,
        role || 'traveler',
        profileImageUrl || null,
        address || null,
        bio || null,
      ]
    );
    return result.insertId;
  },

  async updateProfile(id, updateData) {
    const { fullName, phoneNumber, address, bio, profileImageUrl } = updateData;
    await query(
      `UPDATE users 
       SET full_name = COALESCE(?, full_name),
           phone_number = COALESCE(?, phone_number),
           address = COALESCE(?, address),
           bio = COALESCE(?, bio),
           profile_image_url = COALESCE(?, profile_image_url)
       WHERE id = ?`,
      [fullName || null, phoneNumber || null, address || null, bio || null, profileImageUrl || null, id]
    );
    return this.findById(id);
  },

  async findAll(limit = 20, offset = 0) {
    const [rows] = await query('SELECT id, full_name, email, role, is_active, created_at FROM users LIMIT ? OFFSET ?', [limit, offset]);
    return rows;
  },
};

module.exports = userModel;
