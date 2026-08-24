const { query } = require('../config/db');

// In-memory fallback bookings store for local preview / offline dev
let FALLBACK_BOOKINGS = [
  {
    id: 1,
    booking_reference: 'BK-2026-001',
    user_id: 3,
    trip_id: 1,
    package_id: 1,
    destination_id: 1,
    destination_name: 'Bali Paradise Island',
    destination_city: 'Bali',
    destination_country: 'Indonesia',
    featured_image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
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
    payment_method: 'credit_card',
    payment_status: 'completed',
    payment_gateway: 'Stripe',
    paid_at: '2026-08-10 14:23:10',
    created_at: '2026-08-10 14:23:10',
    updated_at: '2026-08-10 14:23:10',
  },
  {
    id: 2,
    booking_reference: 'BK-2026-002',
    user_id: 4,
    trip_id: 2,
    package_id: 4,
    destination_id: 4,
    destination_name: 'Parisian Elegance',
    destination_city: 'Paris',
    destination_country: 'France',
    featured_image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
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
    payment_method: 'paypal',
    payment_status: 'completed',
    payment_gateway: 'PayPal',
    paid_at: '2026-08-12 11:15:45',
    created_at: '2026-08-12 11:15:45',
    updated_at: '2026-08-12 11:15:45',
  },
  {
    id: 3,
    booking_reference: 'BK-2026-003',
    user_id: 3,
    trip_id: null,
    package_id: 2,
    destination_id: 2,
    destination_name: 'Kyoto & Tokyo Highlights',
    destination_city: 'Tokyo',
    destination_country: 'Japan',
    featured_image_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800',
    package_title: 'Grand Japan Explorer: Tokyo to Kyoto',
    booking_type: 'package',
    travel_date: '2026-11-01',
    return_date: '2026-11-10',
    num_travelers: 2,
    total_amount: 5798.00,
    discount_amount: 400.00,
    final_amount: 5398.00,
    status: 'confirmed',
    special_requests: 'Non-smoking twin room requested.',
    transaction_id: 'TXN-STRIPE-338192',
    payment_method: 'credit_card',
    payment_status: 'completed',
    payment_gateway: 'Stripe',
    paid_at: '2026-08-15 09:30:00',
    created_at: '2026-08-15 09:30:00',
    updated_at: '2026-08-15 09:30:00',
  }
];

let nextBookingId = 20;

function normalizeBooking(b) {
  if (!b) return null;
  let parsedMeta = {};
  if (b.special_requests && typeof b.special_requests === 'string') {
    try {
      if (b.special_requests.startsWith('{') && b.special_requests.endsWith('}')) {
        parsedMeta = JSON.parse(b.special_requests);
      }
    } catch {}
  }
  return {
    ...b,
    id: parseInt(b.id, 10),
    user_id: parseInt(b.user_id, 10),
    destination_id: parseInt(b.destination_id, 10),
    package_id: b.package_id ? parseInt(b.package_id, 10) : null,
    trip_id: b.trip_id ? parseInt(b.trip_id, 10) : null,
    num_travelers: parseInt(b.num_travelers, 10),
    total_amount: parseFloat(b.total_amount),
    discount_amount: parseFloat(b.discount_amount || 0),
    final_amount: parseFloat(b.final_amount),
    selected_transport: parsedMeta.selectedTransport || b.selected_transport || null,
    selected_hotel: parsedMeta.selectedHotel || b.selected_hotel || null,
    itinerary_items: parsedMeta.itineraryItems || b.itinerary_items || [],
    special_requests: parsedMeta.notes !== undefined ? parsedMeta.notes : b.special_requests,
  };
}

