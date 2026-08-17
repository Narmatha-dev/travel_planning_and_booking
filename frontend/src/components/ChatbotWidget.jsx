import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import chatbotService from '../services/chatbotService';

const MULTILINGUAL_STARTER_PROMPTS = [
  { label: '🏖️ Best beach for ₹20,000?', text: 'What is the best beach destination for 4 days with ₹20,000 budget?' },
  { label: '📦 Swiss Alps package', text: 'Tell me about the Swiss Alps package price and inclusions' },
  { label: '🏖️ ₹20,000-ல் சிறந்த கடற்கரை (தமிழ்)', text: '₹20,000 பட்ஜெட்டில் 4 நாட்கள் செல்ல சிறந்த கடற்கரை எது?' },
  { label: '📦 சுவிஸ் பேக்கேஜ் (தமிழ்)', text: 'சுவிஸ் ஆல்ப்ஸ் பேக்கேஜ் விலை மற்றும் விவரங்கள் சொல்லுங்கள்' },
  { label: '🏖️ 20000 budget beach (Thanglish)', text: 'Goa 4 days stay panna 20000 budget podhuma?' },
  { label: '📦 Swiss package evlo (Thanglish)', text: 'Swiss Alps package details and vilai sollunga' },
  { label: '📋 Cancellation & Refund Rules', text: 'What is Travelora cancellation and refund policy?' },
];

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        '👋 **Hello / வணக்கம்!**\n\nI am **Travelora AI**, your personal multilingual 24/7 travel assistant.\n\nAsk me in **English**, **தமிழ் (Tamil)**, or **Thanglish** about destinations, curated packages, budget planning, activity recommendations, or booking policies!',
      suggestions: [
        '🏖️ Best beach for ₹20,000',
        '📦 சுவிஸ் ஆல்ப்ஸ் பேக்கேஜ்',
        '🏖️ Goa-ku 20000 budget podhuma?',
        '📋 Cancellation policy',
      ],
      language: 'en',
      timestamp: new Date().toISOString(),
    },
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    // Append user message
    const userMsg = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await chatbotService.sendMessage(text);
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
        content: currentLang === 'ta'
          ? '⚠️ இணைப்பில் தற்காலிக சிக்கல் ஏற்பட்டுள்ளது. தயவுசெய்து மீண்டும் கேட்கவும்!'
          : currentLang === 'thanglish'
          ? '⚠️ Connection-la temporary problem aachu. Please marubadiyum try pannunga!'
          : '⚠️ I encountered a temporary connection issue. Please try asking again!',
        suggestions: ['Best beach for ₹20,000', 'Swiss Alps package'],
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await chatbotService.clearHistory();
      setCurrentLang('en');
      setMessages([
        {
          role: 'assistant',
          content: '✨ Chat history reset! / உரையாடல் வரலாறு மீட்டமைக்கப்பட்டது!\n\nHow can I assist your travel planning today? (English | தமிழ் | Thanglish)',
          suggestions: [
            '🏖️ Best beach for ₹20,000',
            '📦 சுவிஸ் ஆல்ப்ஸ் பேக்கேஜ்',
            '🏖️ Goa-ku 20000 budget podhuma?',
          ],
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch {}
  };

  // Helper to format text with simple markdown formatting (bold, headers, bullets)
  const renderFormattedContent = (content) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', margin: '0.6rem 0 0.3rem 0' }}>
            {line.replace('### ', '')}
          </h4>
        );
      }
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

      // Parse bold tags **text**
      const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
      const renderedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={idx} style={{ display: 'flex', gap: '0.35rem', margin: '0.2rem 0', fontSize: '0.85rem', lineHeight: '1.45' }}>
            <span style={{ color: '#0284c7' }}>•</span>
            <span>{renderedParts}</span>
          </div>
        );
      }

      if (!line.trim()) {
        return <div key={idx} style={{ height: '0.4rem' }} />;
      }

      return (
        <p key={idx} style={{ margin: '0.25rem 0', fontSize: '0.85rem', lineHeight: '1.45' }}>
          {renderedParts}
        </p>
      );
    });
  };

  const getLanguageLabel = () => {
    if (currentLang === 'ta') return '🇮🇳 தமிழ் (Tamil)';
    if (currentLang === 'thanglish') return '🇮🇳 Thanglish';
    return '🌐 English';
  };

  return (
    <>
      {/* Floating Trigger Pill */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '9999px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 24px rgba(2, 132, 199, 0.35)',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '0.9rem',
            zIndex: 9999,
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <span style={{ fontSize: '1.2rem' }}>💬</span>
          <span>AI Travel Assistant</span>
          <span
            style={{
              background: 'rgba(255,255,255,0.25)',
              padding: '2px 6px',
              borderRadius: '6px',
              fontSize: '0.7rem',
              fontWeight: '800',
            }}
          >
            EN | தமிழ்
          </span>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 6px #22c55e',
            }}
          />
        </button>
      )}

      {/* Expandable Chat Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '400px',
            maxWidth: 'calc(100vw - 32px)',
            height: '580px',
            maxHeight: 'calc(100vh - 48px)',
            background: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 12px 40px rgba(15, 23, 42, 0.22)',
            border: '1px solid #cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 9999,
            animation: 'fadeInUp 0.25s ease-out',
          }}
        >
          {/* Chat Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff',
              padding: '1rem 1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #334155',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.15rem',
                }}
              >
                🤖
              </div>
              <div>
                <div style={{ fontWeight: '800', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Travelora AI</span>
                  <span
                    style={{
                      background: '#0284c7',
                      color: '#ffffff',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontSize: '0.68rem',
                      fontWeight: '700',
                    }}
                  >
                    {getLanguageLabel()}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  Multilingual 24/7 Smart Travel Companion
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                onClick={handleClearHistory}
                title="Clear Chat History"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  padding: '4px 6px',
                  borderRadius: '4px',
                }}
              >
                🗑️
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  padding: '4px 6px',
                  borderRadius: '4px',
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Multilingual Starter Bar */}
          <div
            style={{
              padding: '0.5rem 0.75rem',
              background: '#f1f5f9',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              gap: '0.35rem',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              fontSize: '0.72rem',
            }}
          >
            {MULTILINGUAL_STARTER_PROMPTS.map((p, pIdx) => (
              <button
                key={pIdx}
                type="button"
                onClick={() => handleSendMessage(p.text)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '9999px',
                  padding: '2px 8px',
                  fontSize: '0.72rem',
                  color: '#0369a1',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              background: '#f8fafc',
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
                    maxWidth: '100%',
                  }}
                >
                  <div
                    style={{
                      background: isBot ? '#ffffff' : '#0284c7',
                      color: isBot ? '#1e293b' : '#ffffff',
                      borderRadius: isBot ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                      padding: '0.85rem 1rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      border: isBot ? '1px solid #e2e8f0' : 'none',
                      maxWidth: '88%',
                      wordBreak: 'break-word',
                    }}
                  >
                    {renderFormattedContent(msg.content)}

                    {/* Action Links */}
                    {isBot && msg.actionLinks && msg.actionLinks.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.75rem', borderTop: '1px dashed #cbd5e1', paddingTop: '0.5rem' }}>
                        {msg.actionLinks.map((link, lIdx) => (
                          <Link
                            key={lIdx}
                            to={link.url}
                            onClick={() => setIsOpen(false)}
                            style={{
                              background: '#f0f9ff',
                              border: '1px solid #bae6fd',
                              color: '#0369a1',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              textDecoration: 'none',
                            }}
                          >
                            🔗 {link.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Suggestion Chips */}
                  {isBot && msg.suggestions && msg.suggestions.length > 0 && index === messages.length - 1 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem', maxWidth: '90%' }}>
                      {msg.suggestions.map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => handleSendMessage(sug)}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '9999px',
                            padding: '3px 10px',
                            fontSize: '0.75rem',
                            color: '#0369a1',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
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

            {/* Typing Loader Indicator */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#ffffff', border: '1px solid #e2e8f0', padding: '0.6rem 0.85rem', borderRadius: '16px 16px 16px 4px', width: 'fit-content' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>
                  {currentLang === 'ta' ? 'டிராவலோரா சிந்திக்கிறது...' : currentLang === 'thanglish' ? 'Travelora yosikkudhu...' : 'Travelora AI is thinking...'}
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

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              padding: '0.75rem 1rem',
              background: '#ffffff',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              placeholder={
                currentLang === 'ta'
                  ? 'சுற்றுலா, பட்ஜெட், பேக்கேஜ் பற்றி தமிழில் கேட்கலாம்...'
                  : currentLang === 'thanglish'
                  ? 'Ask in English / Tamil / Thanglish...'
                  : 'Ask about destinations, budget, packages (English / தமிழ்)...'
              }
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.65rem 0.85rem',
                borderRadius: '9999px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
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
                transition: 'background 0.2s ease',
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
