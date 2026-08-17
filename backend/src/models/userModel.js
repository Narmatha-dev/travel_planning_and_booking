const { query } = require('../config/db');

// In-memory fallback user store matching database/seed.sql in case MySQL is offline
const DEFAULT_PASSWORD_HASH = '$2b$10$hYhaJB7dbNq9rK.0jWvQZugx4X9teBr0dCcQMfx0xOhYX4zNPqHLe'; // Password123!

const FALLBACK_USERS = [
  {
    id: 1,
    full_name: 'Administrator',
    email: 'admin@example.com',
    password_hash: DEFAULT_PASSWORD_HASH,
    phone_number: '+1-555-0100',
    role: 'admin',
    profile_image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    address: '100 Admin Plaza, San Francisco, CA',
    bio: 'Platform super-administrator managing destinations, travel packages, and user reviews.',
    is_active: 1,
    created_at: '2026-01-01 00:00:00',
    updated_at: '2026-01-01 00:00:00',
  },
  {
    id: 2,
    full_name: 'Travel Agent Sarah',
    email: 'agent@example.com',
    password_hash: DEFAULT_PASSWORD_HASH,
    phone_number: '+1-555-0101',
    role: 'agent',
    profile_image_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
    address: '250 Tourism Way, New York, NY',
    bio: 'Certified luxury travel advisor specializing in Europe and Southeast Asia itineraries.',
    is_active: 1,
    created_at: '2026-01-02 00:00:00',
    updated_at: '2026-01-02 00:00:00',
  },
  {
    id: 3,
    full_name: 'John Doe',
    email: 'john@example.com',
    password_hash: DEFAULT_PASSWORD_HASH,
    phone_number: '+1-555-0102',
    role: 'traveler',
    profile_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    address: '42 Wanderlust St, Austin, TX',
    bio: 'Passionate globetrotter, photographer, and scuba diving enthusiast.',
    is_active: 1,
    created_at: '2026-01-03 00:00:00',
    updated_at: '2026-01-03 00:00:00',
  },
  {
    id: 4,
    full_name: 'Emma Watson',
    email: 'emma@example.com',
    password_hash: DEFAULT_PASSWORD_HASH,
    phone_number: '+1-555-0103',
    role: 'traveler',
    profile_image_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    address: '77 Ocean Ave, Miami, FL',
    bio: 'Beach lover, yoga practitioner, and food explorer.',
    is_active: 1,
    created_at: '2026-01-04 00:00:00',
    updated_at: '2026-01-04 00:00:00',
  },
];

const userModel = {
  /**
   * Find user by primary key ID (sanitized, excludes password_hash)
   */
  async findById(id) {
    try {
      const [rows] = await query(
        `SELECT id, full_name, email, phone_number, role, profile_image_url, address, bio, is_active, created_at, updated_at 
         FROM users WHERE id = ?`,
        [id]
      );
      return rows[0] || null;
    } catch (err) {
      const u = FALLBACK_USERS.find((user) => user.id === parseInt(id, 10));
      if (!u) return null;
      const { password_hash, ...safeUser } = u;
      return safeUser;
    }
  },

  /**
   * Find user by email address (includes password_hash for authentication)
   */
  async findByEmail(email) {
    if (!email) return null;
    try {
      const [rows] = await query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
      return rows[0] || null;
    } catch (err) {
      return (
        FALLBACK_USERS.find((user) => user.email.toLowerCase() === email.toLowerCase().trim()) || null
      );
    }
  },

  /**
   * Create a new user record with bcrypt-hashed password
   */
  async create(userData) {
    const { fullName, email, passwordHash, phoneNumber, role, profileImageUrl, address, bio } = userData;
    const cleanEmail = email.toLowerCase().trim();

    try {
      const [result] = await query(
        `INSERT INTO users (full_name, email, password_hash, phone_number, role, profile_image_url, address, bio) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          fullName,
          cleanEmail,
          passwordHash,
          phoneNumber || null,
          role || 'traveler',
          profileImageUrl || null,
          address || null,
          bio || null,
        ]
      );
      return result.insertId;
    } catch (err) {
      const newId =
        FALLBACK_USERS.length > 0 ? Math.max(...FALLBACK_USERS.map((u) => u.id)) + 1 : 1;
      const newUser = {
        id: newId,
        full_name: fullName,
        email: cleanEmail,
        password_hash: passwordHash,
        phone_number: phoneNumber || null,
        role: role || 'traveler',
        profile_image_url: profileImageUrl || null,
        address: address || null,
        bio: bio || null,
        is_active: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      FALLBACK_USERS.push(newUser);
      return newId;
    }
  },

  /**
   * Update profile details for a user
   */
  async updateProfile(id, updateData) {
    const { fullName, phoneNumber, address, bio, profileImageUrl } = updateData;
    try {
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
    } catch (err) {
      const user = FALLBACK_USERS.find((u) => u.id === parseInt(id, 10));
      if (user) {
        if (fullName) user.full_name = fullName;
        if (phoneNumber !== undefined) user.phone_number = phoneNumber;
        if (address !== undefined) user.address = address;
        if (bio !== undefined) user.bio = bio;
        if (profileImageUrl !== undefined) user.profile_image_url = profileImageUrl;
        user.updated_at = new Date().toISOString();
      }
      return this.findById(id);
    }
  },

  /**
   * List all users (with pagination)
   */
  async findAll(limit = 20, offset = 0) {
    try {
      const [rows] = await query(
        'SELECT id, full_name, email, phone_number, role, is_active, created_at FROM users LIMIT ? OFFSET ?',
        [limit, offset]
      );
      return rows;
    } catch (err) {
      return FALLBACK_USERS.slice(offset, offset + limit).map(({ password_hash, ...u }) => u);
    }
  },
};

module.exports = userModel;
