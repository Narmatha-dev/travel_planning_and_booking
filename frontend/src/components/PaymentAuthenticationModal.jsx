import React, { useState, useEffect } from 'react';

/**
 * Real-World Bank 3D Secure / UPI PIN / 2FA Payment Authentication & Authorization Modal
 * Features:
 * - 3D Secure 2.0 (Visa / MasterCard OTP)
 * - NPCI UPI 2.0 In-App PIN Keypad
 * - NetBanking Bank 2FA Portal
 * - Digital Wallet Mobile Verification
 * - One-Click Auto-Fill for Testing & Sandbox Verification
 */
export default function PaymentAuthenticationModal({
  isOpen,
  onClose,
  paymentMethod,
  subMethod,
  amount,
  currency = 'INR',
  customerName = 'Alexander Reed',
  customerPhone = '+91 98765 43210',
  customerEmail = 'alex.reed@example.com',
  bookingReference = 'BK-2026-CONFIRMED',
  onAuthorize,
  isProcessing = false,
}) {
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [upiPin, setUpiPin] = useState(['', '', '', '', '', '']);
  const [bankPassword, setBankPassword] = useState('');
  const [timer, setTimer] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState('otp'); // 'otp' or 'pin'

  // Reset timer on open
  useEffect(() => {
    if (isOpen) {
      setTimer(45);
      setCanResend(false);
      setOtpCode(['', '', '', '', '', '']);
      setUpiPin(['', '', '', '', '', '']);
      setBankPassword('');
      setAuthError('');
    }
  }, [isOpen]);

  // Countdown timer for OTP / UPI Session
  useEffect(() => {
    let interval;
    if (isOpen && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [isOpen, timer]);

  if (!isOpen) return null;

  const sym = currency === 'USD' ? '$' : '₹';

  // Handle OTP digit input
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);
    setAuthError('');

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Handle UPI PIN digit input
  const handlePinChange = (index, value) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    const newPin = [...upiPin];
    newPin[index] = value;
    setUpiPin(newPin);
    setAuthError('');

    if (value && index < 5) {
      const nextInput = document.getElementById(`pin-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handlePinKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !upiPin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Auto-Fill for instant seamless testing
  const handleAutoFillOtp = () => {
    setOtpCode(['4', '8', '2', '9', '1', '0']);
    setAuthError('');
  };

  const handleAutoFillPin = () => {
    setUpiPin(['1', '2', '3', '4', '5', '6']);
    setAuthError('');
  };

  const handleAutoFillBank = () => {
    setBankPassword('••••••••••••');
    setAuthError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (paymentMethod === 'credit_card') {
      const fullOtp = otpCode.join('');
      if (fullOtp.length < 6) {
        setAuthError('Please enter the complete 6-digit Bank OTP.');
        return;
      }
      onAuthorize({ method: 'card_3ds', otp: fullOtp });
    } else if (paymentMethod === 'upi') {
      const fullPin = upiPin.join('');
      if (fullPin.length < 4) {
        setAuthError('Please enter your 4 or 6-digit UPI PIN.');
        return;
      }
      onAuthorize({ method: 'upi_pin', pin: fullPin });
    } else if (paymentMethod === 'netbanking') {
      if (!bankPassword) {
        setAuthError('Please enter your NetBanking Transaction Password / OTP.');
        return;
      }
      onAuthorize({ method: 'netbanking_auth', token: bankPassword });
    } else {
      onAuthorize({ method: 'wallet_auth', otp: '123456' });
    }
  };

  const isCard = paymentMethod === 'credit_card';
  const isUpi = paymentMethod === 'upi';
  const isNetBanking = paymentMethod === 'netbanking';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(45, 21, 32, 0.72)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 25px 60px -15px rgba(190, 89, 133, 0.35)',
          border: '1.5px solid #F3D2E5',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Top Header Strip */}
        <div
          style={{
            background: 'linear-gradient(135deg, #BE5985 0%, #EC7FA9 100%)',
            padding: '1.25rem 1.5rem',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>
              {isUpi ? '⚡' : isCard ? '🛡️' : isNetBanking ? '🏦' : '👛'}
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '900', color: '#ffffff' }}>
                {isUpi
                  ? 'NPCI UPI 2.0 Authentication'
                  : isCard
                  ? '3D Secure 2.0 Bank Verification'
                  : isNetBanking
                  ? 'Bank NetBanking Authorization'
                  : 'Wallet Payment Authorization'}
              </h3>
              <span style={{ fontSize: '0.75rem', opacity: 0.9, color: '#FFF5FB' }}>
                256-Bit Bank-Grade End-to-End Encrypted
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.75rem' }}>
          {/* Order Summary Strip */}
          <div
            style={{
              background: '#FFF5FB',
              border: '1.5px solid #F3D2E5',
              borderRadius: '16px',
              padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', color: '#7A5366', fontWeight: '700', textTransform: 'uppercase' }}>
                Merchant & Reference
              </span>
              <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#2D1520' }}>
                Travelora Travels Pvt Ltd
              </div>
              <div style={{ fontSize: '0.78rem', color: '#BE5985', fontWeight: '700' }}>
                Ref: {bookingReference}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: '#7A5366', fontWeight: '700', textTransform: 'uppercase' }}>
                Payable Amount
              </span>
              <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#BE5985' }}>
                {sym}{amount ? Number(amount).toLocaleString() : '0'}
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* 1. CREDIT / DEBIT CARD 3D SECURE OTP AUTH            */}
          {/* ---------------------------------------------------- */}
          {isCard && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '0.9rem', color: '#2D1520', margin: '0 0 0.25rem 0' }}>
                  A one-time verification code (OTP) was sent to your registered mobile:
                </p>
                <strong style={{ color: '#BE5985', fontSize: '0.95rem' }}>
                  {customerPhone ? `${customerPhone.slice(0, 6)}••••${customerPhone.slice(-2)}` : '+91 98••••••10'}
                </strong>
                <span style={{ color: '#7A5366', fontSize: '0.8rem', display: 'block' }}>
                  Card: •••• •••• •••• 4242 (Visa Secure / Mastercard ID Check)
                </span>
              </div>

              {/* 6 Digit OTP Inputs */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {otpCode.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="password"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    disabled={isProcessing}
                    style={{
                      width: '46px',
                      height: '52px',
                      textAlign: 'center',
                      fontSize: '1.4rem',
                      fontWeight: '900',
                      color: '#BE5985',
                      borderRadius: '12px',
                      border: digit ? '2px solid #EC7FA9' : '1.5px solid #F3D2E5',
                      background: digit ? '#FFEDFA' : '#ffffff',
                      outline: 'none',
                      boxShadow: digit ? '0 4px 12px rgba(236, 127, 169, 0.2)' : 'none',
                    }}
                  />
                ))}
              </div>

              {/* Auto-fill test helper chip */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontSize: '0.82rem' }}>
                <button
                  type="button"
                  onClick={handleAutoFillOtp}
                  style={{
                    background: '#FFF5FB',
                    border: '1px dashed #EC7FA9',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    color: '#BE5985',
                    fontWeight: '800',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                  }}
                >
                  ⚡ Auto-Fill Test OTP (482910)
                </button>

                <span style={{ color: timer > 0 ? '#7A5366' : '#BE5985', fontWeight: '700' }}>
                  {timer > 0 ? (
                    `⏱️ Resend OTP in 00:${timer.toString().padStart(2, '0')}`
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setTimer(45);
                        setCanResend(false);
                      }}
                      style={{ background: 'none', border: 'none', color: '#BE5985', fontWeight: '800', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Resend OTP Now
                    </button>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* 2. NPCI UPI PIN KEYPAD AUTH                          */}
          {/* ---------------------------------------------------- */}
          {isUpi && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '0.9rem', color: '#2D1520', margin: '0 0 0.25rem 0' }}>
                  Enter your 4 or 6-digit <strong>UPI PIN</strong> to authorize instant bank debit:
                </p>
                <span style={{ color: '#7A5366', fontSize: '0.8rem' }}>
                  Account: <strong>{customerName}</strong> • {customerEmail.split('@')[0]}@okhdfcbank
                </span>
              </div>

              {/* 6 Digit UPI PIN Inputs */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {upiPin.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`pin-input-${idx}`}
                    type="password"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handlePinChange(idx, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(idx, e)}
                    disabled={isProcessing}
                    style={{
                      width: '46px',
                      height: '52px',
                      textAlign: 'center',
                      fontSize: '1.4rem',
                      fontWeight: '900',
                      color: '#BE5985',
                      borderRadius: '12px',
                      border: digit ? '2px solid #EC7FA9' : '1.5px solid #F3D2E5',
                      background: digit ? '#FFEDFA' : '#ffffff',
                      outline: 'none',
                    }}
                  />
                ))}
              </div>

              {/* Auto-fill test helper chip */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontSize: '0.82rem' }}>
                <button
                  type="button"
                  onClick={handleAutoFillPin}
                  style={{
                    background: '#FFF5FB',
                    border: '1px dashed #EC7FA9',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    color: '#BE5985',
                    fontWeight: '800',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                  }}
                >
                  ⚡ Auto-Fill UPI PIN (123456)
                </button>

                <span style={{ color: '#16a34a', fontWeight: '800' }}>
                  🛡️ NPCI UPI 2.0 Encrypted
                </span>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* 3. NET BANKING / WALLET AUTH                         */}
          {/* ---------------------------------------------------- */}
          {(isNetBanking || (!isCard && !isUpi)) && (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.4rem' }}>
                  {isNetBanking ? 'Bank Transaction Password / High Security OTP' : 'Wallet Security Confirmation PIN'}
                </label>
                <input
                  type="password"
                  value={bankPassword}
                  onChange={(e) => setBankPassword(e.target.value)}
                  placeholder="Enter your security credential / token"
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    border: '1.5px solid #F3D2E5',
                    fontSize: '1rem',
                    color: '#2D1520',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1.5rem' }}>
                <button
                  type="button"
                  onClick={handleAutoFillBank}
                  style={{
                    background: '#FFF5FB',
                    border: '1px dashed #EC7FA9',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    color: '#BE5985',
                    fontWeight: '800',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                  }}
                >
                  ⚡ Auto-Fill Security Token
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {authError && (
            <div style={{ background: '#fee2e2', border: '1px solid #fecdd3', color: '#991b1b', padding: '0.75rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '700', marginBottom: '1.25rem', textAlign: 'center' }}>
              ⚠️ {authError}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '0.85rem', fontWeight: '800' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="btn btn-primary"
              style={{ flex: 2, padding: '0.85rem', fontWeight: '900', fontSize: '1rem' }}
            >
              {isProcessing ? (
                <span>⏳ Verifying with Bank...</span>
              ) : (
                <span>Authorize & Pay {sym}{amount ? Number(amount).toLocaleString() : '0'} ➔</span>
              )}
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: '#7A5366' }}>
            🔒 Safe Sandbox Checkout • Verified by Visa / Mastercard ID Check / NPCI UPI
          </div>
        </form>
      </div>
    </div>
  );
}
