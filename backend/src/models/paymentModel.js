const { query } = require('../config/db');

// In-memory fallback payments store matching database/seed.sql
let FALLBACK_PAYMENTS = [
  {
    id: 1,
    booking_id: 1,
    user_id: 3,
    transaction_id: 'TXN-STRIPE-891023',
    payment_method: 'credit_card',
    payment_status: 'completed',
    amount: 1099.00,
    currency: 'USD',
    payment_gateway: 'Stripe',
    gateway_response: { status: 'succeeded', card_brand: 'Visa', last4: '4242' },
    paid_at: '2026-08-10 14:23:10',
    created_at: '2026-08-10 14:23:10',
    updated_at: '2026-08-10 14:23:10',
    booking_reference: 'BK-2026-001',
    package_title: 'Bali Tropical Bliss & Yoga Retreat',
    destination_name: 'Bali Paradise Island',
  },
  {
    id: 2,
    booking_id: 2,
    user_id: 4,
    transaction_id: 'TXN-PPAL-771928',
    payment_method: 'paypal',
    payment_status: 'completed',
    amount: 1699.00,
    currency: 'USD',
    payment_gateway: 'PayPal',
    gateway_response: { status: 'COMPLETED', payer_id: 'PAYER_UK_4492' },
    paid_at: '2026-08-12 11:15:45',
    created_at: '2026-08-12 11:15:45',
    updated_at: '2026-08-12 11:15:45',
    booking_reference: 'BK-2026-002',
    package_title: 'Romantic Paris & Versailles Gourmet Getaway',
    destination_name: 'Parisian Elegance',
  },
  {
    id: 3,
    booking_id: 3,
    user_id: 5,
    transaction_id: 'TXN-STRIPE-338192',
    payment_method: 'credit_card',
    payment_status: 'pending',
    amount: 5398.00,
    currency: 'USD',
    payment_gateway: 'Stripe',
    gateway_response: { status: 'requires_action', client_secret: 'pi_3Mtw_secret' },
    paid_at: null,
    created_at: '2026-08-15 09:30:00',
    updated_at: '2026-08-15 09:30:00',
    booking_reference: 'BK-2026-003',
    package_title: 'Grand Japan Explorer: Tokyo to Kyoto',
    destination_name: 'Kyoto & Tokyo Highlights',
  },
];

let nextPaymentId = 20;

function normalizePayment(p) {
  if (!p) return null;
  return {
    ...p,
    id: parseInt(p.id, 10),
    booking_id: parseInt(p.booking_id, 10),
    user_id: parseInt(p.user_id, 10),
    amount: parseFloat(p.amount),
    gateway_response: typeof p.gateway_response === 'string' ? JSON.parse(p.gateway_response) : p.gateway_response,
  };
}

