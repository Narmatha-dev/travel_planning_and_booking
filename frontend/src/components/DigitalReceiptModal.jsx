import { useState, useEffect } from 'react';
import paymentService from '../services/paymentService';

export default function DigitalReceiptModal({ receipt: initialReceipt, identifier, isOpen, onClose }) {
  const [receipt, setReceipt] = useState(initialReceipt || null);
  const [loading, setLoading] = useState(!initialReceipt && Boolean(identifier));
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialReceipt) {
      setReceipt(initialReceipt);
    } else if (isOpen && identifier) {
      async function loadReceipt() {
        setLoading(true);
        setError('');
        try {
          const data = await paymentService.getReceipt(identifier);
          setReceipt(data);
        } catch (err) {
          setError(err.response?.data?.message || err.message || 'Failed to load receipt');
        } finally {
          setLoading(false);
        }
      }
      loadReceipt();
    }
  }, [initialReceipt, identifier, isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!receipt) return;
    const content = `================================================
TRAVEL PLANNING & BOOKING — DIGITAL RECEIPT
================================================
Receipt ID: ${receipt.receipt_id}
Booking Reference: ${receipt.booking_reference}
Transaction ID: ${receipt.transaction_id}
Payment Gateway: ${receipt.payment_gateway}
Payment Status: ${receipt.payment_status?.toUpperCase()}
Date of Payment: ${receipt.paid_at}

------------------------------------------------
TRIP DETAILS
------------------------------------------------
Destination: ${receipt.destination?.name || 'Selected Destination'} (${receipt.destination?.city || ''}, ${receipt.destination?.country || ''})
Departure Date: ${receipt.travel_dates?.departure}
Return Date: ${receipt.travel_dates?.return || 'N/A'}
Number of Guests: ${receipt.num_travelers} Traveler(s)
Transport: ${receipt.selected_transport?.title || 'Standard Transit'}
Accommodation: ${receipt.selected_hotel?.name || 'Standard Hotel'}

------------------------------------------------
PAYMENT & FARE BREAKDOWN
------------------------------------------------
Base Tariff: ₹${receipt.fare_breakdown?.base_amount?.toLocaleString()}
Taxes & Service Fees (5%): ₹${receipt.fare_breakdown?.taxes_and_fees?.toLocaleString()}
Discount Applied: ₹${receipt.fare_breakdown?.discount_amount?.toLocaleString()}
------------------------------------------------
TOTAL AMOUNT PAID: ₹${receipt.fare_breakdown?.final_amount_paid?.toLocaleString()}

------------------------------------------------
TRAVELER DETAILS
------------------------------------------------
Lead Traveler: ${receipt.traveler?.name}
Contact Email: ${receipt.traveler?.email}
Contact Phone: ${receipt.traveler?.phone}

Thank you for planning and booking with Travelora!
24/7 Travel Assistance: support@travelora.com
================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Receipt_${receipt.booking_reference}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="receipt-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '1rem',
      }}
    >
      <div
        className="receipt-modal-container"
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '2.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="no-print"
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '50%',
            width: '38px',
            height: '38px',
            cursor: 'pointer',
            fontSize: '1.1rem',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Close"
        >
          ✕
        </button>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🧾</div>
            <strong>Generating Digital Receipt...</strong>
          </div>
        ) : error ? (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
            <p style={{ color: '#b91c1c', margin: '0 0 1rem 0' }}>⚠️ {error}</p>
            <button onClick={onClose} className="btn btn-secondary btn-sm">Close</button>
          </div>
        ) : receipt ? (
          <div id="printable-digital-receipt" className="digital-receipt-card">
            {/* Header / Brand */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  OFFICIAL TRAVEL VOUCHER & RECEIPT
                </span>
                <h2 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#0f172a', margin: '0.2rem 0' }}>
                  Travelora
                </h2>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Travel Planning & Booking Platform</span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: '800', textTransform: 'uppercase' }}>
                  ● {receipt.payment_status === 'completed' || receipt.payment_status === 'paid' ? 'PAID' : receipt.payment_status?.toUpperCase()}
                </span>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                  {receipt.paid_at ? new Date(receipt.paid_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Verified'}
                </div>
              </div>
            </div>

            {/* Reference Bar */}
            <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Booking Reference</span>
                <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#0284c7' }}>
                  {receipt.booking_reference}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Payment Reference</span>
                <div style={{ fontSize: '1rem', fontWeight: '800', color: '#334155' }}>
                  {receipt.transaction_id}
                </div>
              </div>
            </div>

            {/* Trip Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem', fontSize: '0.9rem', color: '#334155' }}>
              <div>
                <strong>📍 Destination:</strong> {receipt.destination?.name} {receipt.destination?.country ? `(${receipt.destination.country})` : ''}
              </div>
              <div>
                <strong>📅 Travel Dates:</strong> {receipt.travel_dates?.departure} {receipt.travel_dates?.return ? `➔ ${receipt.travel_dates.return}` : ''}
              </div>
              <div>
                <strong>👥 Guests:</strong> {receipt.num_travelers} Traveler(s)
              </div>
              <div>
                <strong>🚆 Transport:</strong> {receipt.selected_transport?.title || 'Standard Road Transit'}
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <strong>🏨 Accommodation:</strong> {receipt.selected_hotel?.name || 'Verified Recommended Stay'}
              </div>
            </div>

            {/* Itemized Fare Table */}
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '1.5rem' }}>
              <div style={{ background: '#f1f5f9', padding: '0.65rem 1rem', fontSize: '0.78rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                Itemized Fare Breakdown
              </div>
              <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', fontSize: '0.88rem' }}>
                <span>Base Travel Tariff</span>
                <strong>₹{receipt.fare_breakdown?.base_amount?.toLocaleString()}</strong>
              </div>
              <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', fontSize: '0.88rem' }}>
                <span>Taxes & Service Fees (5%)</span>
                <span>₹{receipt.fare_breakdown?.taxes_and_fees?.toLocaleString()}</span>
              </div>
              {receipt.fare_breakdown?.discount_amount > 0 && (
                <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', fontSize: '0.88rem', color: '#16a34a' }}>
                  <span>Promotional Discount</span>
                  <span>- ₹{receipt.fare_breakdown.discount_amount.toLocaleString()}</span>
                </div>
              )}
              <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', fontSize: '1.1rem' }}>
                <strong style={{ color: '#0f172a' }}>Total Amount Paid</strong>
                <strong style={{ color: '#0284c7', fontSize: '1.3rem' }}>₹{receipt.fare_breakdown?.final_amount_paid?.toLocaleString()}</strong>
              </div>
            </div>

            {/* Masked Traveler Details */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', fontSize: '0.82rem', color: '#64748b', marginBottom: '1.5rem' }}>
              <div>
                <strong>Lead Traveler:</strong> {receipt.traveler?.name}
              </div>
              <div>
                <strong>Email:</strong> {receipt.traveler?.email}
              </div>
              <div>
                <strong>Phone:</strong> {receipt.traveler?.phone}
              </div>
            </div>

            {/* Footer notice */}
            <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
              Thank you for using our Travel Planner • Free cancellation prior to 48 hours • 24/7 Support: support@travelora.com
            </div>

            {/* Action Bar */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleDownload}
                className="btn btn-outline btn-sm"
                style={{ fontWeight: '700', padding: '0.65rem 1.25rem' }}
              >
                📥 Download Voucher (.txt)
              </button>
              <button
                onClick={handlePrint}
                className="btn btn-primary btn-sm"
                style={{ fontWeight: '800', padding: '0.65rem 1.5rem', background: '#0284c7' }}
              >
                🖨️ Print / Save as PDF
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
