import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import packageService from '../services/packageService';
import bookingService from '../services/bookingService';
import paymentService from '../services/paymentService';
import DigitalReceiptModal from '../components/DigitalReceiptModal';
import PaymentAuthenticationModal from '../components/PaymentAuthenticationModal';
import { exportBillToPdf } from '../utils/pdfExport';

const PACKAGE_STEPS = [
  { step: 1, label: 'Select Package', icon: '📦' },
  { step: 2, label: 'Travel Dates', icon: '📅' },
  { step: 3, label: 'Traveler Details', icon: '👤' },
  { step: 4, label: 'Booking Summary', icon: '📋' },
  { step: 5, label: 'Payment Checkout', icon: '💳' },
  { step: 6, label: 'Confirmation', icon: '🎉' },
];

const CUSTOM_TRIP_STEPS = [
  { step: 1, label: 'Trip Details', icon: '🔍' },
  { step: 2, label: 'Traveler Details', icon: '👤' },
  { step: 3, label: 'Booking Summary', icon: '📋' },
  { step: 4, label: 'Payment Checkout', icon: '💳' },
  { step: 5, label: 'Confirmation', icon: '🎉' },
];

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI / QR Code', icon: '⚡', sub: 'Google Pay, PhonePe, Paytm, QR' },
  { id: 'credit_card', label: 'Credit / Debit Card', icon: '💳', sub: 'Visa, MasterCard, RuPay, Amex' },
  { id: 'netbanking', label: 'Net Banking', icon: '🏦', sub: 'SBI, HDFC, ICICI, Axis & 50+ Banks' },
  { id: 'wallet', label: 'Digital Wallets', icon: '👛', sub: 'Amazon Pay, Paytm, Mobikwik' },
];

const UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', handle: '@okhdfcbank', icon: '🔵', color: '#1a73e8', bg: '#e8f0fe', desc: 'Instant approval via Google Pay App' },
  { id: 'phonepe', name: 'PhonePe', handle: '@ybl', icon: '🟣', color: '#5f259f', bg: '#f3e8ff', desc: 'Pay via PhonePe UPI / Wallet' },
  { id: 'paytm', name: 'Paytm UPI', handle: '@paytm', icon: '🔷', color: '#00b9f1', bg: '#e0f7ff', desc: 'Direct bank debit via Paytm' },
  { id: 'bhim', name: 'BHIM UPI', handle: '@upi', icon: '🟠', color: '#f37920', bg: '#fff7ed', desc: 'Government NPCI UPI Gateway' },
  { id: 'qr', name: 'Scan & Pay (QR)', handle: '', icon: '📲', color: '#0f766e', bg: '#ccfbf1', desc: 'Scan dynamic QR with any UPI App' },
];

const NETBANKING_BANKS = [
  { id: 'HDFC', name: 'HDFC Bank', icon: '🏦', popular: true },
  { id: 'SBI', name: 'State Bank of India', icon: '🏛️', popular: true },
  { id: 'ICICI', name: 'ICICI Bank', icon: '🏢', popular: true },
  { id: 'AXIS', name: 'Axis Bank', icon: '🏦', popular: true },
  { id: 'KOTAK', name: 'Kotak Mahindra', icon: '🏛️', popular: true },
  { id: 'PNB', name: 'Punjab National Bank', icon: '🏢', popular: true },
];

