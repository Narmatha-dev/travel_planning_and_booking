import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import packageService from '../services/packageService';
import bookingService from '../services/bookingService';
import paymentService from '../services/paymentService';
import DigitalReceiptModal from '../components/DigitalReceiptModal';

const PACKAGE_STEPS = [
  { step: 1, label: 'Select Package', icon: '📦' },
  { step: 2, label: 'Select Date', icon: '📅' },
  { step: 3, label: 'Traveler Details', icon: '👤' },
  { step: 4, label: 'Payment Summary', icon: '📋' },
  { step: 5, label: 'Payment', icon: '💳' },
  { step: 6, label: 'Confirmation', icon: '🎉' },
];

const CUSTOM_TRIP_STEPS = [
  { step: 1, label: 'Review Trip', icon: '🔍' },
  { step: 2, label: 'Traveler Details', icon: '👤' },
  { step: 3, label: 'Payment Summary', icon: '📋' },
  { step: 4, label: 'Payment', icon: '💳' },
  { step: 5, label: 'Confirmation', icon: '🎉' },
];

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI / QR Code', icon: '⚡', sub: 'GPay, PhonePe, Paytm, BHIM' },
  { id: 'credit_card', label: 'Credit / Debit Card', icon: '💳', sub: 'Visa, MasterCard, RuPay, Amex' },
  { id: 'netbanking', label: 'Net Banking', icon: '🏦', sub: 'SBI, HDFC, ICICI, Axis & 50+ Banks' },
  { id: 'wallet', label: 'Digital Wallets', icon: '👛', sub: 'Amazon Pay, Mobikwik, Airtel' },
];

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, selectedTransport, selectedHotel } = useAppContext();

  const isCustomTripParam = searchParams.get('customTrip') === 'true';
  const queryPackageId = searchParams.get('packageId');
  const queryDestinationId = searchParams.get('destinationId');
  const queryTravelers = parseInt(searchParams.get('travelers') || '2', 10);
  const queryDate = searchParams.get('date') || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

  // Retrieve stored active custom AI trip from localStorage if available
  const [customTripData, setCustomTripData] = useState(() => {
    try {
      const saved = localStorage.getItem('travel_active_booking_trip');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const isCustomTrip = isCustomTripParam || Boolean(customTripData);

  const [currentStep, setCurrentStep] = useState(1);
  const [availablePackages, setAvailablePackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [paymentFailureError, setPaymentFailureError] = useState('');
  const [gatewayConfig, setGatewayConfig] = useState(null);

  // Active created booking reference & receipt modal state
  const [activeBooking, setActiveBooking] = useState(null);
  const [confirmedPayment, setConfirmedPayment] = useState(null);
  const [digitalReceipt, setDigitalReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Booking Form State
  const [formData, setFormData] = useState({
    travelDate: queryDate || customTripData?.startDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    numTravelers: queryTravelers || customTripData?.travelers || 2,
    fullName: user?.full_name || user?.name || '',
    email: user?.email || '',
    phoneNumber: user?.phone_number || '+91-98765-43210',
    specialRequests: '',
    paymentMethod: 'upi',
    cardNumber: '4242 •••• •••• 4242',
    cardExpiry: '12/28',
    cardCvv: '•••',
    promoCode: '',
    promoDiscount: 0,
    simulateFailure: false,
  });

  // Load gateway configuration
  useEffect(() => {
    async function loadConfig() {
      try {
        const cfg = await paymentService.getGatewayConfig();
        setGatewayConfig(cfg);
      } catch {
        // fallback
      }
    }
    loadConfig();
  }, []);

  // Load packages if package booking mode
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        if (!isCustomTrip) {
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
        }
      } catch (err) {
        console.warn('Failed to load packages for booking wizard:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [queryPackageId, isCustomTrip]);

  // Update user profile fields if loaded
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.full_name || user.name || '',
        email: prev.email || user.email || '',
        phoneNumber: prev.phoneNumber || user.phone_number || '+91-98765-43210',
      }));
    }
  }, [user]);

  // Active transit & stay objects
  const activeTransport = customTripData?.selectedTransport || selectedTransport;
  const activeHotel = customTripData?.selectedHotel || selectedHotel;
  const activeItinerary = customTripData?.itinerary;
  const activeCurrency = customTripData?.currency || 'INR';
  const sym = activeCurrency === 'USD' ? '$' : '₹';

  // Custom trip price calculations
  const transportCost = activeTransport?.estimated_cost ? Number(activeTransport.estimated_cost) : 0;
  const stayCost = activeHotel?.approx_price_per_night
    ? Number(activeHotel.approx_price_per_night) * (customTripData?.numberOfDays || 3)
    : 2700;
  const customEstimatedTotal = activeItinerary?.totalEstimatedCost
    ? Number(activeItinerary.totalEstimatedCost)
    : (transportCost + stayCost + 3500);

  // Package mode price calculations
  const effectivePrice = selectedPackage ? Number(selectedPackage.discount_price || selectedPackage.base_price) : 1299;
  const basePrice = selectedPackage ? Number(selectedPackage.base_price) : 1499;
  const perPersonSavings = basePrice > effectivePrice ? basePrice - effectivePrice : 0;
  const subtotal = isCustomTrip ? customEstimatedTotal : effectivePrice * formData.numTravelers;
  const totalSavings = isCustomTrip ? 0 : perPersonSavings * formData.numTravelers + formData.promoDiscount;
  const taxesAndFees = Math.round(subtotal * 0.05);
  const finalTotal = Math.max(0, subtotal + taxesAndFees - formData.promoDiscount);

  // Return date calculation based on duration
  const durationDays = isCustomTrip ? (customTripData?.numberOfDays || 3) : (selectedPackage?.duration_days || 7);
  const returnDateCalc = (() => {
    if (!formData.travelDate) return '';
    const d = new Date(formData.travelDate);
    d.setDate(d.getDate() + durationDays - 1);
    return d.toISOString().split('T')[0];
  })();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setError('');
    setPaymentFailureError('');
  };

  const validateCustomStep = (step) => {
    setError('');
    setPaymentFailureError('');
    if (step === 1) {
      if (!formData.travelDate) {
        setError('Please select a valid travel date');
        return false;
      }
      const today = new Date().toISOString().split('T')[0];
      if (formData.travelDate < today) {
        setError('Departure date cannot be in the past');
        return false;
      }
    }
    if (step === 2) {
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

  const validatePackageStep = (step) => {
    setError('');
    setPaymentFailureError('');
    if (step === 1 && !selectedPackage) {
      setError('Please select a travel package to continue');
      return false;
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
    const isValid = isCustomTrip ? validateCustomStep(currentStep) : validatePackageStep(currentStep);
    if (isValid) {
      const maxSteps = isCustomTrip ? CUSTOM_TRIP_STEPS.length : PACKAGE_STEPS.length;
      setCurrentStep((prev) => Math.min(maxSteps, prev + 1));
      window.scrollTo(0, 0);
    }
  };

  const handlePrevStep = () => {
    setError('');
    setPaymentFailureError('');
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo(0, 0);
  };

  // Phase 9: Secure Order Creation & Payment Verification Flow
  const handleAuthorizeAndPay = async () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/booking');
      return;
    }

    setSubmitting(true);
    setPaymentFailed(false);
    setError('');
    setPaymentFailureError('');

    try {
      let bookingRecord = activeBooking;

      // 1. If preliminary booking record not created yet, create it now
      if (!bookingRecord) {
        setLoadingMessage('Creating booking reservation...');
        const destinationId = isCustomTrip
          ? (customTripData?.destinationId || queryDestinationId || 1)
          : (selectedPackage?.destination_id || 1);

        const destName = isCustomTrip
          ? (customTripData?.destinationName || 'Custom Destination')
          : (selectedPackage?.destination_name || 'Selected Destination');

        const bookingPayload = {
          userId: user?.id || 3,
          packageId: isCustomTrip ? null : (selectedPackage?.id || null),
          destinationId: parseInt(destinationId, 10) || 1,
          destinationName: destName,
          packageTitle: isCustomTrip ? `${destName} (${durationDays} Days AI Trip)` : selectedPackage?.title,
          featuredImageUrl: selectedPackage?.featured_image_url || 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
          bookingType: isCustomTrip ? 'custom_trip' : 'package',
          travelDate: formData.travelDate,
          returnDate: returnDateCalc,
          numTravelers: formData.numTravelers,
          totalAmount: finalTotal,
          discountAmount: totalSavings,
          finalAmount: finalTotal,
          specialRequests: formData.specialRequests,
          selectedTransport: activeTransport || null,
          selectedHotel: activeHotel || null,
          itineraryItems: activeItinerary?.itineraryItems || [],
          paymentMethod: formData.paymentMethod,
          paymentGateway: 'STRIPE',
        };

        bookingRecord = await bookingService.createBooking(bookingPayload);
        setActiveBooking(bookingRecord);
      }

      // 2. Feature 4: Create Server-Side Payment Order (Feature 16: Loading State)
      setLoadingMessage('Preparing secure payment session...');
      const orderSession = await paymentService.createPaymentOrder(bookingRecord.id, formData.paymentMethod);

      // 3. Feature 5: Verify Payment with Server-Side Verification (Feature 16: Loading State)
      setLoadingMessage('Verifying your payment with gateway...');
      const verificationResult = await paymentService.verifyPayment({
        bookingId: bookingRecord.id,
        orderId: orderSession.orderId,
        paymentId: `pay_${Date.now().toString(36)}`,
        signature: 'sandbox_verified_signature_2026',
        paymentMethod: formData.paymentMethod,
        simulateFailure: Boolean(formData.simulateFailure),
        userId: user?.id || 3,
      });

      // 4. Feature 8: Payment Success State
      setConfirmedPayment(verificationResult);
      if (verificationResult.receipt) {
        setDigitalReceipt(verificationResult.receipt);
      }
      setCurrentStep(isCustomTrip ? 5 : 6);
      window.scrollTo(0, 0);
    } catch (err) {
      // Feature 7: Payment Failure Handling
      setPaymentFailed(true);
      if (err.response?.status === 402 || formData.simulateFailure) {
        setPaymentFailureError(
          '❌ Payment was not completed: The transaction was declined by the payment gateway. Your reservation remains saved.'
        );
      } else {
        setPaymentFailureError(err.response?.data?.message || err.message || 'Payment processing failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
      setLoadingMessage('');
    }
  };

  const currentStepsList = isCustomTrip ? CUSTOM_TRIP_STEPS : PACKAGE_STEPS;
  const isFinalConfirmationStep = isCustomTrip ? currentStep === 5 : currentStep === 6;

  return (
    <section className="section page-section" style={{ paddingTop: '2rem', minHeight: '80vh' }}>
      <div className="container">
        {/* Header Hero Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%)',
            borderRadius: '24px',
            padding: '2.5rem',
            color: '#ffffff',
            marginBottom: '2rem',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.15)',
          }}
        >
          <span style={{ background: 'rgba(255,255,255,0.15)', color: '#38bdf8', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>
            {isCustomTrip ? '✨ Phase 9 • Payment Flow & Digital Receipt' : '📦 Curated Package Booking'}
          </span>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '800', margin: '0.6rem 0 0.25rem 0' }}>
            {isCustomTrip ? 'Secure Trip Booking & Payment' : 'Complete Your Travel Reservation'}
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '1rem', margin: 0 }}>
            {isCustomTrip
              ? 'Verify your selected destination, transport, accommodation, and day-wise AI schedule before payment.'
              : 'Secure your spot for curated travel packages with flexible cancellation and instant confirmation.'}
          </p>
        </div>

        {/* Step Progress Tracker */}
        {!isFinalConfirmationStep && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#ffffff',
              padding: '1.25rem 2rem',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              marginBottom: '2rem',
              overflowX: 'auto',
              gap: '1rem',
            }}
          >
            {currentStepsList.map((st) => {
              const isPast = st.step < currentStep;
              const isCurrent = st.step === currentStep;
              return (
                <div
                  key={st.step}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    opacity: isCurrent || isPast ? 1 : 0.45,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: isCurrent ? '#0284c7' : isPast ? '#22c55e' : '#f1f5f9',
                      color: isCurrent || isPast ? '#ffffff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '0.85rem',
                    }}
                  >
                    {isPast ? '✓' : st.step}
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: isCurrent ? '800' : '600', color: isCurrent ? '#0f172a' : '#64748b' }}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '2rem' }}>
            ⚠️ {error}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* CUSTOM TRIP FLOW - STEP 1: REVIEW TRIP SUMMARY       */}
        {/* ---------------------------------------------------- */}
        {isCustomTrip && currentStep === 1 && (
          <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '2.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase' }}>TRIP REVIEW</span>
                <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', margin: '0.2rem 0' }}>
                  Trip Review: {customTripData?.destinationName || 'Selected Destination'}
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                  📅 {formData.travelDate} to {returnDateCalc} ({durationDays} Days) • 👥 {formData.numTravelers} Travelers
                </p>
              </div>
              <Link to="/trip-planner" className="btn btn-outline btn-sm">
                ✏️ Edit in Trip Planner
              </Link>
            </div>

            {/* Grid of Components: Transport + Stay */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', color: '#16a34a' }}>
                  🚆 Transport Option (Phase 4)
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: '0.4rem 0 0.2rem 0' }}>
                  {activeTransport?.title || 'Standard Road Transit'}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>
                  Duration: {activeTransport?.duration_text || '2 - 3 hrs'} • Distance: {activeTransport?.distance_text || 'Nearby'}
                </p>
                <div style={{ fontWeight: '800', color: '#0284c7', fontSize: '1.05rem' }}>
                  {activeTransport?.cost_text || `${sym}${transportCost.toLocaleString()}`}
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', color: '#0284c7' }}>
                  🏨 Accommodation (Phase 7)
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: '0.4rem 0 0.2rem 0' }}>
                  {activeHotel?.name || 'Verified Recommended Stay'}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>
                  📍 {activeHotel?.distance_label || 'Central Location'} • {durationDays} Nights
                </p>
                <div style={{ fontWeight: '800', color: '#0284c7', fontSize: '1.05rem' }}>
                  {activeHotel?.price_display ? `${activeHotel.price_display} × ${durationDays} nights` : `${sym}${stayCost.toLocaleString()}`}
                </div>
              </div>
            </div>

            {/* Total Budget */}
            <div style={{ background: '#f0f9ff', border: '1.5px solid #7dd3fc', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase' }}>ESTIMATED TOTAL AMOUNT</span>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#0284c7' }}>
                    {sym}{finalTotal.toLocaleString()}
                  </div>
                  <small style={{ color: '#64748b' }}>Includes Transport + Accommodation + Taxes & Service fees</small>
                </div>
                {activeItinerary?.budgetStatus && (
                  <span style={{ background: activeItinerary.budgetStatus === 'within_budget' ? '#dcfce7' : '#fef3c7', color: activeItinerary.budgetStatus === 'within_budget' ? '#15803d' : '#b45309', padding: '6px 14px', borderRadius: '9999px', fontWeight: '800', fontSize: '0.85rem' }}>
                    {activeItinerary.budgetStatus === 'within_budget' ? '✓ Within Target Budget' : '⚠️ Over Target Budget'}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <Link to="/trip-planner" className="btn btn-outline" style={{ padding: '0.8rem 1.75rem' }}>
                ⬅ Back to Planner
              </Link>
              <button
                type="button"
                onClick={handleNextStep}
                className="btn btn-primary"
                style={{ padding: '0.85rem 2.5rem', fontWeight: '800', fontSize: '1rem' }}
              >
                Continue to Traveler Details ➔
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* CUSTOM TRIP FLOW - STEP 2: TRAVELER DETAILS          */}
        {/* ---------------------------------------------------- */}
        {isCustomTrip && currentStep === 2 && (
          <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '2.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.35rem' }}>
              Lead Traveler & Guest Information
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Your booking confirmation and digital receipts will be registered under these contact details.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '1rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. john@example.com"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '1rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="+91-98765-43210"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '1rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                  Travelers Count
                </label>
                <input
                  type="number"
                  name="numTravelers"
                  min="1"
                  max="14"
                  value={formData.numTravelers}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '1rem' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                Special Requests & Notes (Optional)
              </label>
              <textarea
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleChange}
                rows="3"
                placeholder="e.g. Vegetarian meal preference, early check-in requested..."
                style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={handlePrevStep} className="btn btn-outline" style={{ padding: '0.8rem 1.75rem' }}>
                ⬅ Back to Review
              </button>
              <button onClick={handleNextStep} className="btn btn-primary" style={{ padding: '0.85rem 2.5rem', fontWeight: '800' }}>
                Continue to Payment Summary ➔
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* STEP 3: FEATURE 1 — PAYMENT SUMMARY                  */}
        {/* ---------------------------------------------------- */}
        {((isCustomTrip && currentStep === 3) || (!isCustomTrip && currentStep === 4)) && (
          <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '2.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              FEATURE 1 • PAYMENT SUMMARY
            </span>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#0f172a', margin: '0.3rem 0 0.5rem 0' }}>
              Payment Summary
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '2rem' }}>
              Review the finalized booking amount before initiating secure payment checkout.
            </p>

            <div
              style={{
                background: '#f8fafc',
                borderRadius: '16px',
                border: '1.5px solid #e2e8f0',
                padding: '2rem',
                maxWidth: '650px',
                marginBottom: '2rem',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', fontSize: '0.95rem', color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Destination</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>
                    {customTripData?.destinationName || selectedPackage?.destination_name || 'Selected Destination'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Travel Dates</span>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginTop: '0.2rem' }}>
                    {formData.travelDate} to {returnDateCalc}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Travellers</span>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginTop: '0.2rem' }}>
                    {formData.numTravelers} Traveler(s)
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Transport</span>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: '#16a34a', marginTop: '0.2rem' }}>
                    {activeTransport?.icon || '🚆'} {activeTransport?.title || 'Standard Road Transit'}
                  </div>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Stay / Accommodation</span>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: '#0284c7', marginTop: '0.2rem' }}>
                    🏨 {activeHotel?.name || 'Verified Recommended Stay'}
                  </div>
                </div>
              </div>

              {/* Total Summary Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Total Amount</span>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#0284c7' }}>
                    {sym}{finalTotal.toLocaleString()}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="btn btn-primary"
                  style={{ padding: '0.9rem 2.5rem', fontWeight: '900', fontSize: '1.05rem', background: '#0284c7' }}
                >
                  Proceed to Payment ➔
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button onClick={handlePrevStep} className="btn btn-outline" style={{ padding: '0.75rem 1.5rem' }}>
                ⬅ Back
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* STEP 4: FEATURE 3 & 4 — PAYMENT CHECKOUT             */}
        {/* ---------------------------------------------------- */}
        {((isCustomTrip && currentStep === 4) || (!isCustomTrip && currentStep === 5)) && (
          <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '2.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              FEATURE 3 • SELECT PAYMENT METHOD
            </span>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', margin: '0.3rem 0 0.5rem 0' }}>
              Choose Payment Method
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '2rem' }}>
              Total Payable: <strong style={{ color: '#0284c7', fontSize: '1.15rem' }}>{sym}{finalTotal.toLocaleString()}</strong>
            </p>

            {/* Payment Method Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {PAYMENT_METHODS.map((pm) => {
                const isSelected = formData.paymentMethod === pm.id;
                return (
                  <div
                    key={pm.id}
                    onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: pm.id }))}
                    style={{
                      border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      borderRadius: '14px',
                      padding: '1.25rem',
                      background: isSelected ? '#f0f9ff' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{pm.icon}</div>
                    <div style={{ fontWeight: '800', color: '#0f172a' }}>{pm.label}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{pm.sub}</div>
                  </div>
                );
              })}
            </div>

            {/* Feature 7: Payment Failure Alert Box */}
            {paymentFailureError && (
              <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', padding: '1.25rem', borderRadius: '14px', marginBottom: '2rem' }}>
                <strong style={{ color: '#b91c1c', display: 'block', fontSize: '0.95rem', marginBottom: '0.35rem' }}>
                  {paymentFailureError}
                </strong>
                <p style={{ color: '#991b1b', fontSize: '0.85rem', margin: 0 }}>
                  You can click <strong>Try Again</strong> below to re-attempt payment with another method or uncheck simulation.
                </p>
              </div>
            )}

            {/* Payment Simulation Mode Toggle */}
            <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <strong style={{ fontSize: '0.88rem', color: '#0f172a', display: 'block' }}>🧪 Gateway Testing & Simulation Mode</strong>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Toggle to test payment failure / issuer decline handling</span>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0 }}>
                <input
                  type="checkbox"
                  name="simulateFailure"
                  checked={formData.simulateFailure}
                  onChange={handleChange}
                  style={{ width: '18px', height: '18px', accentColor: '#e11d48' }}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: '800', color: formData.simulateFailure ? '#e11d48' : '#16a34a' }}>
                  {formData.simulateFailure ? '🔴 Simulate Decline' : '🟢 Normal Success'}
                </span>
              </label>
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.82rem', color: '#64748b', marginBottom: '2rem' }}>
              🔒 256-bit Bank Grade Encrypted Payment Gateway • Free cancellation prior to 48 hours.
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <button onClick={handlePrevStep} className="btn btn-outline" style={{ padding: '0.8rem 1.75rem' }}>
                ⬅ Back to Summary
              </button>

              <button
                onClick={handleAuthorizeAndPay}
                disabled={submitting}
                className="btn btn-primary"
                style={{ padding: '0.9rem 2.75rem', fontWeight: '900', fontSize: '1.05rem', background: '#0284c7' }}
              >
                {submitting ? (
                  <span>⏳ {loadingMessage || 'Authorizing Payment...'}</span>
                ) : paymentFailed ? (
                  <span>🔄 Try Again ({sym}{finalTotal.toLocaleString()})</span>
                ) : (
                  <span>Authorize & Pay {sym}{finalTotal.toLocaleString()} ➔</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* STEP 5: FEATURE 8 — PAYMENT SUCCESS & CONFIRMATION   */}
        {/* ---------------------------------------------------- */}
        {isFinalConfirmationStep && (
          <div style={{ background: '#ffffff', borderRadius: '24px', padding: '3rem 2.5rem', border: '1px solid #bbf7d0', boxShadow: '0 10px 40px rgba(15, 23, 42, 0.08)', textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>🎉</div>
            <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 14px', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: '800', textTransform: 'uppercase' }}>
              ● PAID & CONFIRMED
            </span>

            <h1 style={{ fontSize: '2.4rem', fontWeight: '900', color: '#0f172a', margin: '0.75rem 0 0.25rem 0' }}>
              🎉 Payment Successful!
            </h1>
            <p style={{ color: '#64748b', fontSize: '1.05rem', margin: '0 0 2.5rem 0' }}>
              Your reservation has been verified and confirmed. A digital receipt has been generated.
            </p>

            {/* Visual Boarding Pass / Ticket Receipt */}
            <div
              style={{
                background: '#f8fafc',
                borderRadius: '18px',
                padding: '2rem',
                border: '1.5px solid #e2e8f0',
                maxWidth: '650px',
                margin: '0 auto 2.5rem auto',
                textAlign: 'left',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Booking ID</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0284c7' }}>
                    {confirmedPayment?.bookingReference || activeBooking?.booking_reference || 'BK-2026-CONFIRMED'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Payment ID</span>
                  <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#16a34a' }}>
                    {confirmedPayment?.transactionId || 'TXN-ST-CONFIRMED'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', fontSize: '0.92rem', color: '#475569', marginBottom: '1.5rem' }}>
                <div>
                  <strong>📍 Destination:</strong> {customTripData?.destinationName || selectedPackage?.destination_name || 'Selected Destination'}
                </div>
                <div>
                  <strong>📅 Travel Date:</strong> {formData.travelDate}
                </div>
                <div>
                  <strong>👥 Travellers:</strong> {formData.numTravelers} Guest(s)
                </div>
                <div>
                  <strong>🚆 Transport:</strong> {activeTransport?.title || 'Standard Road Transit'}
                </div>
                <div>
                  <strong>🏨 Stay:</strong> {activeHotel?.name || 'Verified Recommended Stay'}
                </div>
                <div>
                  <strong>💰 Amount Paid:</strong> <span style={{ color: '#0284c7', fontWeight: '900' }}>{sym}{finalTotal.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: '800' }}>Status: ✅ Paid</span>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Free cancellation prior to 48 hrs</span>
              </div>
            </div>

            {/* Action CTAs */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setShowReceiptModal(true)}
                className="btn btn-primary"
                style={{ padding: '0.85rem 2.25rem', fontWeight: '800', background: '#0284c7' }}
              >
                🧾 View Digital Receipt
              </button>
              <Link to="/my-trips?tab=upcoming" className="btn btn-outline" style={{ padding: '0.85rem 2.25rem', fontWeight: '700' }}>
                ✈️ View My Trip
              </Link>
              <Link to="/" className="btn btn-outline" style={{ padding: '0.85rem 2.25rem', fontWeight: '700' }}>
                🏠 Back to Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* Digital Receipt Modal (Phase 9) */}
        <DigitalReceiptModal
          receipt={digitalReceipt}
          identifier={confirmedPayment?.bookingReference || activeBooking?.booking_reference}
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
        />
      </div>
    </section>
  );
}
