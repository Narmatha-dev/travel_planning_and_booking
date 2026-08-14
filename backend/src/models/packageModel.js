const { query } = require('../config/db');

const packageModel = {
  async findAll({ destinationId, packageType, limit = 20, offset = 0 } = {}) {
    let sql = `
      SELECT p.*, d.name AS destination_name, d.country AS destination_country, d.city AS destination_city
      FROM packages p
      JOIN destinations d ON p.destination_id = d.id
      WHERE p.is_available = TRUE
    `;
    const params = [];

    if (destinationId) {
      sql += ' AND p.destination_id = ?';
      params.push(destinationId);
    }

    if (packageType) {
      sql += ' AND p.package_type = ?';
      params.push(packageType);
    }

    sql += ' ORDER BY p.base_price ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await query(sql, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await query(`
      SELECT p.*, d.name AS destination_name, d.country AS destination_country 
      FROM packages p
      JOIN destinations d ON p.destination_id = d.id
      WHERE p.id = ?
    `, [id]);
    return rows[0] || null;
  },
};

module.exports = packageModel;
