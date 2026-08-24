import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import chatbotService from '../services/chatbotService';
import { useAppContext } from '../context/AppContext';

const QUICK_PROMPTS = [
  { label: '📍 Suggest places near me', text: 'Suggest places near me' },
  { label: '✈️ Plan a 3-day trip', text: 'Plan a 3-day trip to Ooty' },
  { label: '🏨 Find budget stays', text: 'Find budget stays' },
  { label: '🚗 Suggest transport', text: 'Suggest transport' },
  { label: '📅 Create itinerary', text: 'Create itinerary' },
  { label: '💵 Calculate trip budget', text: 'Calculate trip budget for ₹12,000' },
];

export default function ChatbotWidget() {
  const { currentLocation, selectedTransport, selectedHotel, favorites, user, language, t } = useAppContext();

  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');

  // Voice Assistant States (Phase 18)
  const [isListening, setIsListening] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [voiceNotice, setVoiceNotice] = useState(null);
  const recognitionRef = useRef(null);

  const QUICK_PROMPTS = [
    { label: `📍 ${t('chatbot.suggestPlaces', 'Suggest places near me')}`, text: t('chatbot.suggestPlaces', 'Suggest places near me') },
    { label: `🛡️ ${language === 'ta' ? 'பாதுகாப்பு & அவசர உதவி' : 'Emergency & Safety Help'}`, text: language === 'ta' ? 'அவசர உதவி மற்றும் மருத்துவமனை' : 'Find nearest hospital and emergency help' },
    { label: `✈️ ${t('chatbot.planTrip', 'Plan a 3-day trip')}`, text: language === 'ta' ? 'ஊட்டிக்கு 3 நாள் பயணத் திட்டம் போடு' : 'Plan a 3-day trip to Ooty' },
    { label: `🏨 ${t('chatbot.budgetStays', 'Find budget stays')}`, text: t('chatbot.budgetStays', 'Find budget stays') },
    { label: `🚗 ${t('chatbot.transport', 'Suggest transport')}`, text: t('chatbot.transport', 'Suggest transport') },
    { label: `📅 ${t('chatbot.itinerary', 'Create itinerary')}`, text: t('chatbot.itinerary', 'Create itinerary') },
  ];

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        '👋 **Hello! I am your AI Travel Assistant.**\n\nI can help you discover nearby destinations, find emergency safety services (hospitals, police, pharmacies), plan multi-day itineraries, recommend verified stays, and calculate trip budgets.\n\nYou can also tap the 🎙️ **Microphone** to speak in English or தமிழ்.\n\nHow can I help your journey today?',
      suggestions: [
        'Suggest places near me',
        'Find nearest hospital',
        'Emergency numbers',
        'Plan a 3-day trip',
        'Find budget stays',
      ],
      language: 'en',
      timestamp: new Date().toISOString(),
    },
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  // Clean speech synthesis & recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Clean Markdown syntax for natural text-to-speech
  const cleanTextForSpeech = (markdownText) => {
    if (!markdownText) return '';
    return markdownText
      .replace(/###/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[-•]/g, '')
      .replace(/[👋🤖🔒ℹ️🎉✨✈️🏨🚗📅💵📍⭐🏖️🏛️🌲🎒🏡🌟]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const startListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceNotice(t('voice.notSupported', 'Voice input is not supported in this browser. Please type your message.'));
      setTimeout(() => setVoiceNotice(null), 4000);
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const rec = new SpeechRecognition();
      rec.lang = language === 'ta' ? 'ta-IN' : 'en-IN';
      rec.interimResults = true;
      rec.continuous = false;

      rec.onstart = () => {
        setIsListening(true);
        setVoiceNotice(null);
      };

      rec.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInputMessage(transcript);
        }
      };

      rec.onerror = (event) => {
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setVoiceNotice(t('voice.micDenied', 'Microphone access is required for voice input. You can continue using text chat.'));
          setTimeout(() => setVoiceNotice(null), 5000);
        } else if (event.error === 'no-speech') {
          setVoiceNotice(t('voice.noSpeech', 'No speech was detected. Please tap Speak and try again.'));
          setTimeout(() => setVoiceNotice(null), 4000);
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      setIsListening(false);
      setVoiceNotice(t('voice.notSupported', 'Voice input error. Please type your message.'));
      setTimeout(() => setVoiceNotice(null), 4000);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  };

  const speakMessage = (content, index, msgLang) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setVoiceNotice('Text-to-speech is not supported in this browser.');
      setTimeout(() => setVoiceNotice(null), 3000);
      return;
    }

    // Toggle stop if already speaking this message
    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();

    const cleanText = cleanTextForSpeech(content);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const targetLang = (msgLang === 'ta' || language === 'ta') ? 'ta-IN' : 'en-US';
    utterance.lang = targetLang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices() || [];
    const matchedVoice = voices.find((v) => v.lang.startsWith(targetLang.slice(0, 2)) || v.lang === targetLang);
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => {
      setSpeakingIndex(index);
    };

    utterance.onend = () => {
      setSpeakingIndex(null);
    };

    utterance.onerror = () => {
      setSpeakingIndex(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    // Stop speaking when user sends a new message
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
    }

    // Append user message
    const userMsg = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    // Build context payload (Feature 4 & 21)
    const contextPayload = {
      language: language || 'en',
      currentLocation: currentLocation
        ? { city: currentLocation.city || currentLocation.area || 'Current GPS Location', lat: currentLocation.latitude, lng: currentLocation.longitude }
        : null,
      selectedTransport: selectedTransport
        ? { type: selectedTransport.title || selectedTransport.type, cost: selectedTransport.price }
        : null,
      selectedHotel: selectedHotel
        ? { name: selectedHotel.name, price: selectedHotel.approx_price_per_night }
        : null,
      savedFavorites: (favorites || []).slice(0, 6).map((f) => ({
        title: f.title,
        type: f.item_type,
        location: f.location,
      })),
      user: user ? { name: user.full_name, email: user.email } : null,
    };

    try {
      const response = await chatbotService.sendMessage(text, 'travelora_user_session', contextPayload);
      if (response.language) {
        setCurrentLang(response.language);
      }
      const botMsg = {
        role: 'assistant',
        content: response.reply,
        suggestions: response.suggestions || [],
        actionLinks: response.actionLinks || [],
        language: response.language || 'en',
        timestamp: response.timestamp || new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg = {
        role: 'assistant',
        content: '⚠️ **Travel Assistant is temporarily unavailable.** Please try asking again in a moment.',
        suggestions: ['Suggest places near me', 'Plan a 3-day trip', 'Find budget stays'],
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    const confirmed = window.confirm('Are you sure you want to clear the conversation history?');
    if (!confirmed) return;

    try {
      await chatbotService.clearHistory();
      setCurrentLang('en');
      setMessages([
        {
          role: 'assistant',
          content: '✨ **Chat history cleared!**\n\nHow would you like to plan your next getaway?',
          suggestions: [
            'Suggest places near me',
            'Plan a 3-day trip',
            'Find budget stays',
            'Calculate trip budget',
          ],
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch {}
  };

  // Helper to format markdown in assistant responses
  const renderFormattedContent = (content) => {
    if (!content) return null;
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Header 3
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} style={{ fontSize: '0.96rem', fontWeight: '800', color: '#0f172a', margin: '0.6rem 0 0.35rem 0' }}>
            {line.replace('### ', '')}
          </h4>
        );
      }
      // Header 4
      if (line.startsWith('#### ')) {
        return (
          <h5 key={idx} style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0369a1', margin: '0.4rem 0 0.2rem 0' }}>
            {line.replace('#### ', '')}
          </h5>
        );
      }

      // Bullet points
      const isBullet = line.startsWith('* ') || line.startsWith('- ');
      const cleanLine = isBullet ? line.substring(2) : line;

      // Simple bold parsing **text**
      const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={idx} style={{ display: 'flex', gap: '0.4rem', margin: '0.2rem 0', fontSize: '0.84rem', lineHeight: '1.45' }}>
            <span style={{ color: '#0284c7' }}>•</span>
            <span style={{ flex: 1 }}>{formattedParts}</span>
          </div>
        );
      }

      if (!line.trim()) {
        return <div key={idx} style={{ height: '0.4rem' }} />;
      }

      return (
        <p key={idx} style={{ margin: '0.25rem 0', fontSize: '0.84rem', lineHeight: '1.45' }}>
          {formattedParts}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Trigger Button (Feature 1) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'linear-gradient(135deg, #0284c7, #0369a1)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '9999px',
            padding: '0.75rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            boxShadow: '0 8px 24px rgba(2, 132, 199, 0.4)',
            cursor: 'pointer',
            zIndex: 9990,
            fontWeight: '800',
            fontSize: '0.9rem',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>🤖</span>
          <span>Ask Travel AI</span>
        </button>
      )}

      {/* Floating Chat Modal / Popup (Feature 2 & 20) */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '90vw',
            maxWidth: '400px',
            height: '80vh',
            maxHeight: '580px',
            background: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.22)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 9995,
            border: '1px solid #e2e8f0',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '0.85rem 1.1rem',
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                }}
              >
                🤖
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: '800' }}>Travelora Assistant</h4>
                <span style={{ fontSize: '0.72rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }}></span>
                  Context-Aware AI
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {/* Clear Chat Button (Feature 19) */}
              <button
                type="button"
                onClick={handleClearHistory}
                title="Clear Chat History"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#cbd5e1',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                🗑️ Clear
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  padding: '0 4px',
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Voice Notification / Error Banner (Feature 2, 17, 18) */}
          {voiceNotice && (
            <div
              style={{
                background: '#fff1f2',
                color: '#be123c',
                borderBottom: '1px solid #fecdd3',
                padding: '0.45rem 0.85rem',
                fontSize: '0.76rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem',
              }}
            >
              <span>ℹ️ {voiceNotice}</span>
              <button
                type="button"
                onClick={() => setVoiceNotice(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#be123c', fontWeight: '800' }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Quick Suggestion Prompts Carousel (Feature 3) */}
          <div
            style={{
              padding: '0.45rem 0.6rem',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              gap: '0.35rem',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            {QUICK_PROMPTS.map((qp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(qp.text)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '9999px',
                  padding: '3px 9px',
                  fontSize: '0.72rem',
                  fontWeight: '600',
                  color: '#0f172a',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Messages Body */}
          <div
            style={{
              flex: 1,
              padding: '1rem',
              overflowY: 'auto',
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
            }}
          >
            {messages.map((msg, index) => {
              const isBot = msg.role === 'assistant';
              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isBot ? 'flex-start' : 'flex-end',
                  }}
                >
                  <div
                    style={{
                      background: isBot ? '#ffffff' : '#0284c7',
                      color: isBot ? '#1e293b' : '#ffffff',
                      border: isBot ? '1px solid #e2e8f0' : 'none',
                      borderRadius: isBot ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                      padding: '0.75rem 0.95rem',
                      maxWidth: '88%',
                      wordBreak: 'break-word',
                      boxShadow: isBot ? '0 2px 8px rgba(0,0,0,0.03)' : '0 2px 8px rgba(2, 132, 199, 0.25)',
                    }}
                  >
                    {renderFormattedContent(msg.content)}

                    {/* Action Buttons (Feature 11 & 12) */}
                    {isBot && msg.actionLinks && msg.actionLinks.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.4rem',
                          flexWrap: 'wrap',
                          marginTop: '0.75rem',
                          borderTop: '1px dashed #cbd5e1',
                          paddingTop: '0.5rem',
                        }}
                      >
                        {msg.actionLinks.map((link, lIdx) => (
                          <Link
                            key={lIdx}
                            to={link.url}
                            onClick={() => setIsOpen(false)}
                            style={{
                              background: '#f0f9ff',
                              border: '1px solid #bae6fd',
                              color: '#0369a1',
                              padding: '4px 9px',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Text-To-Speech Listen Button (Feature 5 & 6) */}
                    {isBot && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.55rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.4rem' }}>
                        <button
                          type="button"
                          onClick={() => speakMessage(msg.content, index, msg.language)}
                          style={{
                            background: speakingIndex === index ? '#fef2f2' : '#f8fafc',
                            color: speakingIndex === index ? '#ef4444' : '#0284c7',
                            border: '1px solid ' + (speakingIndex === index ? '#fca5a5' : '#e2e8f0'),
                            borderRadius: '6px',
                            padding: '3px 8px',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease',
                          }}
                          aria-label={speakingIndex === index ? t('voice.stop', 'Stop') : t('voice.listen', 'Listen')}
                        >
                          {speakingIndex === index ? `⏹ ${t('voice.stop', 'Stop')}` : `🔊 ${t('voice.listen', 'Listen')}`}
                        </button>
                        {speakingIndex === index && (
                          <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }}></span>
                            {t('voice.speaking', 'Speaking...')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Suggestion Chips */}
                  {isBot && msg.suggestions && msg.suggestions.length > 0 && index === messages.length - 1 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.45rem', maxWidth: '90%' }}>
                      {msg.suggestions.map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => handleSendMessage(sug)}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '9999px',
                            padding: '3px 9px',
                            fontSize: '0.72rem',
                            color: '#0369a1',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading Indicator (Feature 7 & 18) */}
            {loading && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '16px 16px 16px 4px',
                  width: 'fit-content',
                }}
              >
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>
                  🤖 {t('voice.processing', 'Thinking...')}
                </span>
                <span style={{ display: 'inline-flex', gap: '2px' }}>
                  <span style={{ animation: 'bounce 0.8s infinite 0.1s' }}>•</span>
                  <span style={{ animation: 'bounce 0.8s infinite 0.2s' }}>•</span>
                  <span style={{ animation: 'bounce 0.8s infinite 0.3s' }}>•</span>
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Listening Live Indicator Bar (Feature 7) */}
          {isListening && (
            <div
              style={{
                background: '#fef2f2',
                borderTop: '1px solid #fecdd3',
                padding: '0.4rem 0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#dc2626',
                fontSize: '0.76rem',
                fontWeight: '700',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626', animation: 'pulse 1s infinite' }}></span>
                {t('voice.listening', 'Listening...')} ({language === 'ta' ? 'தமிழ்' : 'English'})
              </span>
              <button
                type="button"
                onClick={stopListening}
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          )}

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              padding: '0.75rem 0.9rem',
              background: '#ffffff',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            {/* Voice Input Microphone Button (Feature 1, 2, 7 & 15) */}
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              style={{
                background: isListening ? '#dc2626' : '#f1f5f9',
                color: isListening ? '#ffffff' : '#0284c7',
                border: '1px solid ' + (isListening ? '#b91c1c' : '#cbd5e1'),
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1rem',
                flexShrink: 0,
                transition: 'all 0.2s ease',
              }}
              title={isListening ? t('voice.listening', 'Listening...') : t('voice.speak', 'Speak')}
              aria-label={isListening ? 'Stop listening' : 'Start voice recognition'}
            >
              {isListening ? '⏹' : '🎙️'}
            </button>

            <input
              ref={inputRef}
              type="text"
              placeholder={t('chatbot.placeholder', 'Ask about places, stays, budget or itinerary...')}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.65rem 0.85rem',
                borderRadius: '9999px',
                border: '1px solid #cbd5e1',
                fontSize: '0.84rem',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              style={{
                background: inputMessage.trim() && !loading ? '#0284c7' : '#94a3b8',
                color: '#ffffff',
                border: 'none',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputMessage.trim() && !loading ? 'pointer' : 'default',
                fontSize: '1rem',
                flexShrink: 0,
              }}
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
