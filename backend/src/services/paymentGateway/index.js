const crypto = require('crypto');
const config = require('../../config/environment');

/**
 * Payment Gateway Provider Abstraction
 * Supports configurable providers (Stripe, Razorpay, or Sandbox Payment-Ready Gateway)
 * Never exposes secret keys to the frontend.
 */
class PaymentGateway {
  constructor() {
    this.provider = process.env.PAYMENT_GATEWAY_PROVIDER || 'sandbox';
    this.keyId = process.env.PAYMENT_GATEWAY_KEY_ID || process.env.STRIPE_PUBLIC_KEY || process.env.RAZORPAY_KEY_ID || 'pk_sandbox_travelora_2026';
    this.keySecret = process.env.PAYMENT_GATEWAY_KEY_SECRET || process.env.STRIPE_SECRET_KEY || process.env.RAZORPAY_KEY_SECRET || 'sk_sandbox_secret_2026';
    this.isSandbox = !process.env.PAYMENT_GATEWAY_KEY_SECRET;
  }

  /**
   * Get public configuration safe for client-side consumption
   */
  getPublicConfig() {
    return {
      provider: this.provider,
      keyId: this.keyId,
      isSandbox: this.isSandbox,
      currency: 'INR',
      supportedMethods: ['upi', 'card', 'netbanking', 'wallet'],
    };
  }

  /**
   * Create a server-side payment order / session
   * @param {Object} params - { orderId, amount, currency, receipt, notes, customer }
   */
  async createOrder({ orderId, amount, currency = 'INR', receipt, notes = {}, customer = {} }) {
    const timestamp = Date.now();
    const generatedOrderId = orderId || `order_${timestamp.toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

    // In a live integration (e.g. Razorpay/Stripe), call official SDKs here.
    // For Sandbox/Payment-ready architecture:
    return {
      orderId: generatedOrderId,
      amount: parseFloat(amount),
      currency: currency.toUpperCase(),
      receipt: receipt || `rcpt_${timestamp}`,
      status: 'created',
      provider: this.provider,
      keyId: this.keyId,
      isSandbox: this.isSandbox,
      notes,
      customer: {
        name: customer.name || 'Traveler',
        email: customer.email || 'traveler@example.com',
        contact: customer.phone || '',
      },
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Verify server-side payment signature / transaction
   * @param {Object} params - { orderId, paymentId, signature, payload }
   */
  async verifyPayment({ orderId, paymentId, signature, payload = {} }) {
    if (!orderId || !paymentId) {
      return {
        verified: false,
        reason: 'Missing orderId or paymentId for verification',
      };
    }

    // If explicit simulated failure requested
    if (payload.simulateFailure === true) {
      return {
        verified: false,
        reason: 'Payment declined by issuer (Simulated Decline)',
        status: 'declined',
      };
    }

    // In live mode with HMAC signature (e.g. Razorpay / Webhook signature)
    if (!this.isSandbox && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', this.keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature, 'utf-8'),
        Buffer.from(expectedSignature, 'utf-8')
      );

      return {
        verified: isValid,
        reason: isValid ? 'Signature verified' : 'Invalid signature verification',
        status: isValid ? 'succeeded' : 'failed',
      };
    }

    // In sandbox / test mode
    return {
      verified: true,
      reason: 'Sandbox payment verified successfully',
      status: 'succeeded',
      transactionId: paymentId.startsWith('pay_') || paymentId.startsWith('TXN-')
        ? paymentId
        : `TXN-${this.provider.toUpperCase()}-${paymentId}`,
      verifiedAt: new Date().toISOString(),
    };
  }

  /**
   * Verify incoming Webhook signature
   * @param {string|Buffer} rawPayload
   * @param {string} signatureHeader
   * @param {string} webhookSecret
   */
  verifyWebhookSignature(rawPayload, signatureHeader, webhookSecret = this.keySecret) {
    if (!signatureHeader) return false;
    try {
      const expected = crypto
        .createHmac('sha256', webhookSecret)
        .update(typeof rawPayload === 'string' ? rawPayload : JSON.stringify(rawPayload))
        .digest('hex');
      return signatureHeader === expected || this.isSandbox;
    } catch {
      return false;
    }
  }
}

const paymentGateway = new PaymentGateway();

module.exports = paymentGateway;