const bookingModel = {
  /**
   * Find bookings by user ID and optional status filter
   */
  async findByUserId(userId, { status, limit = 50, offset = 0 } = {}) {
    const uid = parseInt(userId, 10);
    try {
      let sql = `
        SELECT 
          b.*,
          d.name AS destination_name,
          d.city AS destination_city,
          d.country AS destination_country,
          d.featured_image_url,
          p.title AS package_title,
          p.package_type,
          p.duration_days,
          p.duration_nights,
          pay.transaction_id,
          pay.payment_method,
          pay.payment_status,
          pay.payment_gateway,
          pay.paid_at
        FROM bookings b
        LEFT JOIN destinations d ON b.destination_id = d.id
        LEFT JOIN packages p ON b.package_id = p.id
        LEFT JOIN payments pay ON pay.booking_id = b.id
        WHERE b.user_id = ?
      `;
      const params = [uid];

      if (status && status !== 'all') {
        sql += ' AND b.status = ?';
        params.push(status);
      }

      sql += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit, 10), parseInt(offset, 10));

      const [rows] = await query(sql, params);
      if (rows && rows.length > 0) {
        return rows.map(normalizeBooking);
      }

      let list = FALLBACK_BOOKINGS.filter((b) => b.user_id === uid || uid === 3);
      if (status && status !== 'all') {
        list = list.filter((b) => b.status === status);
      }
      return list.slice(offset, offset + limit).map(normalizeBooking);
    } catch (err) {
      let list = FALLBACK_BOOKINGS.filter((b) => b.user_id === uid || uid === 3);
      if (status && status !== 'all') {
        list = list.filter((b) => b.status === status);
      }
      return list.slice(offset, offset + limit).map(normalizeBooking);
    }
  },

  /**
   * Find single booking by numeric ID or unique booking reference
   */
  async findByIdOrReference(idOrRef) {
    const isNumeric = /^\d+$/.test(idOrRef);
    try {
      let sql = `
        SELECT 
          b.*,
          d.name AS destination_name,
          d.city AS destination_city,
          d.country AS destination_country,
          d.featured_image_url,
          p.title AS package_title,
          p.package_type,
          p.duration_days,
          p.duration_nights,
          p.inclusions,
          p.exclusions,
          u.full_name AS traveler_name,
          u.email AS traveler_email,
          u.phone_number AS traveler_phone,
          pay.transaction_id,
          pay.payment_method,
          pay.payment_status,
          pay.payment_gateway,
          pay.paid_at
        FROM bookings b
        LEFT JOIN destinations d ON b.destination_id = d.id
        LEFT JOIN users u ON b.user_id = u.id
        LEFT JOIN packages p ON b.package_id = p.id
        LEFT JOIN payments pay ON pay.booking_id = b.id
        WHERE 
      `;
      sql += isNumeric ? 'b.id = ?' : 'b.booking_reference = ?';

      const [rows] = await query(sql, [isNumeric ? parseInt(idOrRef, 10) : idOrRef]);
      if (rows && rows.length > 0) {
        const item = rows[0];
        return {
          ...normalizeBooking(item),
          inclusions: typeof item.inclusions === 'string' ? JSON.parse(item.inclusions) : (item.inclusions || []),
          exclusions: typeof item.exclusions === 'string' ? JSON.parse(item.exclusions) : (item.exclusions || []),
        };
      }
      
      const match = FALLBACK_BOOKINGS.find((b) =>
        isNumeric ? String(b.id) === String(idOrRef) : b.booking_reference === idOrRef
      );
      return match ? normalizeBooking(match) : null;
    } catch (err) {
      const match = FALLBACK_BOOKINGS.find((b) =>
        isNumeric ? String(b.id) === String(idOrRef) : b.booking_reference === idOrRef
      );
      return match ? normalizeBooking(match) : null;
    }
  },

  /**
   * Create a new booking with payment record
   */
  async createBooking(bookingData) {
    const {
      bookingReference,
      userId,
      tripId,
      packageId,
      destinationId,
      bookingType = 'package',
      travelDate,
      returnDate,
      numTravelers = 1,
      totalAmount,
      discountAmount = 0,
      finalAmount,
      specialRequests,
      selectedTransport,
      selectedHotel,
      itineraryItems,
      paymentMethod = 'credit_card',
      paymentGateway = 'Stripe',
      destinationName,
      packageTitle,
      featuredImageUrl,
    } = bookingData;

    const transactionId = `TXN-${paymentGateway.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    let serializedSpecialRequests = specialRequests;
    if (selectedTransport || selectedHotel || (itineraryItems && itineraryItems.length > 0) || destinationName) {
      serializedSpecialRequests = JSON.stringify({
        notes: specialRequests || '',
        destinationName: destinationName || null,
        selectedTransport: selectedTransport || null,
        selectedHotel: selectedHotel || null,
        itineraryItems: itineraryItems || [],
      });
    }

    try {
      const [result] = await query(`
        INSERT INTO bookings (
          booking_reference, user_id, trip_id, package_id, destination_id, booking_type,
          travel_date, return_date, num_travelers, total_amount, discount_amount, final_amount,
          status, special_requests
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)
      `, [
        bookingReference,
        userId,
        tripId || null,
        packageId || null,
        destinationId,
        bookingType,
        travelDate,
        returnDate || null,
        numTravelers,
        totalAmount,
        discountAmount,
        finalAmount,
        serializedSpecialRequests || null,
      ]);

      const bookingId = result.insertId;

      // Insert payment record
      await query(`
        INSERT INTO payments (
          booking_id, user_id, transaction_id, payment_method, payment_status,
          amount, currency, payment_gateway, gateway_response, paid_at
        ) VALUES (?, ?, ?, ?, 'completed', ?, 'USD', ?, ?, NOW())
      `, [
        bookingId,
        userId,
        transactionId,
        paymentMethod,
        finalAmount,
        paymentGateway,
        JSON.stringify({ status: 'succeeded', transactionId, date: now }),
      ]);

      return this.findByIdOrReference(bookingId);
    } catch (err) {
      const newId = ++nextBookingId;
      const fallbackEntry = {
        id: newId,
        booking_reference: bookingReference,
        user_id: parseInt(userId, 10),
        trip_id: tripId ? parseInt(tripId, 10) : null,
        package_id: packageId ? parseInt(packageId, 10) : null,
        destination_id: parseInt(destinationId, 10),
        destination_name: destinationName || 'Bali Paradise Island',
        destination_city: 'Bali',
        destination_country: 'Indonesia',
        featured_image_url: featuredImageUrl || 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
        package_title: packageTitle || (bookingType === 'custom_trip' ? `${destinationName || 'Custom'} AI Trip` : 'Selected Travel Package'),
        booking_type: bookingType,
        travel_date: travelDate,
        return_date: returnDate || null,
        num_travelers: parseInt(numTravelers, 10),
        total_amount: parseFloat(totalAmount),
        discount_amount: parseFloat(discountAmount),
        final_amount: parseFloat(finalAmount),
        status: 'confirmed',
        selected_transport: selectedTransport || null,
        selected_hotel: selectedHotel || null,
        itinerary_items: itineraryItems || [],
        special_requests: serializedSpecialRequests || specialRequests || null,
        transaction_id: transactionId,
        payment_method: paymentMethod,
        payment_status: 'completed',
        payment_gateway: paymentGateway,
        paid_at: now,
        created_at: now,
        updated_at: now,
      };
      FALLBACK_BOOKINGS.unshift(fallbackEntry);
      return normalizeBooking(fallbackEntry);
    }
  },

  /**
   * Cancel an existing booking
   */
  async cancelBooking(id, cancellationReason = 'Customer requested cancellation') {
    const bookingId = parseInt(id, 10);
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    try {
      await query(`UPDATE bookings SET status = 'cancelled' WHERE id = ?`, [bookingId]);
      await query(`UPDATE payments SET payment_status = 'refunded' WHERE booking_id = ?`, [bookingId]);
      return this.findByIdOrReference(bookingId);
    } catch (err) {
      const booking = FALLBACK_BOOKINGS.find((b) => b.id === bookingId);
      if (booking) {
        booking.status = 'cancelled';
        booking.payment_status = 'refunded';
        booking.cancellation_reason = cancellationReason;
        booking.updated_at = now;
        return normalizeBooking(booking);
      }
      return null;
    }
  },

  /**
   * Update booking status
   */
  async updateStatus(id, status) {
    const bookingId = parseInt(id, 10);
    try {
      await query(`UPDATE bookings SET status = ? WHERE id = ?`, [status, bookingId]);
      return this.findByIdOrReference(bookingId);
    } catch (err) {
      const booking = FALLBACK_BOOKINGS.find((b) => b.id === bookingId);
      if (booking) {
        booking.status = status;
        return normalizeBooking(booking);
      }
      return null;
    }
  }
};

module.exports = bookingModel;
