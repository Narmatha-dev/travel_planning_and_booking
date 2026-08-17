import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import packageService from '../services/packageService';
import bookingService from '../services/bookingService';
import paymentService from '../services/paymentService';

const STEPS = [
  { step: 1, label: 'Select Package', icon: '📦' },
  { step: 2, label: 'Select Date', icon: '📅' },
  { step: 3, label: 'Traveler Details', icon: '👤' },
  { step: 4, label: 'Booking Summary', icon: '📋' },
  { step: 5, label: 'Payment', icon: '💳' },
  { step: 6, label: 'Confirmation', icon: '🎉' },
];

const PAYMENT_METHODS = [
  { id: 'credit_card', label: 'Credit Card', icon: '💳', sub: 'Visa, MasterCard, Amex' },
  { id: 'paypal', label: 'PayPal', icon: '🅿️', sub: 'Fast & Secure Checkout' },
  { id: 'stripe', label: 'Stripe Pay', icon: '⚡', sub: 'Instant Online Payment' },
  { id: 'upi', label: 'UPI / NetBanking', icon: '🏦', sub: 'Direct Bank Transfer' },
];

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppContext();

  const queryPackageId = searchParams.get('packageId');
  const queryTravelers = parseInt(searchParams.get('travelers') || '2', 10);
  const queryDate = searchParams.get('date') || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

  const [currentStep, setCurrentStep] = useState(queryPackageId ? 2 : 1);
  const [availablePackages, setAvailablePackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [paymentFailureError, setPaymentFailureError] = useState('');

  // Booking Form State
  const [formData, setFormData] = useState({
    travelDate: queryDate,
    numTravelers: queryTravelers,
    fullName: user?.full_name || user?.name || '',
    email: user?.email || '',
    phoneNumber: user?.phone_number || '+1-555-0199',
    specialRequests: '',
    paymentMethod: 'credit_card',
    cardNumber: '4242 •••• •••• 4242',
    cardExpiry: '12/28',
    cardCvv: '•••',
    promoCode: '',
    promoDiscount: 0,
    simulateFailure: false,
  });

  // Confirmed booking & payment state
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [confirmedPayment, setConfirmedPayment] = useState(null);

  // Load packages
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const pkgs = await packageService.getPackages();
        setAvailablePackages(pkgs || []);

        if (queryPackageId && pkgs && pkgs.length > 0) {
          const match = pkgs.find((p) => p.id === parseInt(queryPackageId, 10) || p.slug === queryPackageId);
          if (match) {
            setSelectedPackage(match);
            setCurrentStep(2);
          } else {
            setSelectedPackage(pkgs[0]);
          }
        } else if (pkgs && pkgs.length > 0) {
          setSelectedPackage(pkgs[0]);
        }
      } catch (err) {
        console.warn('Failed to load packages for booking wizard:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [queryPackageId]);

  // Update user profile fields if loaded
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.full_name || user.name || '',
        email: prev.email || user.email || '',
        phoneNumber: prev.phoneNumber || user.phone_number || '+1-555-0199',
      }));
    }
  }, [user]);

  // Price calculations
  const effectivePrice = selectedPackage ? Number(selectedPackage.discount_price || selectedPackage.base_price) : 1299;
  const basePrice = selectedPackage ? Number(selectedPackage.base_price) : 1499;
  const perPersonSavings = basePrice > effectivePrice ? basePrice - effectivePrice : 0;
  const subtotal = effectivePrice * formData.numTravelers;
  const totalSavings = perPersonSavings * formData.numTravelers + formData.promoDiscount;
  const taxesAndFees = Math.round(subtotal * 0.08);
  const finalTotal = Math.max(0, subtotal + taxesAndFees - formData.promoDiscount);

  // Return date calculation based on duration_days
  const durationDays = selectedPackage?.duration_days || 7;
  const returnDateCalc = (() => {
    if (!formData.travelDate) return '';
    const d = new Date(formData.travelDate);
    d.setDate(d.getDate() + durationDays);
    return d.toISOString().split('T')[0];
  })();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setError('');
    setPaymentFailureError('');
  };

  const handleTravelersChange = (delta) => {
    setFormData((prev) => {
      const nextCount = Math.max(1, Math.min(selectedPackage?.max_group_size || 14, prev.numTravelers + delta));
      return { ...prev, numTravelers: nextCount };
    });
  };

  const handleApplyPromo = (e) => {
    e.preventDefault();
    if (formData.promoCode.trim().toUpperCase() === 'TRAVEL2026' || formData.promoCode.trim().toUpperCase() === 'EXPLORE100') {
      setFormData((prev) => ({ ...prev, promoDiscount: 100 }));
      setError('');
    } else {
      setError('Invalid promotional coupon code');
    }
  };

  const validateStep = (step) => {
    setError('');
    setPaymentFailureError('');
    if (step === 1) {
      if (!selectedPackage) {
        setError('Please select a travel package to continue');
        return false;
      }
      if (!selectedPackage.is_available) {
        setError('Selected package is currently sold out. Please select an available package.');
        return false;
      }
    }
    if (step === 2) {
      if (!formData.travelDate) {
        setError('Please select a valid departure date');
        return false;
      }
      const today = new Date().toISOString().split('T')[0];
      if (formData.travelDate < today) {
        setError('Departure date cannot be in the past');
        return false;
      }
    }
    if (step === 3) {
      if (!formData.fullName.trim()) {
        setError('Lead traveler full name is required');
        return false;
      }
      if (!formData.email.trim() || !formData.email.includes('@')) {
        setError('A valid contact email address is required');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(STEPS.length, prev + 1));
      window.scrollTo(0, 0);
    }
  };

  const handlePrevStep = () => {
    setError('');
    setPaymentFailureError('');
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo(0, 0);
  };

  const handleConfirmAndPay = async () => {
    setSubmitting(true);
    setError('');
    setPaymentFailureError('');

    try {
      // 1. Create booking reservation
      const bookingPayload = {
        userId: user?.id || 3,
        packageId: selectedPackage?.id || 1,
        destinationId: selectedPackage?.destination_id || 1,
        destinationName: selectedPackage?.destination_name,
        packageTitle: selectedPackage?.title,
        featuredImageUrl: selectedPackage?.featured_image_url,
        bookingType: 'package',
        travelDate: formData.travelDate,
        returnDate: returnDateCalc,
        numTravelers: formData.numTravelers,
        totalAmount: basePrice * formData.numTravelers,
        discountAmount: totalSavings,
        finalAmount: finalTotal,
        specialRequests: formData.specialRequests,
        paymentMethod: formData.paymentMethod,
        paymentGateway: formData.paymentMethod === 'paypal' ? 'PayPal' : 'Stripe',
      };

      const bookingResult = await bookingService.createBooking(bookingPayload);

      // 2. Process payment transaction via paymentService
      const paymentPayload = {
        bookingId: bookingResult.id,
        userId: user?.id || 3,
        amount: finalTotal,
        currency: 'USD',
        paymentMethod: formData.paymentMethod,
        paymentGateway: formData.paymentMethod === 'paypal' ? 'PayPal' : 'Stripe',
        simulateFailure: Boolean(formData.simulateFailure),
        cardBrand: 'Visa',
        cardLast4: formData.cardNumber.replace(/\D/g, '').slice(-4) || '4242',
        destinationName: selectedPackage?.destination_name,
        packageTitle: selectedPackage?.title,
      };

      const paymentResult = await paymentService.processPayment(paymentPayload);

      setConfirmedBooking(bookingResult);
      setConfirmedPayment(paymentResult);
      setCurrentStep(6);
      window.scrollTo(0, 0);
    } catch (err) {
      if (err.response?.status === 402 || formData.simulateFailure) {
        setPaymentFailureError(
          '❌ Payment Authorization Declined: The transaction was declined by the issuer (Simulated Failure). No charge was made. Please verify your details, select another payment method, or uncheck failure simulation to retry.'
        );
      } else {
        setError(err.response?.data?.message || err.message || 'Payment processing failed. Please verify your details.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', color: '#0284c7', fontWeight: '600' }}>
          ✈️ Initializing booking flow...
        </div>
      </div>
    );
  }

  return (
    <section className="section page-section" style={{ paddingTop: '2rem' }}>
      <div className="container" style={{ maxWidth: '1000px' }}>
        {/* Step Progress Tracker */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'relative',
              padding: '0 0.5rem',
            }}
          >
            {/* Background line */}
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '40px',
                right: '40px',
                height: '3px',
                background: '#e2e8f0',
                zIndex: 0,
              }}
            />
            {/* Active progress fill */}
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '40px',
                width: `${((currentStep - 1) / (STEPS.length - 1)) * 90}%`,
                height: '3px',
                background: '#0284c7',
                zIndex: 0,
                transition: 'width 0.4s ease',
              }}
            />

            {STEPS.map((s) => {
              const isCompleted = currentStep > s.step;
              const isActive = currentStep === s.step;

              return (
                <div
                  key={s.step}
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: s.step < currentStep && currentStep !== 6 ? 'pointer' : 'default',
                  }}
                  onClick={() => {
                    if (s.step < currentStep && currentStep !== 6) {
                      setCurrentStep(s.step);
                    }
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: isActive ? '#0284c7' : isCompleted ? '#16a34a' : '#ffffff',
                      color: isActive || isCompleted ? '#ffffff' : '#64748b',
                      border: isActive || isCompleted ? 'none' : '2px solid #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '0.9rem',
                      boxShadow: isActive ? '0 4px 12px rgba(2, 132, 199, 0.35)' : 'none',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {isCompleted ? '✓' : s.step}
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: isActive ? '700' : '500',
                      color: isActive ? '#0284c7' : isCompleted ? '#16a34a' : '#64748b',
                      marginTop: '0.5rem',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Alert Message */}
        {error && (
          <div
            style={{
              background: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fca5a5',
              padding: '1rem',
              borderRadius: '12px',
              marginBottom: '2rem',
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Payment Failure / Decline Banner */}
        {paymentFailureError && (
          <div
            style={{
              background: '#fff1f2',
              color: '#9f1239',
              border: '1px solid #fecdd3',
              padding: '1.25rem',
              borderRadius: '12px',
              marginBottom: '2rem',
              fontSize: '0.95rem',
              lineHeight: '1.5',
              boxShadow: '0 4px 12px rgba(225, 29, 72, 0.08)',
            }}
          >
            <div style={{ fontWeight: '800', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🛑</span> Payment Declined
            </div>
            <div>{paymentFailureError}</div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* STEP 1: SELECT PACKAGE                               */}
        {/* ---------------------------------------------------- */}
        {currentStep === 1 && (
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '2.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)' }}>
            <span className="eyebrow">Step 1 of 5</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: '0.35rem 0 0.5rem 0' }}>
              Choose Your Travel Package
            </h2>
            <p style={{ color: '#64748b', marginBottom: '2rem' }}>
              Select an all-inclusive curated travel package to start your personalized booking journey.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              {availablePackages.map((p) => {
                const isSelected = selectedPackage?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedPackage(p);
                      setError('');
                    }}
                    style={{
                      border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      borderRadius: '14px',
                      padding: '1.25rem',
                      cursor: 'pointer',
                      background: isSelected ? '#f0f9ff' : '#ffffff',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 4px 14px rgba(2, 132, 199, 0.15)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#0369a1', background: '#e0f2fe', padding: '2px 8px', borderRadius: '6px' }}>
                        {p.package_type}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: p.is_available ? '#16a34a' : '#dc2626', fontWeight: '700' }}>
                        {p.is_available ? '● Available' : '○ Sold Out'}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                      {p.title}
                    </h4>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 0.75rem 0' }}>
                      📍 {p.destination_name} • ⏱️ {p.duration_days} Days / {p.duration_nights} Nights
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>From</span>
                      <span style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0284c7' }}>
                        ${(p.discount_price || p.base_price).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleNextStep} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                Continue to Date Selection ➜
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* STEP 2: SELECT DATE & GUESTS                         */}
        {/* ---------------------------------------------------- */}
        {currentStep === 2 && (
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '2.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)' }}>
            <span className="eyebrow">Step 2 of 5</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: '0.35rem 0 0.5rem 0' }}>
              Select Travel Date & Travelers
            </h2>
            <p style={{ color: '#64748b', marginBottom: '2rem' }}>
              Selected Package: <strong>{selectedPackage?.title}</strong> ({selectedPackage?.duration_days} Days)
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
              {/* Departure Date */}
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '0.5rem' }}>
                  📅 Departure Date
                </label>
                <input
                  type="date"
                  name="travelDate"
                  value={formData.travelDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '1rem',
                  }}
                />
                {returnDateCalc && (
                  <p style={{ fontSize: '0.85rem', color: '#0284c7', marginTop: '0.5rem' }}>
                    ✈️ Estimated Return Date: <strong>{returnDateCalc}</strong> ({durationDays} Days / {durationDays - 1} Nights)
                  </p>
                )}
              </div>

              {/* Number of Travelers Counter */}
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '0.5rem' }}>
                  👥 Number of Guests (Travelers)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => handleTravelersChange(-1)}
                    style={{
                      width: '45px',
                      height: '45px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      fontSize: '1.3rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    −
                  </button>
                  <div style={{ flex: 1, textAlign: 'center', background: '#f8fafc', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>
                      {formData.numTravelers} {formData.numTravelers === 1 ? 'Traveler' : 'Travelers'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTravelersChange(1)}
                    style={{
                      width: '45px',
                      height: '45px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      fontSize: '1.3rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    +
                  </button>
                </div>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginTop: '0.5rem' }}>
                  Maximum group capacity: {selectedPackage?.max_group_size || 14} travelers.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={handlePrevStep} className="btn btn-outline" style={{ padding: '0.75rem 1.5rem' }}>
                ⬅ Change Package
              </button>
              <button onClick={handleNextStep} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                Continue to Traveler Details ➜
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* STEP 3: TRAVELER DETAILS                             */}
        {/* ---------------------------------------------------- */}
        {currentStep === 3 && (
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '2.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)' }}>
            <span className="eyebrow">Step 3 of 5</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: '0.35rem 0 0.5rem 0' }}>
              Lead Traveler & Guest Information
            </h2>
            <p style={{ color: '#64748b', marginBottom: '2rem' }}>
              We will send your ticket vouchers and trip confirmation to this contact info.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                  Full Name (as on passport/ID) *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Alexander Reed"
                  required
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                  Contact Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. alex.reed@example.com"
                  required
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                  Phone Number (with Country Code)
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="+1-555-0199"
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                  Dietary & Special Accommodation Requests
                </label>
                <input
                  type="text"
                  name="specialRequests"
                  value={formData.specialRequests}
                  onChange={handleChange}
                  placeholder="e.g. Vegetarian meal, high-floor room, quiet room"
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
              <button onClick={handlePrevStep} className="btn btn-outline" style={{ padding: '0.75rem 1.5rem' }}>
                ⬅ Back to Date
              </button>
              <button onClick={handleNextStep} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                Review Booking Summary ➜
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* STEP 4: BOOKING SUMMARY                              */}
        {/* ---------------------------------------------------- */}
        {currentStep === 4 && (
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '2.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)' }}>
            <span className="eyebrow">Step 4 of 5</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: '0.35rem 0 0.5rem 0' }}>
              Review Booking Summary
            </h2>
            <p style={{ color: '#64748b', marginBottom: '2rem' }}>
              Please verify your trip itinerary, traveler information, and itemized billing before payment.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              {/* Trip & Traveler Overview */}
              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: '0 0 1rem 0' }}>
                  {selectedPackage?.title}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: '#475569' }}>
                  <div>📍 <strong>Destination:</strong> {selectedPackage?.destination_name}</div>
                  <div>📅 <strong>Departure:</strong> {formData.travelDate}</div>
                  <div>✈️ <strong>Estimated Return:</strong> {returnDateCalc} ({durationDays} Days)</div>
                  <div>👥 <strong>Travelers:</strong> {formData.numTravelers} Guest{formData.numTravelers === 1 ? '' : 's'}</div>
                  <div>👤 <strong>Lead Guest:</strong> {formData.fullName} ({formData.email})</div>
                  {formData.specialRequests && (
                    <div>📝 <strong>Special Requests:</strong> {formData.specialRequests}</div>
                  )}
                </div>

                {/* Inclusions summary */}
                {selectedPackage?.inclusions && (
                  <div style={{ marginTop: '1.25rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#166534', textTransform: 'uppercase' }}>
                      ✅ Included Services:
                    </span>
                    <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.25rem', fontSize: '0.82rem', color: '#334155' }}>
                      {(Array.isArray(selectedPackage.inclusions) ? selectedPackage.inclusions : []).map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Itemized Cost Breakdown */}
              <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: '0 0 1rem 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                  Price Breakdown
                </h3>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem', color: '#475569' }}>
                  <span>Package Base ({formData.numTravelers} × ${effectivePrice.toLocaleString()})</span>
                  <strong>${subtotal.toLocaleString()}</strong>
                </div>

                {perPersonSavings > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem', color: '#16a34a', fontWeight: '600' }}>
                    <span>Package Discount Savings</span>
                    <strong>−${(perPersonSavings * formData.numTravelers).toLocaleString()}</strong>
                  </div>
                )}

                {formData.promoDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem', color: '#16a34a', fontWeight: '600' }}>
                    <span>Promo Coupon (TRAVEL2026)</span>
                    <strong>−${formData.promoDiscount}</strong>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem', color: '#475569' }}>
                  <span>Taxes & Tourism Fees (8%)</span>
                  <strong>${taxesAndFees.toLocaleString()}</strong>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderTop: '2px solid #f1f5f9',
                    paddingTop: '1rem',
                    marginTop: '1rem',
                    fontSize: '1.35rem',
                    fontWeight: '800',
                    color: '#0f172a',
                  }}
                >
                  <span>Total Amount</span>
                  <span style={{ color: '#0284c7' }}>${finalTotal.toLocaleString()}</span>
                </div>

                {/* Promo Code Form */}
                <form onSubmit={handleApplyPromo} style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    name="promoCode"
                    value={formData.promoCode}
                    onChange={handleChange}
                    placeholder="Coupon code (e.g. TRAVEL2026)"
                    style={{
                      flex: 1,
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                    }}
                  />
                  <button type="submit" className="btn btn-outline" style={{ padding: '0.65rem 1rem', fontSize: '0.85rem' }}>
                    Apply
                  </button>
                </form>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={handlePrevStep} className="btn btn-outline" style={{ padding: '0.75rem 1.5rem' }}>
                ⬅ Edit Traveler Info
              </button>
              <button onClick={handleNextStep} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                Proceed to Payment (${finalTotal.toLocaleString()}) ➜
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* STEP 5: PAYMENT (SAFE MOCK SIMULATION)               */}
        {/* ---------------------------------------------------- */}
        {currentStep === 5 && (
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '2.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)' }}>
            <span className="eyebrow">Step 5 of 5</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: '0.35rem 0 0.5rem 0' }}>
              Authorize Payment
            </h2>
            <p style={{ color: '#64748b', marginBottom: '2rem' }}>
              Total to charge: <strong style={{ color: '#0284c7', fontSize: '1.15rem' }}>${finalTotal.toLocaleString()} USD</strong>
            </p>

            {/* Payment Method Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
              {PAYMENT_METHODS.map((method) => {
                const isSelected = formData.paymentMethod === method.id;
                return (
                  <div
                    key={method.id}
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, paymentMethod: method.id }));
                      setPaymentFailureError('');
                    }}
                    style={{
                      border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '1rem',
                      cursor: 'pointer',
                      background: isSelected ? '#f0f9ff' : '#ffffff',
                      textAlign: 'center',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>{method.icon}</div>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#0f172a' }}>{method.label}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>{method.sub}</div>
                  </div>
                );
              })}
            </div>

            {/* Card Details Form */}
            {formData.paymentMethod === 'credit_card' && (
              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                    Card Number (Mock Masked Input)
                  </label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleChange}
                    placeholder="4242 •••• •••• 4242"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                      Expiration Date
                    </label>
                    <input
                      type="text"
                      name="cardExpiry"
                      value={formData.cardExpiry}
                      onChange={handleChange}
                      placeholder="MM/YY"
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                      Security CVV (Masked)
                    </label>
                    <input
                      type="password"
                      name="cardCvv"
                      value={formData.cardCvv}
                      onChange={handleChange}
                      placeholder="•••"
                      maxLength="4"
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Decline / Failure Simulation Toggle (For testing purposes) */}
            <div style={{ background: '#f1f5f9', padding: '0.85rem 1.25rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ fontSize: '0.88rem', color: '#0f172a', display: 'block' }}>🧪 Payment Simulation Mode</strong>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Simulate issuer card decline / insufficient funds</span>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0 }}>
                <input
                  type="checkbox"
                  name="simulateFailure"
                  checked={formData.simulateFailure}
                  onChange={handleChange}
                  style={{ width: '18px', height: '18px', accentColor: '#e11d48' }}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: formData.simulateFailure ? '#e11d48' : '#64748b' }}>
                  {formData.simulateFailure ? '🔴 Simulate Decline' : '🟢 Normal Success'}
                </span>
              </label>
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.82rem', color: '#64748b', marginBottom: '2rem' }}>
              🔒 256-bit Bank Grade Encrypted Payment Gateway • No sensitive card numbers or CVV are stored.
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={handlePrevStep} className="btn btn-outline" style={{ padding: '0.75rem 1.5rem' }}>
                ⬅ Back to Summary
              </button>
              <button
                onClick={handleConfirmAndPay}
                disabled={submitting}
                className="btn btn-primary"
                style={{ padding: '0.85rem 2.5rem', fontSize: '1rem', fontWeight: '800' }}
              >
                {submitting ? 'Authorizing Payment...' : `Authorize & Pay $${finalTotal.toLocaleString()}`}
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* STEP 6: CONFIRMATION (UNIQUE BOOKING ID & RECEIPT)   */}
        {/* ---------------------------------------------------- */}
        {currentStep === 6 && confirmedBooking && (
          <div style={{ background: '#ffffff', borderRadius: '24px', padding: '3rem 2.5rem', border: '1px solid #bbf7d0', boxShadow: '0 10px 40px rgba(15, 23, 42, 0.08)', textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>🎉</div>
            <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 14px', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: '700', textTransform: 'uppercase' }}>
              ● {confirmedPayment?.status || 'Completed'} • Confirmed
            </span>

            <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#0f172a', margin: '0.75rem 0 0.25rem 0' }}>
              Payment & Booking Successful!
            </h1>
            <p style={{ color: '#64748b', fontSize: '1.05rem', margin: '0 0 2rem 0' }}>
              Your reservation is officially registered. A confirmation voucher has been sent to <strong>{formData.email}</strong>.
            </p>

            {/* Visual Boarding Pass / Ticket Receipt */}
            <div
              style={{
                background: '#f8fafc',
                borderRadius: '18px',
                padding: '2rem',
                border: '1px solid #e2e8f0',
                maxWidth: '650px',
                margin: '0 auto 2.5rem auto',
                textAlign: 'left',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Unique Booking Reference</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0284c7' }}>
                    {confirmedBooking.booking_reference || confirmedBooking.bookingReference}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Transaction ID</span>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#334155' }}>
                    {confirmedPayment?.transactionId || confirmedBooking.transaction_id || 'TXN-STRIPE-CONFIRMED'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem', color: '#475569', marginBottom: '1.25rem' }}>
                <div>
                  <strong>Package:</strong> {confirmedBooking.package_title || selectedPackage?.title}
                </div>
                <div>
                  <strong>Destination:</strong> {confirmedBooking.destination_name || selectedPackage?.destination_name}
                </div>
                <div>
                  <strong>Departure Date:</strong> {confirmedBooking.travel_date || formData.travelDate}
                </div>
                <div>
                  <strong>Guests:</strong> {confirmedBooking.num_travelers || formData.numTravelers} Traveler(s)
                </div>
                <div>
                  <strong>Lead Traveler:</strong> {formData.fullName}
                </div>
                <div>
                  <strong>Payment Status:</strong> <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓ Paid (${finalTotal.toLocaleString()})</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Status: 🟢 Confirmed & Active</span>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Free cancellation prior to 48 hrs</span>
              </div>
            </div>

            {/* Action CTAs */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/my-trips?tab=bookings" className="btn btn-primary" style={{ padding: '0.85rem 2rem' }}>
                View in Booking History ➜
              </Link>
              <Link to="/my-trips?tab=payments" className="btn btn-outline" style={{ padding: '0.85rem 2rem' }}>
                View Payment Receipts
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
