const { query } = require('../config/db');

const tripModel = {
  async findByUserId(userId) {
    const [rows] = await query(`
      SELECT t.*, d.name AS destination_name, d.country AS destination_country, p.title AS package_title
      FROM trips t
      JOIN destinations d ON t.destination_id = d.id
      LEFT JOIN packages p ON t.package_id = p.id
      WHERE t.user_id = ?
      ORDER BY t.start_date DESC
    `, [userId]);
    return rows;
  },

  async findItinerariesByTripId(tripId) {
    const [rows] = await query(`
      SELECT * FROM trip_itineraries 
      WHERE trip_id = ? 
      ORDER BY day_number ASC, activity_time ASC
    `, [tripId]);
    return rows;
  },

  async createTrip(tripData) {
    const { userId, destinationId, packageId, title, tripType, startDate, endDate, totalBudget, estimatedCost, notes } = tripData;
    const [result] = await query(`
      INSERT INTO trips (user_id, destination_id, package_id, title, trip_type, start_date, end_date, total_budget, estimated_cost, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, destinationId, packageId || null, title, tripType || 'solo', startDate, endDate, totalBudget || 0, estimatedCost || 0, notes || null]);
    return result.insertId;
  },
};

module.exports = tripModel;
