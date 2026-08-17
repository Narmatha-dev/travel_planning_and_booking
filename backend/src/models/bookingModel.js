const { query } = require('../config/db');

// Fallback seed bookings matching database/seed.sql
let FALLBACK_BOOKINGS = [
  {
    id: 1,
    booking_reference: 'BK-2026-001',
    user_id: 3,
    trip_id: 1,
    package_id: 1,
    destination_id: 1,
    destination_name: 'Bali Paradise Island',
    package_title: 'Bali Tropical Bliss & Yoga Retreat',
    booking_type: 'package',
    travel_date: '2026-09-10',
    return_date: '2026-09-17',
    num_travelers: 1,
    total_amount: 1299.00,
    discount_amount: 200.00,
    final_amount: 1099.00,
    status: 'confirmed',
    special_requests: 'High-floor villa room requested; vegetarian meal preference.',
    transaction_id: 'TXN-STRIPE-891023',
    payment_status: 'completed',
    created_at: '2026-08-10 14:23:10',
  },
  {
    id: 2,
    booking_reference: 'BK-2026-002',
    user_id: 4,
    trip_id: 2,
    package_id: 4,
    destination_id: 4,
    destination_name: 'Parisian Elegance',
    package_title: 'Romantic Paris & Versailles Gourmet Getaway',
    booking_type: 'package',
    travel_date: '2026-10-05',
    return_date: '2026-10-10',
    num_travelers: 1,
    total_amount: 1850.00,
    discount_amount: 151.00,
    final_amount: 1699.00,
    status: 'confirmed',
    special_requests: 'Quiet room facing courtyard; late arrival around 8 PM.',
    transaction_id: 'TXN-PPAL-771928',
    payment_status: 'completed',
    created_at: '2026-08-12 11:15:45',
  },
];

let nextBookingId = 10;

const bookingModel = {
  async findByUserId(userId) {
    try {
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
    } catch (err) {
      return FALLBACK_BOOKINGS.filter((b) => b.user_id === parseInt(userId, 10));
    }
  },

  async findByReference(reference) {
    try {
      const [rows] = await query(`
        SELECT b.*, d.name AS destination_name, p.title AS package_title, u.full_name AS traveler_name, u.email
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        JOIN destinations d ON b.destination_id = d.id
        LEFT JOIN packages p ON b.package_id = p.id
        WHERE b.booking_reference = ?
      `, [reference]);
      return rows[0] || null;
    } catch (err) {
      return FALLBACK_BOOKINGS.find((b) => b.booking_reference === reference) || null;
    }
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

    try {
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
    } catch (err) {
      const newId = ++nextBookingId;
      const fallbackEntry = {
        id: newId,
        booking_reference: bookingReference,
        user_id: parseInt(userId, 10),
        trip_id: tripId ? parseInt(tripId, 10) : null,
        package_id: packageId ? parseInt(packageId, 10) : null,
        destination_id: parseInt(destinationId, 10),
        destination_name: 'Selected Destination',
        package_title: 'Selected Travel Package',
        booking_type: bookingType || 'package',
        travel_date: travelDate,
        return_date: returnDate || null,
        num_travelers: parseInt(numTravelers, 10) || 1,
        total_amount: parseFloat(totalAmount),
        discount_amount: parseFloat(discountAmount || 0),
        final_amount: parseFloat(finalAmount),
        status: 'confirmed',
        special_requests: specialRequests || null,
        created_at: new Date().toISOString(),
      };
      FALLBACK_BOOKINGS.unshift(fallbackEntry);
      return newId;
    }
  },
};

module.exports = bookingModel;