const paymentModel = {
  /**
   * Create a new payment transaction record
   */
  async createPayment(paymentData) {
    const {
      bookingId,
      userId,
      transactionId,
      paymentMethod = 'credit_card',
      paymentStatus = 'completed',
      amount,
      currency = 'USD',
      paymentGateway = 'Stripe',
      gatewayResponse = {},
      paidAt,
      bookingReference,
      packageTitle,
      destinationName,
    } = paymentData;

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const paidAtTimestamp = paidAt || (paymentStatus === 'completed' ? now : null);
    const responseJson = JSON.stringify(gatewayResponse);

    try {
      const [result] = await query(`
        INSERT INTO payments (
          booking_id, user_id, transaction_id, payment_method, payment_status,
          amount, currency, payment_gateway, gateway_response, paid_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        bookingId,
        userId,
        transactionId,
        paymentMethod,
        paymentStatus,
        amount,
        currency,
        paymentGateway,
        responseJson,
        paidAtTimestamp,
      ]);

      return this.findByIdOrTransactionId(result.insertId);
    } catch (err) {
      const newId = ++nextPaymentId;
      const fallbackEntry = {
        id: newId,
        booking_id: parseInt(bookingId, 10),
        user_id: parseInt(userId, 10),
        transaction_id: transactionId,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        amount: parseFloat(amount),
        currency,
        payment_gateway: paymentGateway,
        gateway_response: gatewayResponse,
        paid_at: paidAtTimestamp,
        created_at: now,
        updated_at: now,
        booking_reference: bookingReference || `BK-2026-${bookingId}`,
        package_title: packageTitle || 'Curated Travel Package',
        destination_name: destinationName || 'Selected Destination',
      };
      FALLBACK_PAYMENTS.unshift(fallbackEntry);
      return normalizePayment(fallbackEntry);
    }
  },

  /**
   * Find single payment by numeric ID or unique transaction ID
   */
  async findByIdOrTransactionId(idOrTxn) {
    const isNumeric = /^\d+$/.test(idOrTxn);
    try {
      let sql = `
        SELECT 
          p.*,
          b.booking_reference,
          b.travel_date,
          b.return_date,
          b.num_travelers,
          b.status AS booking_status,
          d.name AS destination_name,
          d.city AS destination_city,
          d.country AS destination_country,
          pkg.title AS package_title,
          u.full_name AS traveler_name,
          u.email AS traveler_email
        FROM payments p
        JOIN bookings b ON p.booking_id = b.id
        JOIN destinations d ON b.destination_id = d.id
        JOIN users u ON p.user_id = u.id
        LEFT JOIN packages pkg ON b.package_id = pkg.id
        WHERE 
      `;
      sql += isNumeric ? 'p.id = ?' : 'p.transaction_id = ?';

      const [rows] = await query(sql, [isNumeric ? parseInt(idOrTxn, 10) : idOrTxn]);
      return rows && rows.length > 0 ? normalizePayment(rows[0]) : null;
    } catch (err) {
      const match = FALLBACK_PAYMENTS.find((p) =>
        isNumeric ? p.id === parseInt(idOrTxn, 10) : p.transaction_id === idOrTxn
      );
      return match ? normalizePayment(match) : null;
    }
  },

  /**
   * Find payment by booking ID
   */
  async findByBookingId(bookingId) {
    const bid = parseInt(bookingId, 10);
    try {
      const [rows] = await query(`
        SELECT p.*, b.booking_reference, b.status AS booking_status
        FROM payments p
        JOIN bookings b ON p.booking_id = b.id
        WHERE p.booking_id = ?
        ORDER BY p.created_at DESC
        LIMIT 1
      `, [bid]);
      return rows && rows.length > 0 ? normalizePayment(rows[0]) : null;
    } catch (err) {
      const match = FALLBACK_PAYMENTS.find((p) => p.booking_id === bid);
      return match ? normalizePayment(match) : null;
    }
  },

  /**
   * Find payment history for a user
   */
  async findByUserId(userId, { status, limit = 50, offset = 0 } = {}) {
    const uid = parseInt(userId, 10);
    try {
      let sql = `
        SELECT 
          p.*,
          b.booking_reference,
          b.travel_date,
          d.name AS destination_name,
          pkg.title AS package_title
        FROM payments p
        JOIN bookings b ON p.booking_id = b.id
        JOIN destinations d ON b.destination_id = d.id
        LEFT JOIN packages pkg ON b.package_id = pkg.id
        WHERE p.user_id = ?
      `;
      const params = [uid];

      if (status && status !== 'all') {
        sql += ' AND p.payment_status = ?';
        params.push(status);
      }

      sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit, 10), parseInt(offset, 10));

      const [rows] = await query(sql, params);
      return rows.map(normalizePayment);
    } catch (err) {
      let list = FALLBACK_PAYMENTS.filter((p) => p.user_id === uid);
      if (status && status !== 'all') {
        list = list.filter((p) => p.payment_status === status);
      }
      return list.slice(offset, offset + limit).map(normalizePayment);
    }
  },

  /**
   * Update payment status and response payload
   */
  async updateStatus(id, { paymentStatus, gatewayResponse }) {
    const pid = parseInt(id, 10);
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    try {
      const updates = ['payment_status = ?', 'updated_at = NOW()'];
      const params = [paymentStatus];

      if (gatewayResponse) {
        updates.push('gateway_response = ?');
        params.push(JSON.stringify(gatewayResponse));
      }

      if (paymentStatus === 'completed') {
        updates.push('paid_at = NOW()');
      }

      params.push(pid);
      await query(`UPDATE payments SET ${updates.join(', ')} WHERE id = ?`, params);
      return this.findByIdOrTransactionId(pid);
    } catch (err) {
      const match = FALLBACK_PAYMENTS.find((p) => p.id === pid);
      if (match) {
        match.payment_status = paymentStatus;
        if (gatewayResponse) match.gateway_response = gatewayResponse;
        if (paymentStatus === 'completed') match.paid_at = now;
        match.updated_at = now;
        return normalizePayment(match);
      }
      return null;
    }
  },
};

module.exports = paymentModel;
