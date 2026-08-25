import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import copilotService from '../services/copilotService';

export default function AiCopilotPage() {
  const { user, currentLocation, language, isOnline, t } = useAppContext();
  const [selectedTripId, setSelectedTripId] = useState(1);
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Load Copilot summary for selected trip
  const loadSummary = async (tripId) => {
    setLoadingSummary(true);
    try {
      const data = await copilotService.getTripSummary(tripId);
      setSummary(data);
    } catch (err) {
      console.warn('Failed to load trip summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    loadSummary(selectedTripId);
  }, [selectedTripId]);

  // Initial welcome message
  useEffect(() => {
    const welcome = {
      role: 'assistant',
      content:
        language === 'ta'
          ? `👋 **வணக்கம்! நான் உங்கள் AI பயண கோபைலட் (AI Travel Copilot).**\n\nவானிலை, தங்குமிடங்கள், பயண வழிகள், பட்ஜெட், பேக்கிங் மற்றும் பாதுகாப்பு ஆகியவற்றை நான் ஒரே இடத்தில் ஒருங்கிணைக்கிறேன்.\n\nகீழே உள்ள விரைவு பொத்தான்களைப் பயன்படுத்தலாம் அல்லது நீங்கள் விரும்பியதைக் கேட்கலாம்.`
          : `👋 **Hello! I am your AI Travel Copilot.**\n\nI am your unified intelligent command center for destination weather, stay bookings, transport routes, budget forecasting, packing checklists, and safety contacts.\n\nTap any quick action below or type/speak your question in English or தமிழ்!`,
      suggestions: [
        'What is the weather in Ooty?',
        'What should I pack for my trip?',
        'What is my estimated trip budget?',
        'What is pending before my trip?',
        'Show nearby tourist places',
      ],
      actionCards: summary?.actionCards || [],
      timestamp: new Date().toISOString(),
    };
    setMessages([welcome]);
  }, [language, summary]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loadingChat]);

  // Voice Recognition (Phase 18 Integration)
  const startVoiceInput = () => {
    if (typeof window === 'undefined') return;
    if (!isOnline) {
      alert(language === 'ta' ? 'குரல் உள்ளீட்டிற்கு இணைய இணைப்பு தேவை.' : 'Internet connection is required for voice assistant.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(t('voice.notSupported', 'Voice input is not supported in this browser.'));
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = language === 'ta' ? 'ta-IN' : 'en-IN';
      rec.interimResults = true;
      rec.continuous = false;

      rec.onstart = () => setIsListening(true);
      rec.onresult = (e) => {
        let transcript = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          transcript += e.results[i][0].transcript;
        }
        if (transcript) setInputMessage(transcript);
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);

      recognitionRef.current = rec;
      rec.start();
    } catch {
      setIsListening(false);
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  };

  // Send Message Handler
  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text || !text.trim() || loadingChat) return;

    const userMsg = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');

    if (!isOnline) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            language === 'ta'
              ? '📴 **நீங்கள் தற்போது ஆஃப்லைனில் உள்ளீர்கள்.**\n\nAI கோபைலட்டுக்கு இணைய இணைப்பு தேவை. உங்கள் சேமிக்கப்பட்ட பயணங்களை **ஆஃப்லைன் பயணங்கள் (Offline Trips)** பக்கத்தில் பார்க்கலாம்.'
              : '📴 **You are currently offline.**\n\nAI Travel Copilot requires an active internet connection. You can access all your saved trips, itineraries, and checklists in **Offline Trips**.',
          suggestions: ['Go to Offline Trips', 'Open My Trips'],
          actionCards: [{ id: 'offline', label: '📱 Open Offline Trips', url: '/offline-trips' }],
          timestamp: new Date().toISOString(),
        },
      ]);
      return;
    }

    setLoadingChat(true);

    try {
      const response = await copilotService.queryCopilot({
        message: text,
        tripId: selectedTripId,
        language,
        currentLocation: currentLocation
          ? { city: currentLocation.city || currentLocation.area || 'Current Location', lat: currentLocation.latitude, lng: currentLocation.longitude }
          : null,
      });

      if (response.confirmationRequired) {
        setConfirmModal({
          type: response.confirmationType,
          message:
            response.confirmationType === 'booking_confirmation'
              ? 'Would you like to proceed to the secure Booking Confirmation page?'
              : response.confirmationType === 'payment_confirmation'
              ? 'Would you like to proceed to the secure Payment Gateway?'
              : 'Are you sure you want to review cancellation options for this trip?',
          targetUrl:
            response.confirmationType === 'booking_confirmation'
              ? `/booking?tripId=${selectedTripId}`
              : response.confirmationType === 'payment_confirmation'
              ? `/my-trips?tab=upcoming`
              : `/my-trips?tab=upcoming`,
        });
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.reply,
          suggestions: response.suggestions || [],
          actionCards: response.actionCards || [],
          timestamp: response.timestamp || new Date().toISOString(),
        },
      ]);

      // Reload summary if action might have changed data
      loadSummary(selectedTripId);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I encountered a temporary connection issue. Please try again or explore your saved trips.',
          suggestions: ['Check weather', 'What should I pack?', 'Show my budget'],
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoadingChat(false);
    }
  };

  const facets = summary?.facets;
  const matrix = summary?.readinessMatrix;

  return (
    <div style={{ minHeight: '88vh', background: 'linear-gradient(180deg, #0b1120 0%, #0f172a 100%)', color: '#f8fafc', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
        {/* Top Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: '2.2rem' }}>🤖</span>
              <h1 style={{ fontSize: '2.2rem', fontWeight: '900', margin: 0, letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {t('copilot.title', 'AI Travel Copilot')}
              </h1>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: '800',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  background: isOnline ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: isOnline ? '#4ade80' : '#f87171',
                  border: `1px solid ${isOnline ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                }}
              >
                {isOnline ? '🟢 Live AI Connected' : '📴 Offline Mode'}
              </span>
            </div>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>
              {t('copilot.subtitle', 'Your unified intelligent command center for live weather, stays, routes, budgets, packing, safety, and readiness.')}
            </p>
          </div>

          {/* Active Trip Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>Active Trip:</label>
            <select
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(parseInt(e.target.value, 10))}
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#f8fafc',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '0.5rem 1rem',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '0.88rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value={1}>🌴 Bali Paradise Island (BK-001)</option>
              <option value={2}>🗼 Paris & Versailles (BK-002)</option>
              <option value={3}>⛰️ Ooty Hill Station (BK-003)</option>
            </select>
          </div>
        </div>

        {/* 12-Facet Unified Quick Status Grid & Readiness Matrix */}
        {summary && (
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.4)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: '1.5rem',
              marginBottom: '1.75rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            {/* Readiness Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.3rem' }}>🚀</span>
                <span style={{ fontWeight: '800', fontSize: '1.05rem', color: '#f8fafc' }}>
                  {summary.destination} • {t('copilot.readiness', 'Trip Readiness')}: <strong style={{ color: '#38bdf8' }}>{summary.overallReadinessScore}%</strong>
                </span>
                <span style={{ fontSize: '0.8rem', color: '#4ade80', fontWeight: '700', background: 'rgba(34, 197, 94, 0.15)', padding: '0.2rem 0.6rem', borderRadius: '8px' }}>
                  {summary.readinessStatus}
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                📅 {summary.travelDate} ({summary.durationDays} Days) • {summary.numTravelers} Travelers
              </div>
            </div>

            {/* Facets Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              {/* Weather Facet */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '14px', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.2rem' }}>🌦️ LIVE WEATHER</div>
                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#f1f5f9' }}>
                  {facets?.weather?.temp}°C • {facets?.weather?.condition}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#38bdf8' }}>Suitability: {facets?.weather?.outdoorSuitability}</div>
              </div>

              {/* Hotel Stay */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '14px', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.2rem' }}>🏨 HOTEL STAY</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {facets?.hotel?.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#4ade80' }}>● {facets?.hotel?.status}</div>
              </div>

              {/* Transport */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '14px', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.2rem' }}>🚗 TRANSPORT</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#f1f5f9' }}>
                  {facets?.transport?.title}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#4ade80' }}>● Confirmed</div>
              </div>

              {/* Budget Estimate */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '14px', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.2rem' }}>💰 BUDGET ESTIMATE</div>
                <div style={{ fontSize: '1rem', fontWeight: '900', color: '#4ade80' }}>
                  ₹{facets?.budget?.estimatedTotal?.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Stay + Transit + Food</div>
              </div>

              {/* Packing Progress */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '14px', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.2rem' }}>🎒 PACKING</div>
                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#f1f5f9' }}>
                  {facets?.packing?.packed} / {facets?.packing?.total} Items
                </div>
                <div style={{ fontSize: '0.72rem', color: '#ca8a04' }}>{facets?.packing?.percentage}% Packed</div>
              </div>

              {/* Document Readiness */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '14px', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginBottom: '0.2rem' }}>📋 CHECKLIST</div>
                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#f1f5f9' }}>
                  {facets?.checklist?.completed} / {facets?.checklist?.total} Tasks
                </div>
                <div style={{ fontSize: '0.72rem', color: '#38bdf8' }}>{facets?.checklist?.score}% Ready</div>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid: Copilot Console + Quick Actions Sidebar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.75rem', alignItems: 'start' }}>
          {/* Conversational Console */}
          <div
            style={{
              background: '#0f172a',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              height: '600px',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)',
              overflow: 'hidden',
            }}
          >
            {/* Messages Feed */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: msg.role === 'user' ? '80%' : '90%',
                    background: msg.role === 'user' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'rgba(30, 41, 59, 0.75)',
                    border: msg.role === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    padding: '1rem 1.25rem',
                    color: '#f8fafc',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                >
                  <div style={{ fontSize: '0.92rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </div>

                  {/* Suggestion Chips */}
                  {msg.suggestions?.length > 0 && (
                    <div style={{ marginTop: '0.85rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {msg.suggestions.map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleSendMessage(sug)}
                          style={{
                            background: 'rgba(56, 189, 248, 0.12)',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.78rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          💬 {sug}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Action Cards */}
                  {msg.actionCards?.length > 0 && (
                    <div style={{ marginTop: '0.85rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {msg.actionCards.map((card, cIdx) => (
                        <Link
                          key={cIdx}
                          to={card.url}
                          style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                            color: '#ffffff',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            padding: '0.4rem 0.85rem',
                            borderRadius: '10px',
                            fontSize: '0.82rem',
                            fontWeight: '700',
                            textDecoration: 'none',
                          }}
                        >
                          {card.label} →
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {loadingChat && (
                <div style={{ alignSelf: 'flex-start', background: 'rgba(30, 41, 59, 0.7)', padding: '0.75rem 1.25rem', borderRadius: '16px', color: '#94a3b8', fontSize: '0.88rem' }}>
                  🤖 Analyzing trip telemetry & live services...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Pills Bar */}
            <div style={{ background: 'rgba(15, 23, 42, 0.95)', borderTop: '1px solid rgba(255, 255, 255, 0.08)', padding: '0.6rem 1rem', display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
              {[
                { label: '📍 Nearby Places', query: 'Suggest tourist places near me' },
                { label: '🌦️ Weather', query: 'What is the weather forecast?' },
                { label: '💰 Budget', query: 'How much will my trip cost?' },
                { label: '🗺️ Itinerary', query: 'Show my day-by-day itinerary' },
                { label: '🎒 Packing', query: 'What should I pack for my trip?' },
                { label: '📋 Checklist', query: 'What is pending before my trip?' },
                { label: '🛡️ Safety', query: 'Show my verified emergency contacts' },
                { label: '🚗 Transport', query: 'Show transport options and costs' },
              ].map((qp, qIdx) => (
                <button
                  key={qIdx}
                  onClick={() => handleSendMessage(qp.query)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#e2e8f0',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {qp.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div style={{ padding: '1rem', background: '#0b1120', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={t('copilot.askPlaceholder', 'Ask anything about your trip, weather, budget, packing, or safety...')}
                style={{
                  flex: 1,
                  background: 'rgba(30, 41, 59, 0.8)',
                  color: '#f8fafc',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '0.75rem 1.1rem',
                  borderRadius: '12px',
                  fontSize: '0.92rem',
                  outline: 'none',
                }}
              />

              {/* Voice Input Button */}
              <button
                onClick={isListening ? stopVoiceInput : startVoiceInput}
                style={{
                  background: isListening ? '#ef4444' : 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                }}
                title={isListening ? 'Stop listening' : 'Speak to Copilot'}
              >
                {isListening ? '🔴' : '🎙️'}
              </button>

              {/* Send Button */}
              <button
                onClick={() => handleSendMessage()}
                disabled={loadingChat || !inputMessage.trim()}
                style={{
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.75rem 1.4rem',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                }}
              >
                Send
              </button>
            </div>
          </div>

          {/* Quick Action Navigation Cards Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: '0 0 0.25rem 0', color: '#e2e8f0' }}>
              ⚡ Action Command Center
            </h3>

            {[
              { label: '🗺️ Trip Planner & Itinerary', url: `/trip-planner?destination=${encodeURIComponent(summary?.destination || 'Ooty')}`, desc: 'Day-by-day smart schedule' },
              { label: '🎒 Smart Packing Assistant', url: `/packing?destination=${encodeURIComponent(summary?.destination || 'Ooty')}`, desc: 'Weather & activity checklists' },
              { label: '📋 Travel Documents Manager', url: `/checklist?destination=${encodeURIComponent(summary?.destination || 'Ooty')}`, desc: 'Readiness & voucher organizer' },
              { label: '📱 Offline Trip Mode', url: '/offline-trips', desc: 'Cached trips & offline viewer' },
              { label: '🛡️ Safety & Emergency Help', url: '/safety', desc: 'Verified 112 services & contacts' },
              { label: '📑 My Trips & Receipts', url: '/my-trips?tab=upcoming', desc: 'Confirmed bookings & vouchers' },
            ].map((action, aIdx) => (
              <Link
                key={aIdx}
                to={action.url}
                style={{
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '1rem',
                  textDecoration: 'none',
                  color: '#f8fafc',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.95rem', marginBottom: '0.2rem' }}>{action.label}</div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{action.desc}</div>
                </div>
                <span style={{ color: '#38bdf8', fontSize: '1.2rem', fontWeight: '800' }}>→</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Confirmation Modal Guard (Feature 20) */}
        {confirmModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(8px)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
            }}
          >
            <div
              style={{
                background: '#0f172a',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '24px',
                padding: '2rem',
                maxWidth: '480px',
                width: '100%',
                color: '#f8fafc',
                boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '0.75rem' }}>🔐</span>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', margin: '0 0 0.5rem 0' }}>
                User Confirmation Required
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#94a3b8', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                {confirmModal.message}
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  onClick={() => setConfirmModal(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#94a3b8',
                    border: 'none',
                    padding: '0.7rem 1.4rem',
                    borderRadius: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <Link
                  to={confirmModal.targetUrl}
                  onClick={() => setConfirmModal(null)}
                  style={{
                    background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.7rem 1.6rem',
                    borderRadius: '12px',
                    fontWeight: '700',
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}
                >
                  Proceed Securely →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