const WALLETS = [
  { id: 'amazon_pay', name: 'Amazon Pay Balance', icon: '🛒', desc: 'Instant 1-Click checkout' },
  { id: 'paytm_wallet', name: 'Paytm Wallet', icon: '🔷', desc: 'Fast digital wallet payment' },
  { id: 'mobikwik', name: 'MobiKwik Wallet', icon: '🔴', desc: 'SuperCash & ZIP enabled' },
  { id: 'airtel_money', name: 'Airtel Money', icon: '📱', desc: 'Airtel Payments Bank' },
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

  // Real-time Sub-payment Methods State
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay');
  const [upiId, setUpiId] = useState('alex@okhdfcbank');
  const [isUpiVerified, setIsUpiVerified] = useState(true);
  const [verifyingUpi, setVerifyingUpi] = useState(false);
  const [selectedBank, setSelectedBank] = useState('HDFC');
  const [selectedWallet, setSelectedWallet] = useState('amazon_pay');
  const [qrCountdown, setQrCountdown] = useState(298);
  const [realtimePaymentStage, setRealtimePaymentStage] = useState(0); // 0: Idle, 1: Request dispatched, 2: PIN approval, 3: Bank verification, 4: Success

  // Active created booking reference & receipt modal state
  const [activeBooking, setActiveBooking] = useState(null);
  const [confirmedPayment, setConfirmedPayment] = useState(null);
  const [digitalReceipt, setDigitalReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [postPaymentView, setPostPaymentView] = useState('success'); // 'success' | 'bill'

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

  // Dynamic QR Code Countdown Timer
  useEffect(() => {
    let timer;
    if (formData.paymentMethod === 'upi' && selectedUpiApp === 'qr') {
      timer = setInterval(() => {
        setQrCountdown((prev) => (prev > 0 ? prev - 1 : 300));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [formData.paymentMethod, selectedUpiApp]);

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
      if (user.email && !upiId.includes('@')) {
        const handle = user.email.split('@')[0] || 'alex';
        setUpiId(`${handle}@okhdfcbank`);
      }
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

  const handleVerifyUpiId = () => {
    if (!upiId || !upiId.includes('@')) {
      setError('Please enter a valid UPI ID (e.g. name@okhdfcbank)');
      return;
    }
    setVerifyingUpi(true);
    setTimeout(() => {
      setVerifyingUpi(false);
      setIsUpiVerified(true);
      setError('');
    }, 600);
  };

  const handleUpiAppSelect = (app) => {
    setSelectedUpiApp(app.id);
    if (app.handle) {
      const userPrefix = upiId ? upiId.split('@')[0] : (formData.email ? formData.email.split('@')[0] : 'alex');
      setUpiId(`${userPrefix}${app.handle}`);
    }
    setIsUpiVerified(true);
    setPaymentFailureError('');
    setPaymentFailed(false);
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  // Step 1 of Checkout: Initiate 3D Secure / UPI PIN Authentication Modal
  const handleStartPaymentAuth = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/booking');
      return;
    }
    setError('');
    setPaymentFailureError('');

    if (formData.paymentMethod === 'upi' && selectedUpiApp !== 'qr' && !upiId) {
      setError('Please enter a valid UPI ID (e.g. name@okhdfcbank)');
      return;
    }
    setShowAuthModal(true);
  };

  // Phase 9: Secure Order Creation & Real-Time Payment Verification Flow
  const handleAuthorizeAndPay = async (authPayload = {}) => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/booking');
      return;
    }
    setSubmitting(true);
    setPaymentFailed(false);
    setError('');
    setPaymentFailureError('');
    setRealtimePaymentStage(1);

    try {
      let bookingRecord = activeBooking;

      // 1. If preliminary booking record not created yet or was cancelled, create a new fresh reservation
      if (!bookingRecord || bookingRecord.status === 'cancelled') {
        setLoadingMessage('Creating booking reservation...');
        const destinationId = isCustomTrip
          ? (customTripData?.destinationId || queryDestinationId || 1)
          : (selectedPackage?.destination_id || 1);

        const destName = isCustomTrip
          ? (customTripData?.destinationName || 'Custom Destination')
          : (selectedPackage?.destination_name || 'Selected Destination');

        const activeSubMethod = formData.paymentMethod === 'upi' ? `upi_${selectedUpiApp}` : formData.paymentMethod;

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
          paymentMethod: activeSubMethod,
          paymentGateway: 'RAZORPAY',
        };

        bookingRecord = await bookingService.createBooking(bookingPayload);
        setActiveBooking(bookingRecord);
      }

      // 2. Feature 4: Create Server-Side Payment Order (Real-time Step 1)
      setRealtimePaymentStage(2);
      setLoadingMessage('Generating secure Razorpay payment order...');

      const activeSubMethod = formData.paymentMethod === 'upi' ? `upi_${selectedUpiApp}` : formData.paymentMethod;
      const orderSession = await paymentService.createPaymentOrder(bookingRecord.id, activeSubMethod);

      // Load official Razorpay Checkout SDK
      const isScriptLoaded = await paymentService.loadRazorpayScript();

      if (isScriptLoaded && typeof window !== 'undefined' && window.Razorpay && !formData.simulateFailure) {
        setShowAuthModal(false);
        setSubmitting(false);

        const options = {
          key: orderSession.keyId || 'rzp_test_travelora_2026',
          amount: Math.round((orderSession.amount || finalTotal) * 100),
          currency: orderSession.currency || 'INR',
          name: 'Travelora',
          description: `Booking #${bookingRecord.booking_reference || bookingRecord.id} - ${bookingRecord.destination_name || 'Trip'}`,
          image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=128',
          order_id: orderSession.orderId && orderSession.orderId.startsWith('order_') ? orderSession.orderId : undefined,
          prefill: {
            name: formData.fullName || user?.full_name || 'Traveler',
            email: formData.email || user?.email || 'traveler@example.com',
            contact: formData.phoneNumber || user?.phone_number || '',
          },
          notes: {
            bookingId: String(bookingRecord.id),
            bookingReference: bookingRecord.booking_reference || '',
          },
          theme: {
            color: '#BE5985',
          },
          handler: async function (response) {
            try {
              setSubmitting(true);
              setRealtimePaymentStage(3);
              setLoadingMessage('Verifying Razorpay payment signature with server...');

              const verificationResult = await paymentService.verifyPayment({
                bookingId: bookingRecord.id,
                razorpay_order_id: response.razorpay_order_id || orderSession.orderId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                paymentMethod: 'razorpay',
                userId: user?.id,
              });

              setConfirmedPayment(verificationResult);
              if (verificationResult.receipt) {
                setDigitalReceipt(verificationResult.receipt);
              }
              setRealtimePaymentStage(4);
              setCurrentStep(isCustomTrip ? 5 : 6);
              window.scrollTo(0, 0);
            } catch (err) {
              setPaymentFailed(true);
              setPaymentFailureError(err.response?.data?.message || err.message || 'Payment signature verification failed.');
            } finally {
              setSubmitting(false);
              setLoadingMessage('');
            }
          },
          modal: {
            ondismiss: function () {
              setSubmitting(false);
              setLoadingMessage('');
              setPaymentFailed(true);
              setPaymentFailureError('Payment was cancelled. Your booking reservation remains saved in pending status. Click Try Again to retry payment.');
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          setPaymentFailed(true);
          setPaymentFailureError(`Payment failed: ${resp.error?.description || 'Transaction could not be completed.'}`);
          setSubmitting(false);
          setLoadingMessage('');
        });
        rzp.open();
        return;
      }

      // 3. Fallback verification for test simulation environments
      setRealtimePaymentStage(3);
      setLoadingMessage('Verifying payment signature with server...');
      await new Promise((resolve) => setTimeout(resolve, 600));

      const verificationResult = await paymentService.verifyPayment({
        bookingId: bookingRecord.id,
        orderId: orderSession.orderId,
        paymentId: `pay_${Date.now().toString(36)}`,
        signature: 'sandbox_verified_signature_2026',
        paymentMethod: activeSubMethod,
        simulateFailure: Boolean(formData.simulateFailure),
        userId: user?.id || 3,
        authMeta: authPayload,
      });

      // 4. Feature 8: Payment Success State
      setShowAuthModal(false);
      setConfirmedPayment(verificationResult);
      if (verificationResult.receipt) {
        setDigitalReceipt(verificationResult.receipt);
      }
      setRealtimePaymentStage(4);
      setCurrentStep(isCustomTrip ? 5 : 6);
      window.scrollTo(0, 0);
    } catch (err) {
      setShowAuthModal(false);
      setPaymentFailed(true);
      setRealtimePaymentStage(0);
      if (err.response?.status === 402 || formData.simulateFailure) {
        setPaymentFailureError(
          '❌ Payment was declined: The transaction was not authorized by your bank. Your booking is saved in pending state.'
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
            background: 'linear-gradient(135deg, #BE5985 0%, #EC7FA9 60%, #FFB8E0 100%)',
            borderRadius: '24px',
            padding: '2.5rem',
            color: '#ffffff',
            marginBottom: '2rem',
            boxShadow: '0 12px 32px -4px rgba(190, 89, 133, 0.25)',
          }}
        >
          <span style={{ background: 'rgba(255,255,255,0.25)', color: '#ffffff', padding: '4px 14px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', backdropFilter: 'blur(4px)' }}>
            {isCustomTrip ? '✨ Real-time Payment & Digital Receipt' : '📦 Curated Package Booking'}
          </span>
          <h1 style={{ fontSize: '2.3rem', fontWeight: '900', margin: '0.6rem 0 0.35rem 0', color: '#ffffff' }}>
            {isCustomTrip ? 'Secure Trip Booking & Real-Time Payment' : 'Complete Your Travel Reservation'}
          </h1>
          <p style={{ color: '#FFF5FB', fontSize: '1.02rem', margin: 0, opacity: 0.95 }}>
            {isCustomTrip
              ? 'Verify your selected destination, transport, accommodation, and day-wise AI schedule before instant payment.'
              : 'Secure your spot for curated travel packages with flexible cancellation and instant UPI confirmation.'}
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
              borderRadius: '20px',
              border: '1.5px solid #F3D2E5',
              boxShadow: '0 8px 24px -4px rgba(190, 89, 133, 0.06)',
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
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: isCurrent ? '#EC7FA9' : isPast ? '#BE5985' : '#FFF5FB',
                      color: isCurrent || isPast ? '#ffffff' : '#BE5985',
                      border: isPast || isCurrent ? 'none' : '1px solid #F3D2E5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '900',
                      fontSize: '0.88rem',
                      boxShadow: isCurrent ? '0 3px 10px rgba(236, 127, 169, 0.4)' : 'none',
                    }}
                  >
                    {isPast ? '✓' : st.step}
                  </div>
                  <span style={{ fontSize: '0.92rem', fontWeight: isCurrent ? '900' : '700', color: isCurrent ? '#BE5985' : '#7A5366' }}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div style={{ background: '#fee2e2', border: '1.5px solid #fecdd3', color: '#991b1b', padding: '1rem 1.25rem', borderRadius: '16px', marginBottom: '2rem', fontWeight: '700' }}>
            ⚠️ {error}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* CUSTOM TRIP FLOW - STEP 1: REVIEW TRIP SUMMARY       */}
        {/* ---------------------------------------------------- */}
        {isCustomTrip && currentStep === 1 && (
          <div style={{ background: '#ffffff', borderRadius: '24px', border: '1.5px solid #F3D2E5', padding: '2.5rem', boxShadow: '0 8px 30px rgba(190, 89, 133, 0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #F3D2E5', paddingBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#BE5985', textTransform: 'uppercase' }}>TRIP REVIEW</span>
                <h2 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#BE5985', margin: '0.2rem 0' }}>
                  Trip Review: {customTripData?.destinationName || 'Selected Destination'}
                </h2>
                <p style={{ color: '#7A5366', fontSize: '0.9rem', margin: 0 }}>
                  📅 {formData.travelDate} to {returnDateCalc} ({durationDays} Days) • 👥 {formData.numTravelers} Travelers
                </p>
              </div>
              <Link to="/trip-planner" className="btn btn-secondary btn-sm" style={{ fontWeight: '800' }}>
                ✏️ Edit in Trip Planner
              </Link>
            </div>

            {/* Grid of Components: Transport + Stay */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ background: '#FFF5FB', border: '1.5px solid #F3D2E5', borderRadius: '18px', padding: '1.25rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', color: '#BE5985' }}>
                  🚆 Transport Option
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#2D1520', margin: '0.4rem 0 0.2rem 0' }}>
                  {activeTransport?.title || 'Standard Road Transit'}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#7A5366', margin: '0 0 0.5rem 0' }}>
                  Duration: {activeTransport?.duration_text || '2 - 3 hrs'} • Distance: {activeTransport?.distance_text || 'Nearby'}
                </p>
                <div style={{ fontWeight: '900', color: '#BE5985', fontSize: '1.08rem' }}>
                  {activeTransport?.cost_text || `${sym}${transportCost.toLocaleString()}`}
                </div>
              </div>

              <div style={{ background: '#FFF5FB', border: '1.5px solid #F3D2E5', borderRadius: '18px', padding: '1.25rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', color: '#BE5985' }}>
                  🏨 Accommodation
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#2D1520', margin: '0.4rem 0 0.2rem 0' }}>
                  {activeHotel?.name || 'Verified Recommended Stay'}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#7A5366', margin: '0 0 0.5rem 0' }}>
                  📍 {activeHotel?.distance_label || 'Central Location'} • {durationDays} Nights
                </p>
                <div style={{ fontWeight: '900', color: '#BE5985', fontSize: '1.08rem' }}>
                  {activeHotel?.price_display ? `${activeHotel.price_display} × ${durationDays} nights` : `${sym}${stayCost.toLocaleString()}`}
                </div>
              </div>
            </div>

            {/* Total Budget */}
            <div style={{ background: '#FFEDFA', border: '1.5px solid #FFB8E0', borderRadius: '20px', padding: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#BE5985', textTransform: 'uppercase' }}>ESTIMATED TOTAL AMOUNT</span>
                  <div style={{ fontSize: '1.9rem', fontWeight: '900', color: '#BE5985' }}>
                    {sym}{finalTotal.toLocaleString()}
                  </div>
                  <small style={{ color: '#7A5366' }}>Includes Transport + Accommodation + Taxes & Service fees</small>
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
              <Link to="/trip-planner" className="btn btn-secondary" style={{ padding: '0.8rem 1.75rem' }}>
                ⬅ Back to Planner
              </Link>
              <button
                type="button"
                onClick={handleNextStep}
                className="btn btn-primary"
                style={{ padding: '0.85rem 2.5rem', fontWeight: '900', fontSize: '1rem' }}
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
          <div style={{ background: '#ffffff', borderRadius: '24px', border: '1.5px solid #F3D2E5', padding: '2.5rem', boxShadow: '0 8px 30px rgba(190, 89, 133, 0.08)' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#BE5985', marginBottom: '0.35rem' }}>
              Lead Traveler & Guest Information
            </h2>
            <p style={{ color: '#7A5366', fontSize: '0.95rem', marginBottom: '2rem' }}>
              Your booking confirmation and digital receipts will be registered under these contact details.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.4rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #F3D2E5', fontSize: '1rem', color: '#2D1520' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.4rem' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. john@example.com"
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #F3D2E5', fontSize: '1rem', color: '#2D1520' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.4rem' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="+91-98765-43210"
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #F3D2E5', fontSize: '1rem', color: '#2D1520' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.4rem' }}>
                  Travelers Count
                </label>
                <input
                  type="number"
                  name="numTravelers"
                  min="1"
                  max="14"
                  value={formData.numTravelers}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #F3D2E5', fontSize: '1rem', color: '#2D1520' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.4rem' }}>
                Special Requests & Notes (Optional)
              </label>
              <textarea
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleChange}
                rows="3"
                placeholder="e.g. Vegetarian meal preference, early check-in requested..."
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #F3D2E5', fontSize: '0.95rem', color: '#2D1520' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <button onClick={handlePrevStep} className="btn btn-secondary" style={{ padding: '0.8rem 1.75rem' }}>
                ⬅ Back to Review
              </button>
              <button onClick={handleNextStep} className="btn btn-primary" style={{ padding: '0.85rem 2.5rem', fontWeight: '900' }}>
                Continue to Payment Summary ➔
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* STEP 3: BOOKING SUMMARY                              */}
        {/* ---------------------------------------------------- */}
        {((isCustomTrip && currentStep === 3) || (!isCustomTrip && currentStep === 4)) && (
          <div style={{ background: '#ffffff', borderRadius: '24px', border: '1.5px solid #F3D2E5', padding: '2.5rem', boxShadow: '0 8px 30px rgba(190, 89, 133, 0.08)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#BE5985', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              STEP {isCustomTrip ? '3' : '4'} OF {isCustomTrip ? '5' : '6'} • BOOKING SUMMARY
            </span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#BE5985', margin: '0.3rem 0 0.5rem 0' }}>
              Booking Summary
            </h2>
            <p style={{ color: '#7A5366', fontSize: '0.95rem', marginBottom: '2rem' }}>
              Please review your travel details and fare breakdown before proceeding to payment checkout.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              {/* Trip & Traveler Information Card */}
              <div
                style={{
                  background: '#FFF5FB',
                  borderRadius: '20px',
                  border: '1.5px solid #F3D2E5',
                  padding: '1.75rem',
                }}
              >
                <h3 style={{ fontSize: '1.15rem', fontWeight: '900', color: '#BE5985', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📍</span> Trip & Traveler Details
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.92rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#7A5366' }}>Destination:</span>
                    <strong style={{ color: '#2D1520' }}>
                      {customTripData?.destinationName || selectedPackage?.destination_name || 'Selected Destination'}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#7A5366' }}>Travel Dates:</span>
                    <strong style={{ color: '#2D1520' }}>
                      {formData.travelDate} {returnDateCalc ? `➔ ${returnDateCalc}` : ''} ({durationDays} Days)
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#7A5366' }}>Number of Travellers:</span>
                    <strong style={{ color: '#2D1520' }}>{formData.numTravelers} Guest(s)</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#7A5366' }}>Service / Package:</span>
                    <strong style={{ color: '#BE5985' }}>
                      {isCustomTrip ? 'AI Custom Trip Itinerary' : selectedPackage?.title}
                    </strong>
                  </div>

                  {activeTransport && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#7A5366' }}>Selected Transport:</span>
                      <strong style={{ color: '#2D1520' }}>
                        {activeTransport.icon || '🚆'} {activeTransport.title}
                      </strong>
                    </div>
                  )}

                  {activeHotel && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#7A5366' }}>Selected Stay:</span>
                      <strong style={{ color: '#2D1520' }}>
                        🏨 {activeHotel.name}
                      </strong>
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid #F3D2E5', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                    <span style={{ color: '#7A5366', fontSize: '0.8rem', display: 'block', marginBottom: '0.2rem' }}>Lead Traveler:</span>
                    <strong style={{ color: '#2D1520' }}>{formData.fullName || 'Lead Traveler'}</strong>
                    <div style={{ fontSize: '0.82rem', color: '#7A5366' }}>
                      {formData.email} • {formData.phoneNumber}
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Breakdown Card */}
              <div
                style={{
                  background: '#FFF5FB',
                  borderRadius: '20px',
                  border: '1.5px solid #F3D2E5',
                  padding: '1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '900', color: '#BE5985', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>🧾</span> Price Breakdown
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.92rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#7A5366' }}>Base Price ({formData.numTravelers} Travelers):</span>
                      <span style={{ fontWeight: '800', color: '#2D1520' }}>{sym}{subtotal.toLocaleString()}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#7A5366' }}>Taxes & Booking Fees (5%):</span>
                      <span style={{ fontWeight: '800', color: '#2D1520' }}>{sym}{taxesAndFees.toLocaleString()}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#7A5366' }}>Service Fee:</span>
                      <span style={{ fontWeight: '800', color: '#16a34a' }}>Free (Included)</span>
                    </div>

                    {formData.promoDiscount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                        <span>Promo Discount Applied:</span>
                        <span style={{ fontWeight: '800' }}>-{sym}{formData.promoDiscount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ borderTop: '2px solid #F3D2E5', paddingTop: '1.25rem', marginTop: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#7A5366', textTransform: 'uppercase', fontWeight: '800' }}>Total Amount</span>
                      <div style={{ fontSize: '1.9rem', fontWeight: '900', color: '#BE5985', lineHeight: '1.1' }}>
                        {sym}{finalTotal.toLocaleString()}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: '800', background: '#dcfce7', padding: '3px 10px', borderRadius: '999px' }}>
                      🔒 Price Guaranteed
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <button onClick={handlePrevStep} className="btn btn-secondary" style={{ padding: '0.8rem 1.75rem', fontWeight: '800' }}>
                ⬅ Back
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="btn btn-primary"
                style={{ padding: '0.9rem 2.85rem', fontWeight: '900', fontSize: '1.05rem' }}
              >
                Continue to Payment ➔
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* STEP 4: REAL-WORLD PAYMENT CHECKOUT (RAZORPAY TEST)  */}
        {/* ---------------------------------------------------- */}
        {((isCustomTrip && currentStep === 4) || (!isCustomTrip && currentStep === 5)) && (
          <div style={{ background: '#ffffff', borderRadius: '24px', border: '1.5px solid #F3D2E5', padding: '2.5rem', boxShadow: '0 8px 30px rgba(190, 89, 133, 0.08)' }}>
            
            {/* Razorpay Test Mode Trust Badge */}
            <div
              style={{
                background: '#FFEDFA',
                border: '1.5px solid #FFB8E0',
                borderRadius: '16px',
                padding: '0.9rem 1.25rem',
                marginBottom: '1.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.3rem' }}>🛡️</span>
                <div>
                  <strong style={{ color: '#BE5985', fontSize: '0.92rem' }}>
                    Razorpay TEST / SANDBOX Mode Active
                  </strong>
                  <div style={{ fontSize: '0.78rem', color: '#7A5366' }}>
                    Safe simulation environment — No real money will be charged from your account.
                  </div>
                </div>
              </div>

              {/* Simulation Failure / Success Toggle for Testing */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.82rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: '#2D1520', fontWeight: '700' }}>
                  <input
                    type="radio"
                    name="simulateResult"
                    checked={!formData.simulateFailure}
                    onChange={() => {
                      setFormData((prev) => ({ ...prev, simulateFailure: false }));
                      setPaymentFailed(false);
                      setPaymentFailureError('');
                    }}
                    style={{ accentColor: '#22c55e' }}
                  />
                  Simulate Success
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: '#b91c1c', fontWeight: '700' }}>
                  <input
                    type="radio"
                    name="simulateResult"
                    checked={Boolean(formData.simulateFailure)}
                    onChange={() => setFormData((prev) => ({ ...prev, simulateFailure: true }))}
                    style={{ accentColor: '#ef4444' }}
                  />
                  Simulate Bank Decline
                </label>
              </div>
            </div>

            {/* Customer & Booking ID Header Card */}
            <div
              style={{
                background: '#FFF5FB',
                border: '1.5px solid #F3D2E5',
                borderRadius: '18px',
                padding: '1.25rem 1.5rem',
                marginBottom: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#BE5985', textTransform: 'uppercase' }}>
                  CUSTOMER & BOOKING DETAILS
                </span>
                <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#2D1520', marginTop: '0.2rem' }}>
                  {formData.fullName || 'Alexander Reed'}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#7A5366', marginTop: '2px' }}>
                  📧 {formData.email || 'traveler@example.com'} • 📱 {formData.phoneNumber || '+91-98765-43210'}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#7A5366', textTransform: 'uppercase' }}>
                  Total Payable Amount
                </span>
                <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#BE5985', lineHeight: '1.1' }}>
                  {sym}{finalTotal.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Payment Failure Notification Banner */}
            {paymentFailed && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1.5px solid #fca5a5',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  marginBottom: '2rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                }}
              >
                <span style={{ fontSize: '1.5rem', marginTop: '2px' }}>❌</span>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#991b1b', margin: '0 0 0.35rem 0' }}>
                    Payment Failed
                  </h4>
                  <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.88rem', color: '#b91c1c' }}>
                    {paymentFailureError || 'Your payment was declined or simulated failure occurred. Your booking information is safely preserved.'}
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentFailed(false);
                        setPaymentFailureError('');
                        setFormData((prev) => ({ ...prev, simulateFailure: false }));
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ fontWeight: '800' }}
                    >
                      🔄 Try Again
                    </button>
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="btn btn-secondary btn-sm"
                      style={{ fontWeight: '700' }}
                    >
                      ⬅ Back to Booking
                    </button>
                  </div>
                </div>
              </div>
            )}

            <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#BE5985', margin: '0 0 1rem 0' }}>
              Select Payment Method
            </h3>

            {/* Primary Payment Category Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {PAYMENT_METHODS.map((pm) => {
                const isSelected = formData.paymentMethod === pm.id;
                return (
                  <div
                    key={pm.id}
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, paymentMethod: pm.id }));
                      setPaymentFailureError('');
                      setPaymentFailed(false);
                    }}
                    style={{
                      border: isSelected ? '2px solid #EC7FA9' : '1.5px solid #F3D2E5',
                      borderRadius: '18px',
                      padding: '1.25rem',
                      background: isSelected ? '#FFF5FB' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: isSelected ? '0 8px 24px rgba(236, 127, 169, 0.2)' : 'none',
                      transform: isSelected ? 'translateY(-2px)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '1.6rem' }}>{pm.icon}</span>
                      {isSelected && <span style={{ color: '#BE5985', fontSize: '1.1rem', fontWeight: '900' }}>✓</span>}
                    </div>
                    <div style={{ fontWeight: '900', color: isSelected ? '#BE5985' : '#2D1520', fontSize: '1rem' }}>{pm.label}</div>
                    <div style={{ fontSize: '0.78rem', color: '#7A5366', marginTop: '2px' }}>{pm.sub}</div>
                  </div>
                );
              })}
            </div>

            {/* ---------------------------------------------------- */}
            {/* REAL-TIME UPI SUB-CHOICE SUITE (Google Pay, PhonePe, Paytm, QR) */}
            {/* ---------------------------------------------------- */}
            {formData.paymentMethod === 'upi' && (
              <div
                style={{
                  background: '#FFF5FB',
                  border: '1.5px solid #F3D2E5',
                  borderRadius: '20px',
                  padding: '2rem',
                  marginBottom: '2rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#BE5985', margin: '0 0 0.2rem 0' }}>
                      ⚡ Select UPI Payment Mode
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#7A5366', margin: 0 }}>
                      Pay directly using your favorite UPI app or scan the live dynamic QR code.
                    </p>
                  </div>
                  <span style={{ background: '#FFEDFA', color: '#BE5985', border: '1px solid #FFB8E0', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800' }}>
                    🛡️ NPCI UPI 2.0 Real-Time
                  </span>
                </div>

                {/* UPI Apps Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  {UPI_APPS.map((app) => {
                    const isAppSelected = selectedUpiApp === app.id;
                    return (
                      <div
                        key={app.id}
                        onClick={() => handleUpiAppSelect(app)}
                        style={{
                          background: isAppSelected ? '#ffffff' : '#ffffff',
                          border: isAppSelected ? '2px solid #EC7FA9' : '1.5px solid #F3D2E5',
                          borderRadius: '14px',
                          padding: '1rem 0.75rem',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: isAppSelected ? '0 6px 16px rgba(236, 127, 169, 0.25)' : 'none',
                          transform: isAppSelected ? 'scale(1.03)' : 'scale(1)',
                        }}
                      >
                        <div style={{ fontSize: '1.6rem', marginBottom: '0.25rem' }}>{app.icon}</div>
                        <div style={{ fontWeight: '900', fontSize: '0.88rem', color: isAppSelected ? '#BE5985' : '#2D1520' }}>
                          {app.name}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Sub-view: Dynamic Live QR Code */}
                {selectedUpiApp === 'qr' ? (
                  <div style={{ background: '#ffffff', borderRadius: '18px', padding: '2rem', textAlign: 'center', border: '1.5px solid #F3D2E5', maxWidth: '440px', margin: '0 auto', boxShadow: '0 8px 24px rgba(190, 89, 133, 0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px dashed #F3D2E5', paddingBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#BE5985' }}>📲 DYNAMIC UPI QR</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#991b1b', background: '#fee2e2', padding: '2px 8px', borderRadius: '6px' }}>
                        ⏱️ Expires in: {formatTimer(qrCountdown)}
                      </span>
                    </div>

                    {/* QR Code Container with Scan Animation */}
                    <div
                      style={{
                        position: 'relative',
                        width: '200px',
                        height: '200px',
                        margin: '0 auto 1.25rem',
                        padding: '12px',
                        background: '#ffffff',
                        border: '3px solid #EC7FA9',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 20px rgba(190, 89, 133, 0.12)',
                      }}
                    >
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=travelora@icici&pn=TraveloraBooking&am=${finalTotal}&cu=INR`}
                        alt="UPI Payment QR Code"
                        style={{ width: '100%', height: '100%', borderRadius: '8px' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          background: '#BE5985',
                          color: '#ffffff',
                          fontWeight: '900',
                          fontSize: '0.72rem',
                          padding: '3px 7px',
                          borderRadius: '4px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                        }}
                      >
                        TRAVELORA
                      </div>
                    </div>

                    <p style={{ fontSize: '0.9rem', fontWeight: '800', color: '#2D1520', margin: '0 0 0.25rem 0' }}>
                      Scan with Google Pay, PhonePe, Paytm or Any UPI App
                    </p>
                    <p style={{ fontSize: '0.8rem', color: '#7A5366', margin: '0 0 1rem 0' }}>
                      Amount: <strong style={{ color: '#BE5985', fontSize: '1rem' }}>{sym}{finalTotal.toLocaleString()}</strong>
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.8rem', color: '#BE5985', background: '#FFEDFA', padding: '6px 12px', borderRadius: '8px' }}>
                      <span className="live-pulse" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#EC7FA9' }} />
                      <span>Live payment listener active...</span>
                    </div>
                  </div>
                ) : (
                  /* Sub-view: Enter UPI ID / VPA */
                  <div style={{ background: '#ffffff', borderRadius: '18px', padding: '1.5rem', border: '1.5px solid #F3D2E5' }}>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.5rem' }}>
                      Enter {UPI_APPS.find((a) => a.id === selectedUpiApp)?.name} UPI ID / VPA
                    </label>

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => {
                          setUpiId(e.target.value);
                          setIsUpiVerified(false);
                        }}
                        placeholder="e.g. alex@okhdfcbank or 9876543210@paytm"
                        style={{
                          flex: 1,
                          minWidth: '240px',
                          padding: '0.75rem 1rem',
                          borderRadius: '12px',
                          border: isUpiVerified ? '2px solid #22c55e' : '1.5px solid #F3D2E5',
                          fontSize: '0.98rem',
                          fontWeight: '700',
                          outline: 'none',
                          color: '#2D1520',
                        }}
                      />

                      <button
                        type="button"
                        onClick={handleVerifyUpiId}
                        disabled={verifyingUpi || !upiId}
                        style={{
                          background: isUpiVerified ? '#dcfce7' : '#EC7FA9',
                          color: isUpiVerified ? '#15803d' : '#ffffff',
                          border: isUpiVerified ? '1.5px solid #86efac' : 'none',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '12px',
                          fontWeight: '900',
                          fontSize: '0.88rem',
                          cursor: 'pointer',
                        }}
                      >
                        {verifyingUpi ? 'Verifying...' : isUpiVerified ? '✓ Verified' : 'Verify ID'}
                      </button>
                    </div>

                    {/* Quick Handle Suffix Chips */}
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#7A5366', fontWeight: '700' }}>Quick Handles:</span>
                      {['@okhdfcbank', '@okaxis', '@ybl', '@paytm', '@ibl', '@upi'].map((suffix) => (
                        <button
                          key={suffix}
                          type="button"
                          onClick={() => {
                            const prefix = upiId ? upiId.split('@')[0] : 'alex';
                            setUpiId(`${prefix}${suffix}`);
                            setIsUpiVerified(true);
                          }}
                          style={{
                            background: '#FFF5FB',
                            border: '1px solid #F3D2E5',
                            borderRadius: '8px',
                            padding: '3px 10px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            color: '#BE5985',
                            cursor: 'pointer',
                          }}
                        >
                          {suffix}
                        </button>
                      ))}
                    </div>

                    {isUpiVerified && (
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.75rem 1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#166534' }}>
                        <span>✓</span>
                        <span>
                          Verified account: <strong>{formData.fullName || 'Alexander Reed'}</strong> (NPCI Secured Bank Link)
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* CREDIT / DEBIT CARD DETAILS SUB-VIEW                 */}
            {/* ---------------------------------------------------- */}
            {formData.paymentMethod === 'credit_card' && (
              <div style={{ background: '#FFF5FB', border: '1.5px solid #F3D2E5', borderRadius: '20px', padding: '2rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#BE5985', margin: '0 0 1.25rem 0' }}>
                  💳 Card Payment Details
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.4rem' }}>
                      Card Number
                    </label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleChange}
                      placeholder="4242 •••• •••• 4242"
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #F3D2E5', fontSize: '1rem', letterSpacing: '0.05em', color: '#2D1520' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.4rem' }}>
                      Expiry Date (MM/YY)
                    </label>
                    <input
                      type="text"
                      name="cardExpiry"
                      value={formData.cardExpiry}
                      onChange={handleChange}
                      placeholder="12/28"
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #F3D2E5', fontSize: '1rem', color: '#2D1520' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.4rem' }}>
                      CVV / Security Code
                    </label>
                    <input
                      type="password"
                      name="cardCvv"
                      value={formData.cardCvv}
                      onChange={handleChange}
                      maxLength="4"
                      placeholder="•••"
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #F3D2E5', fontSize: '1rem', color: '#2D1520' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* NET BANKING POPULAR BANKS SUB-VIEW                   */}
            {/* ---------------------------------------------------- */}
            {formData.paymentMethod === 'netbanking' && (
              <div style={{ background: '#FFF5FB', border: '1.5px solid #F3D2E5', borderRadius: '20px', padding: '2rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#BE5985', margin: '0 0 1rem 0' }}>
                  🏦 Select Bank for Net Banking
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  {NETBANKING_BANKS.map((b) => {
                    const isBankSelected = selectedBank === b.id;
                    return (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBank(b.id)}
                        style={{
                          background: isBankSelected ? '#FFEDFA' : '#ffffff',
                          border: isBankSelected ? '2px solid #EC7FA9' : '1.5px solid #F3D2E5',
                          padding: '0.85rem 1rem',
                          borderRadius: '14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontWeight: '800',
                          fontSize: '0.9rem',
                          color: '#2D1520',
                        }}
                      >
                        <span>{b.icon}</span>
                        <span>{b.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* DIGITAL WALLETS SUB-VIEW                             */}
            {/* ---------------------------------------------------- */}
            {formData.paymentMethod === 'wallet' && (
              <div style={{ background: '#FFF5FB', border: '1.5px solid #F3D2E5', borderRadius: '20px', padding: '2rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#BE5985', margin: '0 0 1rem 0' }}>
                  👛 Select Digital Wallet
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  {WALLETS.map((w) => {
                    const isWalletSelected = selectedWallet === w.id;
                    return (
                      <div
                        key={w.id}
                        onClick={() => setSelectedWallet(w.id)}
                        style={{
                          background: isWalletSelected ? '#FFEDFA' : '#ffffff',
                          border: isWalletSelected ? '2px solid #EC7FA9' : '1.5px solid #F3D2E5',
                          padding: '1rem',
                          borderRadius: '16px',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontSize: '1.4rem', marginBottom: '0.2rem' }}>{w.icon}</div>
                        <div style={{ fontWeight: '900', color: '#2D1520', fontSize: '0.95rem' }}>{w.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#7A5366' }}>{w.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Feature 7: Payment Failure Alert Box */}
            {paymentFailureError && (
              <div style={{ background: '#fee2e2', border: '1.5px solid #fecdd3', padding: '1.25rem', borderRadius: '16px', marginBottom: '2rem' }}>
                <strong style={{ color: '#991b1b', display: 'block', fontSize: '0.95rem', marginBottom: '0.35rem' }}>
                  {paymentFailureError}
                </strong>
                <p style={{ color: '#b91c1c', fontSize: '0.85rem', margin: 0 }}>
                  You can click <strong>Try Again</strong> below to re-attempt payment with another method.
                </p>
              </div>
            )}

            {/* Trust & Bank Security Footer */}
            <div style={{ textAlign: 'center', fontSize: '0.82rem', color: '#7A5366', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span>🔒 256-bit Bank Grade Encryption</span>
              <span>•</span>
              <span>🛡️ NPCI UPI 2.0 Certified</span>
              <span>•</span>
              <span>⚡ Free cancellation prior to 48 hours</span>
            </div>

            {/* Navigation Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <button onClick={handlePrevStep} className="btn btn-secondary" style={{ padding: '0.8rem 1.75rem' }}>
                ⬅ Back to Summary
              </button>

              <button
                type="button"
                onClick={handleStartPaymentAuth}
                disabled={submitting}
                className="btn btn-primary"
                style={{
                  padding: '0.95rem 2.85rem',
                  fontWeight: '900',
                  fontSize: '1.08rem',
                }}
              >
                {submitting ? (
                  <span>⏳ {loadingMessage || 'Processing Payment...'}</span>
                ) : (
                  <span>Pay {sym}{finalTotal.toLocaleString()} ➔</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* STEP 5: PAYMENT SUCCESS (FIRST) & BILL PROCESS (NEXT)*/}
        {/* ---------------------------------------------------- */}
        {isFinalConfirmationStep && postPaymentView === 'success' && (
          <div style={{ background: '#ffffff', borderRadius: '24px', padding: '3rem 2.5rem', border: '1.5px solid #F3D2E5', boxShadow: '0 10px 40px rgba(190, 89, 133, 0.1)', textAlign: 'center' }}>
            <div style={{ fontSize: '3.8rem', marginBottom: '0.75rem' }}>🎉</div>
            <span style={{ background: '#dcfce7', color: '#15803d', border: '1.5px solid #86efac', padding: '4px 16px', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: '900', textTransform: 'uppercase' }}>
              ● Payment Verified & Confirmed ✓
            </span>

            <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#BE5985', margin: '0.75rem 0 0.35rem 0' }}>
              Payment Successful ✓
            </h1>
            <p style={{ color: '#7A5366', fontSize: '1.05rem', margin: '0 0 2rem 0' }}>
              Your transaction has been securely authorized and verified. Your booking is confirmed!
            </p>

            {/* Visual Success Confirmation Summary */}
            <div
              style={{
                background: '#FFF5FB',
                borderRadius: '20px',
                padding: '2rem',
                border: '1.5px solid #F3D2E5',
                maxWidth: '620px',
                margin: '0 auto 2.5rem auto',
                textAlign: 'left',
                boxShadow: '0 4px 20px rgba(190, 89, 133, 0.06)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px dashed #F3D2E5', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#7A5366', textTransform: 'uppercase', fontWeight: '700' }}>Booking Reference</span>
                  <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#BE5985' }}>
                    {confirmedPayment?.bookingReference || activeBooking?.booking_reference || 'BK-2026-CONFIRMED'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: '#7A5366', textTransform: 'uppercase', fontWeight: '700' }}>Transaction ID</span>
                  <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#16a34a' }}>
                    {confirmedPayment?.transactionId || 'TXN-RAZORPAY-CONFIRMED'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', fontSize: '0.92rem', color: '#2D1520', marginBottom: '1.25rem' }}>
                <div>
                  <strong>📍 Destination:</strong> {customTripData?.destinationName || selectedPackage?.destination_name || 'Selected Destination'}
                </div>
                <div>
                  <strong>📅 Travel Date:</strong> {formData.travelDate}
                </div>
                <div>
                  <strong>👥 Travellers:</strong> {formData.numTravelers} Traveller(s)
                </div>
                <div>
                  <strong>💰 Total Paid:</strong> <span style={{ color: '#BE5985', fontWeight: '900' }}>{sym}{finalTotal.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #F3D2E5', paddingTop: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: '900' }}>Status: Confirmed & Paid ✓</span>
                <span style={{ fontSize: '0.82rem', color: '#7A5366' }}>🛡️ Razorpay Sandbox Verified</span>
              </div>
            </div>

            {/* Action Buttons: Proceed to Bill Next */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setPostPaymentView('bill');
                  window.scrollTo(0, 0);
                }}
                className="btn btn-primary"
                style={{ padding: '0.95rem 2.85rem', fontWeight: '900', fontSize: '1.05rem' }}
              >
                📄 Proceed to Bill & Invoice ➔
              </button>

              <Link to="/my-trips?tab=upcoming" className="btn btn-secondary" style={{ padding: '0.95rem 2rem', fontWeight: '700' }}>
                ✈️ View My Bookings
              </Link>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* STEP 5 (PART 2): OFFICIAL BILL & TAX INVOICE PROCESS */}
        {/* ---------------------------------------------------- */}
        {isFinalConfirmationStep && postPaymentView === 'bill' && (
          <div style={{ background: '#ffffff', borderRadius: '24px', padding: '2.5rem', border: '1.5px solid #F3D2E5', boxShadow: '0 10px 40px rgba(190, 89, 133, 0.1)' }}>
            {/* Header Navigation Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', borderBottom: '1.5px solid #F3D2E5', paddingBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#BE5985', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  OFFICIAL TAX INVOICE & GST BILL
                </span>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#BE5985', margin: '0.2rem 0 0 0' }}>
                  Booking Bill & Tax Invoice
                </h2>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    exportBillToPdf({
                      bookingReference: confirmedPayment?.bookingReference || activeBooking?.booking_reference || 'BK-2026-CONFIRMED',
                      transactionId: confirmedPayment?.transactionId || 'TXN-RAZORPAY-CONFIRMED',
                      customerName: formData.fullName || 'Lead Guest',
                      customerEmail: formData.email || 'guest@example.com',
                      customerPhone: formData.phoneNumber || '+91 98765 43210',
                      destinationName: customTripData?.destinationName || selectedPackage?.destination_name || 'Selected Destination',
                      travelDate: formData.travelDate,
                      returnDate: returnDateCalc,
                      numTravelers: formData.numTravelers,
                      packageTitle: isCustomTrip ? 'AI Custom Trip Itinerary' : (selectedPackage?.title || 'Curated Package'),
                      transportTitle: activeTransport?.title || 'Standard Road Transit',
                      hotelName: activeHotel?.name || 'Recommended Luxury Stay',
                      subtotal,
                      taxesAndFees,
                      discountAmount: totalSavings,
                      totalAmount: finalTotal,
                      paymentMethod: formData.paymentMethod === 'upi' ? `UPI (${selectedUpiApp.toUpperCase()})` : (formData.paymentMethod === 'credit_card' ? 'Credit / Debit Card' : formData.paymentMethod),
                      currencySymbol: sym,
                    });
                  }}
                  className="btn btn-primary"
                  style={{ padding: '0.75rem 1.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <span>🖨️ Download / Print Bill (PDF)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPostPaymentView('success')}
                  className="btn btn-secondary"
                  style={{ padding: '0.75rem 1.25rem', fontWeight: '700' }}
                >
                  ⬅ Back to Success
                </button>
              </div>
            </div>

            {/* The Bill Paper / Invoice Document Container */}
            <div
              style={{
                background: '#FFF5FB',
                border: '1.5px solid #F3D2E5',
                borderRadius: '20px',
                padding: '2rem',
                marginBottom: '2rem',
              }}
            >
              {/* Top Invoice Metadata Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', borderBottom: '2px solid #F3D2E5', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#BE5985', letterSpacing: '-0.5px' }}>
                    TRAVELORA <span style={{ color: '#EC7FA9' }}>EXPLORE</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#7A5366', marginTop: '4px', lineHeight: '1.4' }}>
                    Travelora Travels Pvt. Ltd. • GSTIN: <strong>33AAACT7891K1Z8</strong><br />
                    SAC Code: <strong>998553</strong> (Tour Operator & Travel Booking Services)<br />
                    HQ: Brigade Road, Bangalore, KA 560001
                  </div>
                </div>

                <div style={{ background: '#FFEDFA', border: '1px solid #FFB8E0', padding: '0.85rem 1.25rem', borderRadius: '14px', textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#BE5985', textTransform: 'uppercase' }}>TAX INVOICE</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#2D1520' }}>
                    INV-{confirmedPayment?.bookingReference?.replace('BK-', '') || activeBooking?.booking_reference?.replace('BK-', '') || '2026-CONFIRMED'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#7A5366' }}>
                    Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Billed To & Payment Summary Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#ffffff', border: '1px solid #F3D2E5', borderRadius: '14px', padding: '1.25rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: '800', color: '#BE5985', textTransform: 'uppercase' }}>
                    Billed To (Lead Guest)
                  </h4>
                  <div style={{ fontSize: '1rem', fontWeight: '900', color: '#2D1520' }}>{formData.fullName || 'Alexander Reed'}</div>
                  <div style={{ fontSize: '0.85rem', color: '#7A5366', marginTop: '2px' }}>
                    📧 {formData.email || 'traveler@example.com'}<br />
                    📱 {formData.phoneNumber || '+91-98765-43210'}<br />
                    👥 {formData.numTravelers} Registered Guest(s)
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #F3D2E5', borderRadius: '14px', padding: '1.25rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: '800', color: '#BE5985', textTransform: 'uppercase' }}>
                    Payment Verification
                  </h4>
                  <div style={{ fontSize: '0.88rem', color: '#2D1520', lineHeight: '1.5' }}>
                    <strong>Booking ID:</strong> {confirmedPayment?.bookingReference || activeBooking?.booking_reference || 'BK-2026-CONFIRMED'}<br />
                    <strong>Transaction ID:</strong> <span style={{ color: '#16a34a', fontWeight: '800' }}>{confirmedPayment?.transactionId || 'TXN-RAZORPAY-CONFIRMED'}</span><br />
                    <strong>Status:</strong> <span style={{ color: '#16a34a', fontWeight: '900' }}>PAID & VERIFIED ✓</span>
                  </div>
                </div>
              </div>

              {/* Itemized Line Items Table */}
              <div style={{ background: '#ffffff', border: '1px solid #F3D2E5', borderRadius: '14px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#FFEDFA', borderBottom: '1.5px solid #F3D2E5', textAlign: 'left', color: '#BE5985', fontWeight: '800' }}>
                      <th style={{ padding: '0.85rem 1rem' }}>#</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Description & Service Details</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Travel Dates</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Qty</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Amount ({sym})</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #F3D2E5' }}>
                      <td style={{ padding: '0.85rem 1rem', color: '#7A5366' }}>1</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <strong style={{ color: '#2D1520' }}>{customTripData?.destinationName || selectedPackage?.destination_name || 'Selected Destination'}</strong>
                        <div style={{ fontSize: '0.78rem', color: '#7A5366' }}>
                          {isCustomTrip ? 'AI Custom Itinerary & Daily Experience Planning' : selectedPackage?.title}
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#2D1520' }}>{formData.travelDate}</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#2D1520' }}>{formData.numTravelers} Guest(s)</td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: '800', color: '#2D1520' }}>
                        {sym}{subtotal.toLocaleString()}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #F3D2E5' }}>
                      <td style={{ padding: '0.85rem 1rem', color: '#7A5366' }}>2</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <strong style={{ color: '#2D1520' }}>Transit & Ground Transport</strong>
                        <div style={{ fontSize: '0.78rem', color: '#7A5366' }}>{activeTransport?.title || 'Standard Road Transit'}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#2D1520' }}>{formData.travelDate}</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#2D1520' }}>{formData.numTravelers} Pass(es)</td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: '800', color: '#16a34a' }}>
                        Included
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #F3D2E5' }}>
                      <td style={{ padding: '0.85rem 1rem', color: '#7A5366' }}>3</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <strong style={{ color: '#2D1520' }}>Hotel & Stay Accommodation</strong>
                        <div style={{ fontSize: '0.78rem', color: '#7A5366' }}>{activeHotel?.name || 'Verified Recommended Hotel'}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#2D1520' }}>{durationDays} Nights</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#2D1520' }}>1 Room</td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: '800', color: '#16a34a' }}>
                        Included
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.85rem 1rem', color: '#7A5366' }}>4</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <strong style={{ color: '#2D1520' }}>Platform & 24/7 AI Travel Assistant</strong>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#2D1520' }}>Instant</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#2D1520' }}>1 Account</td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: '800', color: '#16a34a' }}>
                        FREE (₹0)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Total Calculation & Paid Stamp */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                  <div style={{ display: 'inline-block', border: '2px solid #16a34a', color: '#16a34a', padding: '6px 18px', borderRadius: '10px', fontWeight: '900', fontSize: '1.05rem', textTransform: 'uppercase', transform: 'rotate(-2deg)' }}>
                    PAID & VERIFIED ✓
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#7A5366', marginTop: '8px' }}>
                    * Computer generated tax invoice. No signature required.
                  </div>
                </div>

                <div style={{ width: '280px', background: '#ffffff', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid #F3D2E5' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#7A5366', marginBottom: '0.4rem' }}>
                    <span>Subtotal:</span>
                    <strong style={{ color: '#2D1520' }}>{sym}{subtotal.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#7A5366', marginBottom: '0.4rem' }}>
                    <span>GST (5%):</span>
                    <strong style={{ color: '#2D1520' }}>{sym}{taxesAndFees.toLocaleString()}</strong>
                  </div>
                  {formData.promoDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#16a34a', marginBottom: '0.4rem' }}>
                      <span>Discount:</span>
                      <strong>-{sym}{formData.promoDiscount.toLocaleString()}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: '900', color: '#BE5985', borderTop: '1.5px solid #BE5985', paddingTop: '0.5rem', marginTop: '0.4rem' }}>
                    <span>Total Paid:</span>
                    <span>{sym}{finalTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/my-trips?tab=upcoming" className="btn btn-primary" style={{ padding: '0.85rem 2.25rem', fontWeight: '800' }}>
                ✈️ View in My Trips
              </Link>
              <Link to="/home" className="btn btn-secondary" style={{ padding: '0.85rem 2.25rem', fontWeight: '700' }}>
                🏠 Back to Home
              </Link>
            </div>
          </div>
        )}

        {/* 3D Secure / UPI PIN / 2FA Payment Authentication Modal */}
        <PaymentAuthenticationModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          paymentMethod={formData.paymentMethod}
          subMethod={selectedUpiApp}
          amount={finalTotal}
          currency="INR"
          customerName={formData.fullName}
          customerPhone={formData.phoneNumber}
          customerEmail={formData.email}
          bookingReference={activeBooking?.booking_reference || 'BK-2026-RESERVATION'}
          onAuthorize={handleAuthorizeAndPay}
          isProcessing={submitting}
        />

        {/* Digital Receipt Modal */}
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
