import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import packageService from '../services/packageService';
import bookingService from '../services/bookingService';
import paymentService from '../services/paymentService';

const PACKAGE_STEPS = [
  { step: 1, label: 'Select Package', icon: '📦' },
  { step: 2, label: 'Select Date', icon: '📅' },
  { step: 3, label: 'Traveler Details', icon: '👤' },
  { step: 4, label: 'Booking Summary', icon: '📋' },
  { step: 5, label: 'Payment', icon: '💳' },
  { step: 6, label: 'Confirmation', icon: '🎉' },
];

const CUSTOM_TRIP_STEPS = [
  { step: 1, label: 'Review Trip', icon: '🔍' },
  { step: 2, label: 'Traveler Details', icon: '👤' },
  { step: 3, label: 'Confirm & Book', icon: '💳' },
  { step: 4, label: 'Confirmation', icon: '🎉' },
];

const PAYMENT_METHODS = [
  { id: 'credit_card', label: 'Credit / Debit Card', icon: '💳', sub: 'Visa, MasterCard, RuPay' },
  { id: 'upi', label: 'UPI / NetBanking', icon: '⚡', sub: 'Instant Online Transfer' },
  { id: 'paypal', label: 'PayPal', icon: '🅿️', sub: 'Fast & Secure Checkout' },
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
  const [error, setError] = useState('');
  const [paymentFailureError, setPaymentFailureError] = useState('');

  // Booking Form State
  const [formData, setFormData] = useState({
    travelDate: queryDate || customTripData?.startDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    numTravelers: queryTravelers || customTripData?.travelers || 2,
    fullName: user?.full_name || user?.name || '',
    email: user?.email || '',
    phoneNumber: user?.phone_number || '+91-98765-43210',
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

  // Active transit & stay objects (prioritizing customTripData, then context)
  const activeTransport = customTripData?.selectedTransport || selectedTransport;
  const activeHotel = customTripData?.selectedHotel || selectedHotel;
  const activeItinerary = customTripData?.itinerary;
  const activeCurrency = customTripData?.currency || 'INR';
  const sym = activeCurrency === 'USD' ? '$' : '₹';

  // Custom trip price calculations
  const transportCost = activeTransport?.estimated_cost ? Number(activeTransport.estimated_cost) : 0;
  const stayCost = activeHotel?.approx_price_per_night
    ? Number(activeHotel.approx_price_per_night) * (customTripData?.numberOfDays || 3)
    : (activeCurrency === 'USD' ? 150 : 2700);
  const customEstimatedTotal = activeItinerary?.totalEstimatedCost
    ? Number(activeItinerary.totalEstimatedCost)
    : (transportCost + stayCost + (activeCurrency === 'USD' ? 200 : 3500));

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

  const handleTravelersChange = (delta) => {
    setFormData((prev) => {
      const nextCount = Math.max(1, Math.min(selectedPackage?.max_group_size || 14, prev.numTravelers + delta));
      return { ...prev, numTravelers: nextCount };
    });
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

  // Phase 8: Confirm Booking & API Submission
  const handleConfirmBooking = async () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/booking');
      return;
    }

    setSubmitting(true);
    setError('');
    setPaymentFailureError('');

    try {
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
        paymentGateway: formData.paymentMethod === 'paypal' ? 'PayPal' : 'Stripe',
      };

      const bookingResult = await bookingService.createBooking(bookingPayload);

      // Process payment record via paymentService
      const paymentPayload = {
        bookingId: bookingResult.id,
        userId: user?.id || 3,
        amount: finalTotal,
        currency: activeCurrency,
        paymentMethod: formData.paymentMethod,
        paymentGateway: formData.paymentMethod === 'paypal' ? 'PayPal' : 'Stripe',
        simulateFailure: Boolean(formData.simulateFailure),
        cardBrand: 'Visa',
        cardLast4: formData.cardNumber.replace(/\D/g, '').slice(-4) || '4242',
        destinationName: destName,
        packageTitle: bookingPayload.packageTitle,
      };

      const paymentResult = await paymentService.processPayment(paymentPayload);

      setConfirmedBooking(bookingResult);
      setConfirmedPayment(paymentResult);
      setCurrentStep(isCustomTrip ? 4 : 6);
      window.scrollTo(0, 0);
    } catch (err) {
      if (err.response?.status === 402 || formData.simulateFailure) {
        setPaymentFailureError(
          '❌ Payment Authorization Declined: The transaction was declined by the issuer. Please verify your details or retry.'
        );
      } else {
        setError(err.response?.data?.message || err.message || 'Booking confirmation failed. Please check your details.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const currentStepsList = isCustomTrip ? CUSTOM_TRIP_STEPS : PACKAGE_STEPS;
  const isFinalConfirmationStep = isCustomTrip ? currentStep === 4 : currentStep === 6;

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
            {isCustomTrip ? '✨ Phase 8 • Trip Booking & Reservation' : '📦 Curated Package Booking'}
          </span>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '800', margin: '0.6rem 0 0.25rem 0' }}>
            {isCustomTrip ? 'Review & Confirm Your Trip Booking' : 'Complete Your Travel Reservation'}
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '1rem', margin: 0 }}>
            {isCustomTrip
              ? 'Verify your selected destination, transport, accommodation, and day-wise AI schedule before confirming.'
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
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase' }}>FEATURE 1 • COMPLETE TRIP REVIEW</span>
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

            {/* Grid of Components: Transport + Stay + Budget */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              {/* Transport Card */}
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

              {/* Stay Card */}
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

            {/* AI Itinerary Schedule Highlights */}
            {activeItinerary?.days && activeItinerary.days.length > 0 && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.5rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>
                  📅 AI Itinerary Schedule Highlights
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {activeItinerary.days.slice(0, 3).map((d, dIdx) => (
                    <div key={dIdx} style={{ background: '#ffffff', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <strong>Day {d.day}:</strong> {d.theme}
                      <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.2rem' }}>
                        🌅 Morning: {d.activities?.[0]?.placeName} • 🍛 Lunch: {d.foodSuggestions?.lunch?.dish} • 🌆 Evening: {d.activities?.[2]?.placeName || 'Sunset leisure'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Budget Breakdown & User Budget Comparison */}
            <div style={{ background: '#f0f9ff', border: '1.5px solid #7dd3fc', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase' }}>ESTIMATED TOTAL BUDGET</span>
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
              Your booking confirmation and itinerary vouchers will be registered under these contact details.
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
                placeholder="e.g. Vegetarian meal preference, early check-in requested, high floor stay..."
                style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={handlePrevStep} className="btn btn-outline" style={{ padding: '0.8rem 1.75rem' }}>
                ⬅ Back to Review
              </button>
              <button onClick={handleNextStep} className="btn btn-primary" style={{ padding: '0.85rem 2.5rem', fontWeight: '800' }}>
                Continue to Payment ➔
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* CUSTOM TRIP FLOW - STEP 3: PAYMENT & CONFIRMATION    */}
        {/* ---------------------------------------------------- */}
        {isCustomTrip && currentStep === 3 && (
          <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '2.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.35rem' }}>
              Select Payment Method & Confirm Trip
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Total Estimated Amount: <strong style={{ color: '#0284c7', fontSize: '1.1rem' }}>{sym}{finalTotal.toLocaleString()}</strong>
            </p>

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

            <div style={{ textAlign: 'center', fontSize: '0.82rem', color: '#64748b', marginBottom: '2rem' }}>
              🔒 256-bit Bank Grade Encrypted Gateway • Free cancellation prior to 48 hours.
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={handlePrevStep} className="btn btn-outline" style={{ padding: '0.8rem 1.75rem' }}>
                ⬅ Back to Traveler Details
              </button>
              <button
                onClick={handleConfirmBooking}
                disabled={submitting}
                className="btn btn-primary"
                style={{ padding: '0.9rem 2.75rem', fontWeight: '800', fontSize: '1.05rem', background: '#0284c7' }}
              >
                {submitting ? 'Confirming your trip... Please wait...' : `Confirm & Book Trip (${sym}${finalTotal.toLocaleString()})`}
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* STEP 4/6: CONFIRMATION RECEIPT (FEATURE 6)           */}
        {/* ---------------------------------------------------- */}
        {isFinalConfirmationStep && confirmedBooking && (
          <div style={{ background: '#ffffff', borderRadius: '24px', padding: '3rem 2.5rem', border: '1px solid #bbf7d0', boxShadow: '0 10px 40px rgba(15, 23, 42, 0.08)', textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>🎉</div>
            <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 14px', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: '700', textTransform: 'uppercase' }}>
              ● {confirmedBooking.status || 'Confirmed'}
            </span>

            <h1 style={{ fontSize: '2.4rem', fontWeight: '900', color: '#0f172a', margin: '0.75rem 0 0.25rem 0' }}>
              🎉 TRIP BOOKED SUCCESSFULLY!
            </h1>
            <p style={{ color: '#64748b', fontSize: '1.05rem', margin: '0 0 2.5rem 0' }}>
              Your reservation is officially registered in Travelora. A copy of your travel voucher is saved in <strong>My Trips</strong>.
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
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Booking Reference</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0284c7' }}>
                    {confirmedBooking.booking_reference || confirmedBooking.bookingReference}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Status</span>
                  <div style={{ fontSize: '1rem', fontWeight: '800', color: '#16a34a' }}>
                    ✅ Confirmed
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', fontSize: '0.92rem', color: '#475569', marginBottom: '1.5rem' }}>
                <div>
                  <strong>📍 Destination:</strong> {confirmedBooking.destination_name || customTripData?.destinationName || selectedPackage?.destination_name}
                </div>
                <div>
                  <strong>📅 Travel Date:</strong> {confirmedBooking.travel_date || formData.travelDate}
                </div>
                <div>
                  <strong>👥 Travellers:</strong> {confirmedBooking.num_travelers || formData.numTravelers} Guest(s)
                </div>
                <div>
                  <strong>🚆 Transport:</strong> {confirmedBooking.selected_transport?.title || activeTransport?.title || 'Standard Road Transit'}
                </div>
                <div>
                  <strong>🏨 Stay:</strong> {confirmedBooking.selected_hotel?.name || activeHotel?.name || 'Verified Recommended Stay'}
                </div>
                <div>
                  <strong>💰 Estimated Total:</strong> <span style={{ color: '#0284c7', fontWeight: '800' }}>{sym}{finalTotal.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: '700' }}>Status: 🟢 Confirmed & Active</span>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Free cancellation prior to 48 hrs</span>
              </div>
            </div>

            {/* Action CTAs */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/my-trips?tab=upcoming" className="btn btn-primary" style={{ padding: '0.85rem 2.25rem', fontWeight: '800' }}>
                ✈️ View My Trip
              </Link>
              <Link to="/" className="btn btn-outline" style={{ padding: '0.85rem 2.25rem', fontWeight: '700' }}>
                🏠 Back to Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
