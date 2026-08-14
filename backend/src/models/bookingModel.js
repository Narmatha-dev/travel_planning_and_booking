const { query } = require('../config/db');

const bookingModel = {
  async findByUserId(userId) {
    const [rows] = await query(`
      SELECT b.*, d.name AS destination_name, p.title AS package_title, pay.transaction_id, pay.payment_status
      FROM bookings b
      JOIN destinations d ON b.destination_id = d.id
      LEFT JOIN packages p ON b.package_id = p.id
      LEFT JOIN payments pay ON pay.booking_id = b.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `, [userId]);
    return rows;
  },

  async findByReference(reference) {
    const [rows] = await query(`
      SELECT b.*, d.name AS destination_name, p.title AS package_title, u.full_name AS traveler_name, u.email
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN destinations d ON b.destination_id = d.id
      LEFT JOIN packages p ON b.package_id = p.id
      WHERE b.booking_reference = ?
    `, [reference]);
    return rows[0] || null;
  },

  async createBooking(bookingData) {
    const {
      bookingReference,
      userId,
      tripId,
      packageId,
      destinationId,
      bookingType,
      travelDate,
      returnDate,
      numTravelers,
      totalAmount,
      discountAmount,
      finalAmount,
      specialRequests,
    } = bookingData;

    const [result] = await query(`
      INSERT INTO bookings (
        booking_reference, user_id, trip_id, package_id, destination_id, booking_type,
        travel_date, return_date, num_travelers, total_amount, discount_amount, final_amount, special_requests
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      bookingReference,
      userId,
      tripId || null,
      packageId || null,
      destinationId,
      bookingType || 'package',
      travelDate,
      returnDate || null,
      numTravelers || 1,
      totalAmount,
      discountAmount || 0,
      finalAmount,
      specialRequests || null,
    ]);

    return result.insertId;
  },
};

module.exports = bookingModel;
