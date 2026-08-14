const { query } = require('../config/db');

const destinationModel = {
  async findAll({ category, search, limit = 20, offset = 0 } = {}) {
    let sql = 'SELECT * FROM destinations WHERE is_active = TRUE';
    const params = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      sql += ' AND (name LIKE ? OR country LIKE ? OR city LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY rating DESC, popularity_score DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await query(sql, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await query('SELECT * FROM destinations WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findBySlug(slug) {
    const [rows] = await query('SELECT * FROM destinations WHERE slug = ?', [slug]);
    return rows[0] || null;
  },
};

module.exports = destinationModel;
