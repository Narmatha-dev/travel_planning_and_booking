import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import safetyService from '../services/safetyService';
import locationService from '../services/locationService';
import InteractiveMapSection from '../components/InteractiveMapSection';
import { useAppContext } from '../context/AppContext';

export default function SafetyPage() {
  const {
    user,
    isAuthenticated,
    currentLocation,
    locationStatus,
    detectLocation,
    showToast,
    language,
    t,
  } = useAppContext();

  const navigate = useNavigate();

  // Safety Data States
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchRadius, setSearchRadius] = useState(10);
  const [places, setPlaces] = useState([]);
  const [placesSummary, setPlacesSummary] = useState({ hospitals: 0, police: 0, pharmacies: 0, total: 0 });
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [placesError, setPlacesError] = useState(null);

  // Country Emergency Numbers
  const [emergencyData, setEmergencyData] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState('India');
  const [loadingEmergency, setLoadingEmergency] = useState(false);

  // Trusted Contacts State (Feature 12)
  const [trustedContacts, setTrustedContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    relationship: 'Family',
    email: '',
    is_primary: false,
  });

  // Location Sharing Modal State (Feature 11)
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareCustomMsg, setShareCustomMsg] = useState('I am sharing my current travel safety location update.');
  const [sharePayload, setSharePayload] = useState(null);
  const [preparingShare, setPreparingShare] = useState(false);
  const [selectedContactToShare, setSelectedContactToShare] = useState(null);

  // Directions & Map Modal State (Feature 8 & 9)
  const [selectedFacilityForRoute, setSelectedFacilityForRoute] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  // Fallback default coordinates if GPS not granted (Chennai center as demo default)
  const userLat = currentLocation?.latitude || 13.0604;
  const userLng = currentLocation?.longitude || 80.2518;
  const hasGps = Boolean(currentLocation?.latitude && currentLocation?.longitude);

  // 1. Initial location check & on-demand prompt
  useEffect(() => {
    if (!currentLocation && locationStatus === 'idle') {
      detectLocation();
    }
  }, []);

  // 2. Fetch emergency numbers whenever user country or GPS location changes
  const fetchEmergencyNumbers = async (countryName) => {
    setLoadingEmergency(true);
    try {
      const data = await safetyService.getEmergencyNumbers({
        country: countryName || selectedCountry,
        latitude: userLat,
        longitude: userLng,
      });
      if (data) {
        setEmergencyData(data);
        if (data.matched_country) {
          setSelectedCountry(data.matched_country);
        }
      }
    } catch (err) {
      console.warn('Failed to load emergency contacts:', err.message);
    } finally {
      setLoadingEmergency(false);
    }
  };

  useEffect(() => {
    fetchEmergencyNumbers();
  }, [userLat, userLng]);

  // 3. Fetch nearby safety places whenever coordinates, category, or radius change
  const fetchNearbyPlaces = async () => {
    setLoadingPlaces(true);
    setPlacesError(null);

    try {
      const data = await safetyService.getNearbySafetyPlaces({
        latitude: userLat,
        longitude: userLng,
        type: activeCategory,
        radiusKm: searchRadius,
        limit: 24,
      });

      if (data) {
        setPlaces(data.places || []);
        setPlacesSummary(data.summary || { hospitals: 0, police: 0, pharmacies: 0, total: 0 });
      }
    } catch (err) {
      setPlacesError(err.response?.data?.message || err.message || t('safety.errorFetchingPlaces', 'Unable to fetch nearby safety services.'));
      setPlaces([]);
    } finally {
      setLoadingPlaces(false);
    }
  };

  useEffect(() => {
    fetchNearbyPlaces();
  }, [userLat, userLng, activeCategory, searchRadius]);

  // 4. Fetch user's trusted contacts if authenticated
  const fetchContacts = async () => {
    if (!isAuthenticated) return;
    setLoadingContacts(true);
    try {
      const data = await safetyService.getTrustedContacts();
      setTrustedContacts(data?.contacts || []);
    } catch (err) {
      console.warn('Failed to load trusted contacts:', err.message);
    } finally {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchContacts();
    }
  }, [isAuthenticated]);

  // Quick Action Handler (Feature 7)
  const handleQuickAction = (categoryType) => {
    setActiveCategory(categoryType);
    const placesSection = document.getElementById('safety-places-list');
    if (placesSection) {
      placesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Open Route Modal (Feature 8 & 9)
  const handleOpenDirections = async (place) => {
    setSelectedFacilityForRoute(place);
    setLoadingRoute(true);
    try {
      const data = await locationService.getRouteDirections({
        originLat: userLat,
        originLng: userLng,
        destLat: place.latitude,
        destLng: place.longitude,
        travelMode: 'driving',
      });
      setRouteData(data);
    } catch (err) {
      console.warn('Failed to calculate route:', err.message);
    } finally {
      setLoadingRoute(false);
    }
  };

  // Open Location Sharing Modal (Feature 11 & 16)
  const handleOpenShareModal = async () => {
    if (!isAuthenticated) {
      if (showToast) showToast('⚠️ Please log in to share your location with trusted contacts.');
      navigate('/login');
      return;
    }

    setPreparingShare(true);
    setShareModalOpen(true);
    try {
      const payload = await safetyService.prepareLocationShare({
        latitude: userLat,
        longitude: userLng,
        customMessage: shareCustomMsg,
      });
      setSharePayload(payload);
    } catch (err) {
      if (showToast) showToast('⚠️ ' + (err.message || 'Failed to prepare location update.'));
    } finally {
      setPreparingShare(false);
    }
  };

  // Execute Native or WhatsApp Share with explicit confirmation
  const handleConfirmShare = (type) => {
    if (!sharePayload) return;

    if (type === 'native' && navigator.share) {
      navigator
        .share({
          title: '🚨 Emergency Location Update',
          text: sharePayload.share_text,
          url: sharePayload.google_maps_url,
        })
        .then(() => {
          if (showToast) showToast('✅ Location shared successfully.');
          setShareModalOpen(false);
        })
        .catch(() => {});
    } else if (type === 'whatsapp') {
      window.open(sharePayload.whatsapp_url, '_blank');
      if (showToast) showToast('✅ WhatsApp emergency update opened.');
      setShareModalOpen(false);
    } else if (type === 'sms') {
      window.open(sharePayload.sms_url, '_blank');
      if (showToast) showToast('✅ SMS emergency update opened.');
      setShareModalOpen(false);
    } else if (type === 'copy') {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(sharePayload.share_text);
        if (showToast) showToast('📋 Safety message copied to clipboard.');
      }
      setShareModalOpen(false);
    }
  };

  // Trusted Contact Form Handlers (Feature 12)
  const handleOpenAddContact = () => {
    setEditingContact(null);
    setContactForm({
      name: '',
      phone: '',
      relationship: 'Family',
      email: '',
      is_primary: trustedContacts.length === 0,
    });
    setContactModalOpen(true);
  };

  const handleOpenEditContact = (contact) => {
    setEditingContact(contact);
    setContactForm({
      name: contact.name || '',
      phone: contact.phone || '',
      relationship: contact.relationship || 'Family',
      email: contact.email || '',
      is_primary: Boolean(contact.is_primary),
    });
    setContactModalOpen(true);
  };

  const handleSaveContact = async (e) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.phone.trim()) {
      alert('Please provide contact name and phone number.');
      return;
    }

    try {
      if (editingContact) {
        await safetyService.updateTrustedContact(editingContact.id, contactForm);
        if (showToast) showToast('✅ Trusted contact updated.');
      } else {
        await safetyService.createTrustedContact(contactForm);
        if (showToast) showToast('✅ New trusted contact saved.');
      }
      setContactModalOpen(false);
      fetchContacts();
    } catch (err) {
      alert('Error saving contact: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm(t('safety.confirmDeleteContact', 'Are you sure you want to delete this trusted contact?'))) return;
    try {
      await safetyService.deleteTrustedContact(contactId);
      if (showToast) showToast('🗑️ Contact deleted.');
      fetchContacts();
    } catch (err) {
      alert('Failed to delete contact: ' + (err.response?.data?.message || err.message));
    }
  };

  const emergencyNumbers = emergencyData?.emergency_numbers;

  return (
    <div className="safety-page-container" style={{ padding: '2rem 0', minHeight: '85vh' }}>
      <div className="container">
        {/* ========================================================================= */}
        {/* HEADER & PRIVACY NOTICE (Feature 1 & Feature 16) */}
        {/* ========================================================================= */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            borderRadius: '24px',
            padding: '2rem 2.5rem',
            color: '#ffffff',
            boxShadow: '0 20px 40px rgba(15, 23, 42, 0.25)',
            marginBottom: '2rem',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2rem' }}>🛡️</span>
            <span
              style={{
                textTransform: 'uppercase',
                letterSpacing: '2px',
                fontSize: '0.82rem',
                fontWeight: '800',
                color: '#34d399',
              }}
            >
              {t('safety.badge', 'Travelora Safety & Emergency Assistant')}
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.4rem)', fontWeight: '900', margin: '0.25rem 0 0.75rem', letterSpacing: '-0.5px' }}>
            {t('safety.mainTitle', 'Travel Safety & Emergency Services')}
          </h1>

          <p style={{ margin: 0, color: '#94a3b8', fontSize: '1rem', maxWidth: '750px', lineHeight: '1.6' }}>
            {t(
              'safety.mainSubtitle',
              'Quickly locate verified nearby hospitals, police stations, 24/7 pharmacies, and official country emergency hotlines in real-time.'
            )}
          </p>

          {/* Privacy Principle Banner (Feature 16) */}
          <div
            style={{
              marginTop: '1.25rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              padding: '0.45rem 0.9rem',
              fontSize: '0.82rem',
              color: '#cbd5e1',
            }}
          >
            <span>🔒</span>
            <span>
              <strong>Privacy Guaranteed:</strong> Location is checked on-demand only. No continuous tracking or public exposure.
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CURRENT LOCATION STATUS CARD (Feature 2) */}
        {/* ========================================================================= */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            padding: '1.25rem 1.75rem',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: hasGps ? '#dcfce7' : '#fee2e2',
                color: hasGps ? '#15803d' : '#b91c1c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
              }}
            >
              📍
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>
                {t('safety.currentLocationLabel', 'Current Search Location')}
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                {currentLocation?.locationLabel || currentLocation?.city || 'Chennai, Tamil Nadu, India'}
              </div>
              {currentLocation?.formattedAddress && (
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                  {currentLocation.formattedAddress}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => detectLocation()}
              disabled={locationStatus === 'detecting'}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                padding: '0.65rem 1.25rem',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '0.88rem',
                color: '#1e293b',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s ease',
              }}
            >
              {locationStatus === 'detecting' ? '⏳ Detecting GPS...' : '🔄 Refresh Location'}
            </button>
          </div>
        </div>

        {/* Location Permission Denied Warning (Feature 2 & 17) */}
        {locationStatus === 'denied' && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '14px',
              padding: '1rem 1.5rem',
              marginBottom: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#991b1b',
              fontSize: '0.92rem',
            }}
          >
            <span style={{ fontSize: '1.4rem' }}>⚠️</span>
            <div>
              <strong>Location Permission Disabled:</strong> Showing verified safety services for your default destination. Enable browser location access to automatically find services near your real coordinates.
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* QUICK ACTION BUTTONS (Feature 7 & Feature 23 - Large touch targets) */}
        {/* ========================================================================= */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.85rem' }}>
            ⚡ {t('safety.quickActionsTitle', 'Quick Emergency Actions')}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
            }}
          >
            <button
              onClick={() => handleQuickAction('hospital')}
              style={{
                background: activeCategory === 'hospital' ? '#dc2626' : '#ffffff',
                color: activeCategory === 'hospital' ? '#ffffff' : '#991b1b',
                border: '2px solid #ef4444',
                borderRadius: '16px',
                padding: '1.15rem 1rem',
                fontWeight: '800',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.15)',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ fontSize: '1.8rem' }}>🏥</span>
              <span>{t('safety.btnFindHospital', 'Find Hospital')}</span>
            </button>

            <button
              onClick={() => handleQuickAction('police')}
              style={{
                background: activeCategory === 'police' ? '#0284c7' : '#ffffff',
                color: activeCategory === 'police' ? '#ffffff' : '#0369a1',
                border: '2px solid #38bdf8',
                borderRadius: '16px',
                padding: '1.15rem 1rem',
                fontWeight: '800',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.15)',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ fontSize: '1.8rem' }}>🚓</span>
              <span>{t('safety.btnFindPolice', 'Find Police')}</span>
            </button>

            <button
              onClick={() => handleQuickAction('pharmacy')}
              style={{
                background: activeCategory === 'pharmacy' ? '#16a34a' : '#ffffff',
                color: activeCategory === 'pharmacy' ? '#ffffff' : '#15803d',
                border: '2px solid #4ade80',
                borderRadius: '16px',
                padding: '1.15rem 1rem',
                fontWeight: '800',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 14px rgba(22, 163, 74, 0.15)',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ fontSize: '1.8rem' }}>💊</span>
              <span>{t('safety.btnFindPharmacy', 'Find Pharmacy')}</span>
            </button>

            <button
              onClick={() => {
                const emergencyEl = document.getElementById('country-emergency-section');
                if (emergencyEl) emergencyEl.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                background: '#ffffff',
                color: '#b45309',
                border: '2px solid #f59e0b',
                borderRadius: '16px',
                padding: '1.15rem 1rem',
                fontWeight: '800',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.15)',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ fontSize: '1.8rem' }}>🚨</span>
              <span>{t('safety.btnEmergencyHelp', 'Emergency Help')}</span>
            </button>

            <button
              onClick={handleOpenShareModal}
              style={{
                background: '#ffffff',
                color: '#7c3aed',
                border: '2px solid #c084fc',
                borderRadius: '16px',
                padding: '1.15rem 1rem',
                fontWeight: '800',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.15)',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ fontSize: '1.8rem' }}>📤</span>
              <span>{t('safety.btnShareLocation', 'Share My Location')}</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COUNTRY EMERGENCY CONTACTS SECTION (Feature 6) */}
        {/* ========================================================================= */}
        <div
          id="country-emergency-section"
          style={{
            background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
            border: '2px solid #fecdd3',
            borderRadius: '20px',
            padding: '1.75rem',
            marginBottom: '2.5rem',
            boxShadow: '0 8px 25px rgba(225, 29, 72, 0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.25rem',
              borderBottom: '1px solid #fecdd3',
              paddingBottom: '1rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🚨</span>
                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: '900', color: '#9f1239' }}>
                  {t('safety.emergencyNumbersTitle', 'Official Emergency Hotlines')}
                </h3>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.88rem', color: '#881337' }}>
                {t('safety.verifiedDispatchNotice', 'Verified direct-dial numbers for')} <strong>{selectedCountry}</strong>
              </p>
            </div>

            {/* Country Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#881337' }}>Country:</label>
              <select
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value);
                  fetchEmergencyNumbers(e.target.value);
                }}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid #fda4af',
                  fontWeight: '700',
                  color: '#881337',
                  background: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                {emergencyData?.available_countries ? (
                  emergencyData.available_countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="France">France</option>
                    <option value="Japan">Japan</option>
                    <option value="Indonesia">Indonesia (Bali)</option>
                    <option value="Switzerland">Switzerland</option>
                    <option value="Greece">Greece</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Emergency Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
            }}
          >
            {/* Universal / Emergency Services */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                padding: '1.25rem',
                border: '1.5px solid #f43f5e',
                boxShadow: '0 4px 12px rgba(244, 63, 94, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#e11d48', textTransform: 'uppercase' }}>
                  🚨 {t('safety.universalEmergency', 'Emergency Services')}
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', margin: '0.25rem 0' }}>
                  {emergencyNumbers?.universal || '112'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  All-in-one centralized emergency dispatch
                </div>
              </div>
              <a
                href={`tel:${emergencyNumbers?.universal || '112'}`}
                style={{
                  marginTop: '1rem',
                  background: '#e11d48',
                  color: '#ffffff',
                  padding: '0.65rem',
                  borderRadius: '10px',
                  textAlign: 'center',
                  fontWeight: '800',
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                📞 Call {emergencyNumbers?.universal || '112'}
              </a>
            </div>

            {/* Police */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                padding: '1.25rem',
                border: '1.5px solid #38bdf8',
                boxShadow: '0 4px 12px rgba(56, 189, 248, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase' }}>
                  🚓 {t('safety.policeHotline', 'Police Dispatch')}
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', margin: '0.25rem 0' }}>
                  {emergencyNumbers?.police || '100'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Law enforcement & tourist safety
                </div>
              </div>
              <a
                href={`tel:${emergencyNumbers?.police || '100'}`}
                style={{
                  marginTop: '1rem',
                  background: '#0284c7',
                  color: '#ffffff',
                  padding: '0.65rem',
                  borderRadius: '10px',
                  textAlign: 'center',
                  fontWeight: '800',
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                📞 Call {emergencyNumbers?.police || '100'}
              </a>
            </div>

            {/* Medical Emergency / Ambulance */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                padding: '1.25rem',
                border: '1.5px solid #4ade80',
                boxShadow: '0 4px 12px rgba(74, 222, 128, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#16a34a', textTransform: 'uppercase' }}>
                  🏥 {t('safety.ambulanceHotline', 'Medical Emergency / Ambulance')}
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', margin: '0.25rem 0' }}>
                  {emergencyNumbers?.ambulance || '108'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Paramedics & trauma medical transport
                </div>
              </div>
              <a
                href={`tel:${emergencyNumbers?.ambulance || '108'}`}
                style={{
                  marginTop: '1rem',
                  background: '#16a34a',
                  color: '#ffffff',
                  padding: '0.65rem',
                  borderRadius: '10px',
                  textAlign: 'center',
                  fontWeight: '800',
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                📞 Call {emergencyNumbers?.ambulance || '108'}
              </a>
            </div>

            {/* Fire Services */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                padding: '1.25rem',
                border: '1.5px solid #fb923c',
                boxShadow: '0 4px 12px rgba(251, 146, 60, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#ea580c', textTransform: 'uppercase' }}>
                  🚒 {t('safety.fireHotline', 'Fire & Rescue')}
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', margin: '0.25rem 0' }}>
                  {emergencyNumbers?.fire || '101'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Fire brigade and disaster rescue
                </div>
              </div>
              <a
                href={`tel:${emergencyNumbers?.fire || '101'}`}
                style={{
                  marginTop: '1rem',
                  background: '#ea580c',
                  color: '#ffffff',
                  padding: '0.65rem',
                  borderRadius: '10px',
                  textAlign: 'center',
                  fontWeight: '800',
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                📞 Call {emergencyNumbers?.fire || '101'}
              </a>
            </div>
          </div>

          {emergencyNumbers?.notes && (
            <div style={{ marginTop: '1rem', fontSize: '0.82rem', color: '#881337', fontStyle: 'italic' }}>
              💡 {emergencyNumbers.notes}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* NEARBY SAFETY PLACES EXPLORER (Feature 3, 4, 5, 18, 19) */}
        {/* ========================================================================= */}
        <div id="safety-places-list" style={{ marginBottom: '3rem' }}>
          {/* Controls Bar: Category Filter Tabs & Radius Selector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            {/* Category Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: `🌟 All (${placesSummary.total})` },
                { id: 'hospital', label: `🏥 Hospitals (${placesSummary.hospitals})` },
                { id: 'police', label: `🚓 Police (${placesSummary.police})` },
                { id: 'pharmacy', label: `💊 Pharmacies (${placesSummary.pharmacies})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  style={{
                    padding: '0.65rem 1.15rem',
                    borderRadius: '12px',
                    border: activeCategory === tab.id ? '2px solid #0f172a' : '1px solid #cbd5e1',
                    background: activeCategory === tab.id ? '#0f172a' : '#ffffff',
                    color: activeCategory === tab.id ? '#ffffff' : '#334155',
                    fontWeight: '800',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Radius Selector (Feature 18) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>
                🔍 {t('safety.searchRadius', 'Search Radius')}:
              </span>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {[1, 5, 10, 25].map((r) => (
                  <button
                    key={r}
                    onClick={() => setSearchRadius(r)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '8px',
                      border: searchRadius === r ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      background: searchRadius === r ? '#e0f2fe' : '#ffffff',
                      color: searchRadius === r ? '#0369a1' : '#64748b',
                      fontWeight: '800',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Places Results List */}
          {loadingPlaces ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#0f172a', fontWeight: '700' }}>
              ⏳ {t('safety.findingNearby', 'Searching verified nearby emergency services...')}
            </div>
          ) : placesError ? (
            <div style={{ padding: '1.5rem', background: '#fee2e2', borderRadius: '14px', color: '#b91c1c', textAlign: 'center' }}>
              ⚠️ {placesError}
            </div>
          ) : places.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 2rem',
                background: '#ffffff',
                borderRadius: '18px',
                border: '1px solid #e2e8f0',
                color: '#64748b',
              }}
            >
              <span style={{ fontSize: '2.5rem' }}>🏥</span>
              <h4 style={{ margin: '0.75rem 0 0.25rem', color: '#0f172a' }}>
                {t('safety.noPlacesFoundTitle', 'No nearby facilities found within the selected radius.')}
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                Try expanding your search radius to 25 km or dial official emergency services at <strong>{emergencyNumbers?.universal || '112'}</strong>.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {places.map((place) => {
                const isHospital = place.category === 'hospital';
                const isPolice = place.category === 'police';
                const isPharmacy = place.category === 'pharmacy';

                return (
                  <div
                    key={place.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '18px',
                      border: '1px solid #e2e8f0',
                      padding: '1.35rem',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                  >
                    <div>
                      {/* Badge Row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                        <span
                          style={{
                            background: isHospital ? '#fee2e2' : isPolice ? '#e0f2fe' : '#dcfce7',
                            color: isHospital ? '#b91c1c' : isPolice ? '#0369a1' : '#15803d',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '800',
                          }}
                        >
                          {place.category_label || place.category}
                        </span>

                        <span
                          style={{
                            background: '#f1f5f9',
                            color: '#0f172a',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: '800',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          📍 {place.distance_label}
                        </span>
                      </div>

                      <h4 style={{ margin: '0 0 0.4rem', fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', lineHeight: '1.4' }}>
                        {place.name}
                      </h4>

                      <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.4', marginBottom: '0.6rem' }}>
                        📍 {place.address}
                      </div>

                      {/* Status / Hours */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                        {place.is_open_24_7 ? (
                          <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700' }}>
                            🟢 24/7 Open
                          </span>
                        ) : place.operating_hours ? (
                          <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700' }}>
                            🕒 {place.operating_hours}
                          </span>
                        ) : null}

                        {place.verified && (
                          <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700' }}>
                            ✓ Verified Facility
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      {place.phone && (
                        <a
                          href={`tel:${place.phone}`}
                          style={{
                            flex: 1,
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            color: '#0f172a',
                            padding: '0.65rem',
                            borderRadius: '10px',
                            fontSize: '0.85rem',
                            fontWeight: '800',
                            textAlign: 'center',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          📞 Call
                        </a>
                      )}

                      <button
                        onClick={() => handleOpenDirections(place)}
                        style={{
                          flex: 1.3,
                          background: isHospital ? '#dc2626' : isPolice ? '#0284c7' : '#16a34a',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.65rem',
                          borderRadius: '10px',
                          fontSize: '0.85rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        🗺️ {t('safety.fastestRoute', 'Fastest Route')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* TRUSTED EMERGENCY CONTACTS MANAGER (Feature 12) */}
        {/* ========================================================================= */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            padding: '2rem',
            marginBottom: '3rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              borderBottom: '1px solid #f1f5f9',
              paddingBottom: '1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>👥</span>
                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: '900', color: '#0f172a' }}>
                  {t('safety.trustedContactsTitle', 'My Trusted Emergency Contacts')}
                </h3>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.88rem', color: '#64748b' }}>
                {t('safety.trustedContactsSubtitle', 'Save family or close friends to quickly share location updates in an emergency.')}
              </p>
            </div>

            <button
              onClick={handleOpenAddContact}
              style={{
                background: '#0f766e',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '0.75rem 1.25rem',
                fontWeight: '800',
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 12px rgba(15, 118, 110, 0.2)',
              }}
            >
              + {t('safety.addContact', 'Add Trusted Contact')}
            </button>
          </div>

          {!isAuthenticated ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              🔒 Please <strong style={{ color: '#0f766e', cursor: 'pointer' }} onClick={() => navigate('/login')}>log in</strong> to securely store and manage personal emergency contacts.
            </div>
          ) : loadingContacts ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              ⏳ Loading your trusted contacts...
            </div>
          ) : trustedContacts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              <p style={{ margin: 0 }}>No trusted contacts added yet. Add a family member or emergency contact above.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {trustedContacts.map((contact) => (
                <div
                  key={contact.id}
                  style={{
                    background: '#f8fafc',
                    borderRadius: '14px',
                    border: contact.is_primary ? '2px solid #0f766e' : '1px solid #cbd5e1',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', background: '#e2e8f0', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#334155' }}>
                        {contact.relationship || 'Contact'}
                      </span>
                      {contact.is_primary && (
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                          ★ Primary Contact
                        </span>
                      )}
                    </div>

                    <h4 style={{ margin: '0.35rem 0 0.25rem', fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>
                      {contact.name}
                    </h4>

                    <div style={{ fontSize: '0.92rem', fontWeight: '700', color: '#0f766e', marginBottom: '0.25rem' }}>
                      📞 {contact.phone}
                    </div>

                    {contact.email && (
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        ✉️ {contact.email}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                    <a
                      href={`tel:${contact.phone}`}
                      style={{
                        flex: 1,
                        background: '#0f766e',
                        color: '#ffffff',
                        padding: '0.45rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        textAlign: 'center',
                        textDecoration: 'none',
                      }}
                    >
                      Call
                    </a>
                    <button
                      onClick={() => handleOpenEditContact(contact)}
                      style={{
                        flex: 1,
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        color: '#334155',
                        padding: '0.45rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteContact(contact.id)}
                      style={{
                        background: '#fee2e2',
                        border: '1px solid #fca5a5',
                        color: '#b91c1c',
                        padding: '0.45rem 0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* MODAL: DIRECTIONS & FASTEST ROUTE (Feature 8 & Feature 9) */}
        {/* ========================================================================= */}
        {selectedFacilityForRoute && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '24px',
                width: 'min(750px, 95vw)',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                position: 'relative',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '1.25rem 1.75rem',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#f8fafc',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase' }}>
                    🗺️ {t('safety.fastestRouteTo', 'Fastest Route To Facility')}
                  </span>
                  <h3 style={{ margin: '2px 0 0', fontSize: '1.25rem', fontWeight: '900', color: '#0f172a' }}>
                    {selectedFacilityForRoute.name}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setSelectedFacilityForRoute(null);
                    setRouteData(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#64748b',
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '1.5rem 1.75rem' }}>
                <InteractiveMapSection
                  origin={{
                    latitude: userLat,
                    longitude: userLng,
                    city: currentLocation?.city || 'Your Location',
                  }}
                  destination={{
                    latitude: selectedFacilityForRoute.latitude,
                    longitude: selectedFacilityForRoute.longitude,
                    name: selectedFacilityForRoute.name,
                    address: selectedFacilityForRoute.address,
                    category: selectedFacilityForRoute.category,
                  }}
                  title={`Fastest Route to ${selectedFacilityForRoute.name}`}
                />

                <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  {selectedFacilityForRoute.phone && (
                    <a
                      href={`tel:${selectedFacilityForRoute.phone}`}
                      style={{
                        background: '#f1f5f9',
                        color: '#0f172a',
                        padding: '0.75rem 1.25rem',
                        borderRadius: '10px',
                        fontWeight: '800',
                        fontSize: '0.9rem',
                        textDecoration: 'none',
                        border: '1px solid #cbd5e1',
                      }}
                    >
                      📞 Call Facility
                    </a>
                  )}

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${selectedFacilityForRoute.latitude},${selectedFacilityForRoute.longitude}&travelmode=driving`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: '#0284c7',
                      color: '#ffffff',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '10px',
                      fontWeight: '800',
                      fontSize: '0.9rem',
                      textDecoration: 'none',
                    }}
                  >
                    Open in Google Maps 🚀
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL: EMERGENCY LOCATION SHARING (Feature 11 & Feature 16) */}
        {/* ========================================================================= */}
        {shareModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '24px',
                width: 'min(550px, 95vw)',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '2rem',
                boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.6rem' }}>📤</span>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '900', color: '#0f172a' }}>
                    {t('safety.shareLocationTitle', 'Share My Location Update')}
                  </h3>
                </div>
                <button
                  onClick={() => setShareModalOpen(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
                >
                  ✕
                </button>
              </div>

              {/* Confirmation Notice (Feature 11 requirement) */}
              <div
                style={{
                  background: '#fffbeb',
                  border: '1.5px solid #fde68a',
                  borderRadius: '12px',
                  padding: '0.85rem 1rem',
                  color: '#92400e',
                  fontSize: '0.85rem',
                  marginBottom: '1.25rem',
                }}
              >
                ⚠️ <strong>Confirmation Required:</strong> Your current location pin and safe location description will be shared strictly upon your explicit selection. Travelora never tracks or shares your location automatically.
              </div>

              {preparingShare ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  ⏳ Preparing safe location payload...
                </div>
              ) : sharePayload ? (
                <div>
                  {/* Share Preview Card */}
                  <div
                    style={{
                      background: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      padding: '1rem',
                      marginBottom: '1.25rem',
                      fontFamily: 'monospace',
                      fontSize: '0.82rem',
                      whiteSpace: 'pre-wrap',
                      color: '#1e293b',
                      lineHeight: '1.4',
                    }}
                  >
                    {sharePayload.share_text}
                  </div>

                  {/* Sharing Action Options */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {navigator.share && (
                      <button
                        onClick={() => handleConfirmShare('native')}
                        style={{
                          background: '#7c3aed',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.85rem',
                          borderRadius: '12px',
                          fontWeight: '800',
                          fontSize: '0.92rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        📱 Share via Device (AirDrop / Messenger / All Apps)
                      </button>
                    )}

                    <button
                      onClick={() => handleConfirmShare('whatsapp')}
                      style={{
                        background: '#25D366',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.85rem',
                        borderRadius: '12px',
                        fontWeight: '800',
                        fontSize: '0.92rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      💬 Send via WhatsApp
                    </button>

                    <button
                      onClick={() => handleConfirmShare('sms')}
                      style={{
                        background: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.85rem',
                        borderRadius: '12px',
                        fontWeight: '800',
                        fontSize: '0.92rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      ✉️ Send via SMS
                    </button>

                    <button
                      onClick={() => handleConfirmShare('copy')}
                      style={{
                        background: '#f1f5f9',
                        color: '#0f172a',
                        border: '1px solid #cbd5e1',
                        padding: '0.75rem',
                        borderRadius: '12px',
                        fontWeight: '700',
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                      }}
                    >
                      📋 Copy Text & Link
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL: ADD / EDIT TRUSTED CONTACT (Feature 12) */}
        {/* ========================================================================= */}
        {contactModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '24px',
                width: 'min(480px, 95vw)',
                padding: '2rem',
                boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900', color: '#0f172a' }}>
                  {editingContact ? 'Edit Trusted Contact' : 'Add Trusted Contact'}
                </h3>
                <button
                  onClick={() => setContactModalOpen(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveContact} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="e.g. Sarah Reed (Mother)"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.92rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    placeholder="+1-555-0188 or +91-9876543210"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.92rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                    Relationship
                  </label>
                  <select
                    value={contactForm.relationship}
                    onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.92rem',
                    }}
                  >
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Spouse">Spouse / Partner</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Friend">Friend</option>
                    <option value="Colleague">Colleague</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="contact@example.com"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.92rem',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <input
                    type="checkbox"
                    id="is_primary"
                    checked={contactForm.is_primary}
                    onChange={(e) => setContactForm({ ...contactForm, is_primary: e.target.checked })}
                  />
                  <label htmlFor="is_primary" style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155', cursor: 'pointer' }}>
                    Set as Primary Emergency Contact
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setContactModalOpen(false)}
                    style={{
                      flex: 1,
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      padding: '0.75rem',
                      borderRadius: '10px',
                      fontWeight: '700',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1.5,
                      background: '#0f766e',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.75rem',
                      borderRadius: '10px',
                      fontWeight: '800',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                    }}
                  >
                    Save Contact
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
