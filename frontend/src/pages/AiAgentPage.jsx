import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import aiAgentService from '../services/aiAgentService';

export default function AiAgentPage() {
  const { user, isAuthenticated } = useAppContext();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const sessionId = user?.id ? `user_agent_${user.id}` : 'guest_agent_session';

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `### 👋 Welcome to your Personal AI Travel Agent!\n\nI am your dedicated travel intelligence advisor powered by **Gemini AI**. Tell me your travel dream or requirements—such as:\n\n* *"I want to travel from Chennai to Ooty for 3 days with 2 people. My budget is ₹15,000. I like nature and sightseeing."*\n* *"Plan a 4-day Goa vacation for friends."*\n* *"Kerala backwaters and tea hills for 5 days."*\n\nI will instantly analyze your requirements, calculate budget distribution, and build a customized day-by-day itinerary!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [activePlan, setActivePlan] = useState(null);
  const [selectedDayTab, setSelectedDayTab] = useState(1);
  const [suggestions, setSuggestions] = useState([
    'I want to travel from Chennai to Ooty for 3 days with 2 people. My budget is ₹15,000. I like nature and sightseeing.',
    'Plan a 4-day trip to Goa with beaches and nightlife under ₹20,000 for 2.',
    'Family trip to Kerala for 5 days with Munnar & Alleppey.',
  ]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (customText = null) => {
    const textToSend = (customText || inputQuery).trim();
    if (!textToSend || loading) return;

    const userMsg = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputQuery('');
    setLoading(true);

    try {
      // Build history for backend multi-turn context
      const historyContext = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await aiAgentService.sendMessage(textToSend, sessionId, historyContext);

      if (res) {
        const agentMsg = {
          id: `agent_${Date.now()}`,
          role: 'assistant',
          content: res.message || 'Personalized itinerary updated successfully.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          data: res,
        };

        setMessages((prev) => [...prev, agentMsg]);

        if (res.isPlanReady && (res.tripOverview || res.itinerary?.length > 0)) {
          setActivePlan(res);
          setSelectedDayTab(1);
        }

        if (res.suggestions && Array.isArray(res.suggestions) && res.suggestions.length > 0) {
          setSuggestions(res.suggestions);
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error_${Date.now()}`,
          role: 'assistant',
          content: '⚠️ I encountered a temporary connection glitch. Please try sending your request again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (prompt) => {
    handleSend(prompt);
  };

  const handleModifyPlan = (modificationText) => {
    handleSend(modificationText);
  };

  const handleBookPlan = () => {
    if (!activePlan) return;
    const dest = activePlan.extractedRequirements?.destination || activePlan.tripOverview?.destination || 'Ooty';
    const travelers = activePlan.extractedRequirements?.travelers || 2;
    navigate(`/booking?destination=${encodeURIComponent(dest)}&travelers=${travelers}`);
  };

  const handleOpenTripPlanner = () => {
    if (!activePlan) return;
    const dest = activePlan.extractedRequirements?.destination || activePlan.tripOverview?.destination || 'Ooty';
    const days = activePlan.extractedRequirements?.days || 3;
    const travelers = activePlan.extractedRequirements?.travelers || 2;
    navigate(`/trip-planner?destination=${encodeURIComponent(dest)}&days=${days}&travelers=${travelers}`);
  };

  const handleClearChat = async () => {
    try {
      await aiAgentService.clearHistory(sessionId);
    } catch {}
    setMessages([
      {
        id: 'welcome_new',
        role: 'assistant',
        content: `### 🔄 Session Reset\n\nReady for a fresh travel plan! Where would you like to explore?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setActivePlan(null);
    setSuggestions([
      'I want to travel from Chennai to Ooty for 3 days with 2 people. My budget is ₹15,000. I like nature and sightseeing.',
      'Plan a 4-day Goa vacation for friends.',
      'Plan a budget trip to Kerala under ₹12,000.',
    ]);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAF5F8',
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        paddingBottom: '3rem',
      }}
    >
      {/* Top Banner & Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e111a 0%, #2e1526 50%, #441733 100%)',
          color: '#ffffff',
          padding: '2.5rem 1.5rem 2rem',
          borderBottom: '1px solid rgba(236, 127, 169, 0.25)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #BE5985 0%, #EC7FA9 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.85rem',
                  boxShadow: '0 6px 16px rgba(190, 89, 133, 0.4)',
                }}
              >
                🤖
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h1 style={{ fontSize: '1.65rem', fontWeight: '900', margin: 0, color: '#ffffff' }}>
                    Travelora AI Travel Agent
                  </h1>
                  <span
                    style={{
                      background: 'rgba(236, 127, 169, 0.25)',
                      border: '1px solid #EC7FA9',
                      color: '#FFEDFA',
                      padding: '2px 10px',
                      borderRadius: '9999px',
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Powered by Gemini AI ⚡
                  </span>
                </div>
                <p style={{ color: '#E4C1D2', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
                  Intelligent natural-language travel requirement analysis, personalized itineraries & real-time plan refinement.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={handleClearChat}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                🔄 Reset Session
              </button>
              <Link
                to="/trip-planner"
                style={{
                  background: '#EC7FA9',
                  border: 'none',
                  color: '#ffffff',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: '800',
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(236, 127, 169, 0.4)',
                }}
              >
                🗺️ Manual Trip Planner
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div style={{ maxWidth: '1320px', margin: '2rem auto 0', padding: '0 1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 480px) 1fr', gap: '1.75rem', alignItems: 'start' }}>
          
          {/* LEFT PANEL: Conversation & Interactive AI Agent Input */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '1.5px solid #F3D2E5',
              boxShadow: '0 10px 30px rgba(190, 89, 133, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              height: 'calc(100vh - 200px)',
              minHeight: '640px',
              position: 'sticky',
              top: '20px',
            }}
          >
            {/* Left Header */}
            <div
              style={{
                padding: '1rem 1.25rem',
                borderBottom: '1px solid #F8E7F1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#FFF5FB',
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22C55E', display: 'inline-block' }}></span>
                <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#2D1520' }}>Agent Dialogue Stream</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#7A5366', fontWeight: '600' }}>
                {messages.length} Messages
              </span>
            </div>

            {/* Quick Prompt Chips */}
            <div
              style={{
                padding: '0.75rem 1rem',
                background: '#FAF0F5',
                borderBottom: '1px solid #F3D2E5',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                display: 'flex',
                gap: '0.5rem',
              }}
            >
              <button
                type="button"
                onClick={() => handleQuickPrompt('I want to travel from Chennai to Ooty for 3 days with 2 people. My budget is ₹15,000. I like nature and sightseeing.')}
                style={{
                  background: '#ffffff',
                  border: '1px solid #EC7FA9',
                  color: '#BE5985',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.74rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                🌲 Chennai to Ooty (3 Days, ₹15K)
              </button>
              <button
                type="button"
                onClick={() => handleQuickPrompt('Plan a 4-day Goa vacation for 2 people with beach, watersports and nightlife under ₹20,000.')}
                style={{
                  background: '#ffffff',
                  border: '1px solid #EC7FA9',
                  color: '#BE5985',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.74rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                🏖️ Goa 4-Day Getaway
              </button>
              <button
                type="button"
                onClick={() => handleQuickPrompt('5-day Kerala family trip with Munnar tea gardens and Alleppey houseboats.')}
                style={{
                  background: '#ffffff',
                  border: '1px solid #EC7FA9',
                  color: '#BE5985',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.74rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                🌴 Kerala 5-Day Tour
              </button>
            </div>

            {/* Chat Messages List */}
            <div
              style={{
                flex: 1,
                padding: '1.25rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '90%',
                        padding: isUser ? '0.8rem 1.1rem' : '1rem 1.25rem',
                        borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                        background: isUser
                          ? 'linear-gradient(135deg, #BE5985 0%, #EC7FA9 100%)'
                          : '#FFF5FB',
                        color: isUser ? '#ffffff' : '#2D1520',
                        border: isUser ? 'none' : '1px solid #F3D2E5',
                        fontSize: '0.9rem',
                        lineHeight: '1.5',
                        boxShadow: isUser
                          ? '0 4px 12px rgba(190, 89, 133, 0.25)'
                          : '0 2px 8px rgba(0, 0, 0, 0.03)',
                      }}
                    >
                      <div
                        style={{
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {msg.content}
                      </div>

                      {/* If response contains ready plan tag */}
                      {msg.data?.isPlanReady && (
                        <div
                          style={{
                            marginTop: '0.75rem',
                            paddingTop: '0.6rem',
                            borderTop: isUser ? '1px solid rgba(255,255,255,0.2)' : '1px solid #F3D2E5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '0.78rem',
                            fontWeight: '800',
                            color: isUser ? '#ffffff' : '#BE5985',
                          }}
                        >
                          <span>✨ Smart Itinerary Generated</span>
                          <span>👉 View details on right</span>
                        </div>
                      )}
                    </div>

                    <span
                      style={{
                        fontSize: '0.7rem',
                        color: '#A0758A',
                        marginTop: '4px',
                        padding: '0 4px',
                      }}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                );
              })}

              {/* Thinking / Generating Indicator */}
              {loading && (
                <div
                  style={{
                    alignSelf: 'flex-start',
                    background: '#FFF5FB',
                    border: '1.5px solid #EC7FA9',
                    borderRadius: '16px 16px 16px 2px',
                    padding: '0.85rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <div style={{ fontSize: '1.2rem', animation: 'spin 1.2s infinite linear' }}>⚡</div>
                  <div style={{ fontSize: '0.85rem', color: '#BE5985', fontWeight: '800' }}>
                    Gemini AI is analyzing requirements & building smart itinerary...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Contextual Suggestion Pills */}
            {suggestions.length > 0 && !loading && (
              <div
                style={{
                  padding: '0.5rem 1rem',
                  background: '#FFF5FB',
                  borderTop: '1px solid #F8E7F1',
                  display: 'flex',
                  gap: '0.4rem',
                  overflowX: 'auto',
                  whiteSpace: 'nowrap',
                }}
              >
                {suggestions.slice(0, 3).map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(sug)}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #F3D2E5',
                      color: '#7A5366',
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.15s',
                    }}
                    title={sug}
                  >
                    💡 {sug.length > 38 ? sug.substring(0, 38) + '...' : sug}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              style={{
                padding: '1rem',
                borderTop: '1px solid #F3D2E5',
                display: 'flex',
                gap: '0.6rem',
                background: '#ffffff',
                borderBottomLeftRadius: '20px',
                borderBottomRightRadius: '20px',
              }}
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask travel questions or modify your plan..."
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  border: '1.5px solid #F3D2E5',
                  fontSize: '0.9rem',
                  outline: 'none',
                  color: '#2D1520',
                }}
              />
              <button
                type="submit"
                disabled={loading || !inputQuery.trim()}
                style={{
                  background: 'linear-gradient(135deg, #BE5985 0%, #EC7FA9 100%)',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '12px',
                  padding: '0 1.25rem',
                  fontWeight: '800',
                  fontSize: '0.92rem',
                  cursor: loading || !inputQuery.trim() ? 'not-allowed' : 'pointer',
                  opacity: loading || !inputQuery.trim() ? 0.6 : 1,
                  boxShadow: '0 4px 12px rgba(190, 89, 133, 0.3)',
                }}
              >
                Send ➔
              </button>
            </form>
          </div>

          {/* RIGHT PANEL: Live Generated Plan & Smart Itinerary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* If no plan is generated yet */}
            {!activePlan && (
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '24px',
                  border: '1.5px solid #F3D2E5',
                  padding: '3rem 2rem',
                  textAlign: 'center',
                  boxShadow: '0 10px 30px rgba(190, 89, 133, 0.06)',
                }}
              >
                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✨</div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#2D1520', margin: '0 0 0.5rem 0' }}>
                  Your Personalized Trip Plan Will Appear Here
                </h2>
                <p style={{ color: '#7A5366', maxWidth: '580px', margin: '0 auto 2rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  Ask our AI Agent with your destination, duration, travelers, and budget. Gemini AI will automatically extract your preferences and build a real-time smart itinerary.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', textAlign: 'left' }}>
                  <div style={{ background: '#FFF5FB', padding: '1.25rem', borderRadius: '16px', border: '1px solid #F3D2E5' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎯</div>
                    <div style={{ fontWeight: '800', color: '#BE5985', fontSize: '0.9rem' }}>Requirement Detection</div>
                    <div style={{ color: '#7A5366', fontSize: '0.8rem', marginTop: '4px' }}>
                      Understands destination, origin, group size & budget automatically.
                    </div>
                  </div>

                  <div style={{ background: '#FFF5FB', padding: '1.25rem', borderRadius: '16px', border: '1px solid #F3D2E5' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📅</div>
                    <div style={{ fontWeight: '800', color: '#BE5985', fontSize: '0.9rem' }}>Day-by-Day Timeline</div>
                    <div style={{ color: '#7A5366', fontSize: '0.8rem', marginTop: '4px' }}>
                      Detailed Morning, Afternoon & Evening schedules with timings.
                    </div>
                  </div>

                  <div style={{ background: '#FFF5FB', padding: '1.25rem', borderRadius: '16px', border: '1px solid #F3D2E5' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💰</div>
                    <div style={{ fontWeight: '800', color: '#BE5985', fontSize: '0.9rem' }}>Budget Optimization</div>
                    <div style={{ color: '#7A5366', fontSize: '0.8rem', marginTop: '4px' }}>
                      Breakdowns for transit, stays, food, entry fees & activities.
                    </div>
                  </div>

                  <div style={{ background: '#FFF5FB', padding: '1.25rem', borderRadius: '16px', border: '1px solid #F3D2E5' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚡</div>
                    <div style={{ fontWeight: '800', color: '#BE5985', fontSize: '0.9rem' }}>1-Click Modification</div>
                    <div style={{ color: '#7A5366', fontSize: '0.8rem', marginTop: '4px' }}>
                      Say &quot;Make it cheaper&quot; or &quot;Add nature&quot; to update instantly.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* When Plan Is Active */}
            {activePlan && (
              <>
                {/* 1. Trip Overview & Extracted Requirements Card */}
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '20px',
                    border: '1.5px solid #F3D2E5',
                    padding: '1.5rem',
                    boxShadow: '0 8px 24px rgba(190, 89, 133, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <span
                        style={{
                          background: '#FFEDFA',
                          color: '#BE5985',
                          padding: '3px 12px',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                        }}
                      >
                        Generated Travel Plan
                      </span>
                      <h2 style={{ fontSize: '1.45rem', fontWeight: '900', color: '#2D1520', margin: '6px 0 2px 0' }}>
                        {activePlan.tripOverview?.destination || 'Customized Destination Plan'}
                      </h2>
                      <div style={{ color: '#7A5366', fontSize: '0.88rem' }}>
                        {activePlan.tripOverview?.highlightSummary || 'Personalized trip created with Gemini AI.'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={handleBookPlan}
                        style={{
                          background: 'linear-gradient(135deg, #BE5985 0%, #EC7FA9 100%)',
                          color: '#ffffff',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '10px',
                          fontSize: '0.85rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(190, 89, 133, 0.3)',
                        }}
                      >
                        🚀 Book This Trip
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenTripPlanner}
                        style={{
                          background: '#FFEDFA',
                          color: '#BE5985',
                          border: '1px solid #EC7FA9',
                          padding: '8px 14px',
                          borderRadius: '10px',
                          fontSize: '0.85rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                        }}
                      >
                        ✏️ Edit in Planner
                      </button>
                    </div>
                  </div>

                  {/* Extracted Requirement Badges Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: '0.75rem',
                      background: '#FFF5FB',
                      padding: '1rem',
                      borderRadius: '14px',
                      border: '1px solid #F8E7F1',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#7A5366', fontWeight: '700', textTransform: 'uppercase' }}>Origin</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#2D1520' }}>
                        📍 {activePlan.extractedRequirements?.origin || 'Chennai'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#7A5366', fontWeight: '700', textTransform: 'uppercase' }}>Duration</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#2D1520' }}>
                        ⏱️ {activePlan.tripOverview?.duration || `${activePlan.extractedRequirements?.days || 3} Days`}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#7A5366', fontWeight: '700', textTransform: 'uppercase' }}>Travelers</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#2D1520' }}>
                        👥 {activePlan.extractedRequirements?.travelers || 2} People
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#7A5366', fontWeight: '700', textTransform: 'uppercase' }}>Estimated Budget</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#BE5985' }}>
                        💳 {activePlan.tripOverview?.estimatedBudget || activePlan.extractedRequirements?.budget || '₹15,000'}
                      </div>
                    </div>
                  </div>

                  {/* Preferences tags */}
                  {activePlan.extractedRequirements?.preferences && (
                    <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#7A5366' }}>Preferences:</span>
                      {activePlan.extractedRequirements.preferences.map((p, i) => (
                        <span
                          key={i}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #EC7FA9',
                            color: '#BE5985',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                          }}
                        >
                          🌿 {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Interactive Day-by-Day Itinerary */}
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '20px',
                    border: '1.5px solid #F3D2E5',
                    padding: '1.5rem',
                    boxShadow: '0 8px 24px rgba(190, 89, 133, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#2D1520', margin: 0 }}>
                      📅 Day-by-Day Smart Itinerary
                    </h3>
                    
                    {/* Day Selection Tabs */}
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {activePlan.itinerary?.map((item, idx) => {
                        const dayNum = item.day || idx + 1;
                        const isSelected = selectedDayTab === dayNum;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedDayTab(dayNum)}
                            style={{
                              background: isSelected ? 'linear-gradient(135deg, #BE5985 0%, #EC7FA9 100%)' : '#FFF5FB',
                              color: isSelected ? '#ffffff' : '#BE5985',
                              border: isSelected ? 'none' : '1px solid #F3D2E5',
                              padding: '6px 14px',
                              borderRadius: '10px',
                              fontSize: '0.82rem',
                              fontWeight: '800',
                              cursor: 'pointer',
                              boxShadow: isSelected ? '0 3px 8px rgba(190, 89, 133, 0.3)' : 'none',
                            }}
                          >
                            Day {dayNum}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected Day Schedule Card */}
                  {(() => {
                    const currentDay =
                      activePlan.itinerary?.find((item, idx) => (item.day || idx + 1) === selectedDayTab) ||
                      activePlan.itinerary?.[0];

                    if (!currentDay) return null;

                    return (
                      <div style={{ background: '#FFF5FB', borderRadius: '16px', padding: '1.25rem', border: '1px solid #F8E7F1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#BE5985', margin: 0 }}>
                            Day {currentDay.day || selectedDayTab}: {currentDay.title}
                          </h4>
                          {currentDay.estimatedDayCost && (
                            <span
                              style={{
                                background: '#FFEDFA',
                                color: '#BE5985',
                                border: '1px solid #EC7FA9',
                                padding: '3px 10px',
                                borderRadius: '8px',
                                fontSize: '0.78rem',
                                fontWeight: '800',
                              }}
                            >
                              Est. Day Cost: {currentDay.estimatedDayCost}
                            </span>
                          )}
                        </div>

                        {/* Morning, Afternoon, Evening Slots */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                          {/* Morning */}
                          <div style={{ display: 'flex', gap: '0.75rem', background: '#ffffff', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #F3D2E5' }}>
                            <div style={{ fontSize: '1.3rem' }}>🌅</div>
                            <div>
                              <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#BE5985', textTransform: 'uppercase' }}>Morning</div>
                              <div style={{ fontSize: '0.88rem', color: '#2D1520', marginTop: '2px', lineHeight: '1.4' }}>
                                {currentDay.morning || 'Sightseeing & exploration'}
                              </div>
                            </div>
                          </div>

                          {/* Afternoon */}
                          <div style={{ display: 'flex', gap: '0.75rem', background: '#ffffff', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #F3D2E5' }}>
                            <div style={{ fontSize: '1.3rem' }}>☀️</div>
                            <div>
                              <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#BE5985', textTransform: 'uppercase' }}>Afternoon</div>
                              <div style={{ fontSize: '0.88rem', color: '#2D1520', marginTop: '2px', lineHeight: '1.4' }}>
                                {currentDay.afternoon || 'Local dining & leisure experiences'}
                              </div>
                            </div>
                          </div>

                          {/* Evening */}
                          <div style={{ display: 'flex', gap: '0.75rem', background: '#ffffff', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #F3D2E5' }}>
                            <div style={{ fontSize: '1.3rem' }}>🌙</div>
                            <div>
                              <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#BE5985', textTransform: 'uppercase' }}>Evening</div>
                              <div style={{ fontSize: '0.88rem', color: '#2D1520', marginTop: '2px', lineHeight: '1.4' }}>
                                {currentDay.evening || 'Relaxation, shopping & dinner'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Top Places in Day */}
                        {currentDay.places && currentDay.places.length > 0 && (
                          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#7A5366' }}>Key Highlights:</span>
                            {currentDay.places.map((place, pIdx) => (
                              <span
                                key={pIdx}
                                style={{
                                  background: '#FFEDFA',
                                  color: '#2D1520',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: '700',
                                }}
                              >
                                📌 {place}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* 3. Recommendations & Budget Distribution Card */}
                {activePlan.recommendations && (
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '20px',
                      border: '1.5px solid #F3D2E5',
                      padding: '1.5rem',
                      boxShadow: '0 8px 24px rgba(190, 89, 133, 0.08)',
                    }}
                  >
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#2D1520', margin: '0 0 1rem 0' }}>
                      💡 Smart Travel Recommendations
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                      {/* Transport */}
                      <div style={{ background: '#FFF5FB', padding: '1rem', borderRadius: '14px', border: '1px solid #F8E7F1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', color: '#BE5985', fontSize: '0.88rem' }}>
                          <span>🚆</span> Transport Strategy
                        </div>
                        <div style={{ fontSize: '0.84rem', color: '#2D1520', marginTop: '6px', lineHeight: '1.4' }}>
                          {activePlan.recommendations.transport}
                        </div>
                      </div>

                      {/* Stay */}
                      <div style={{ background: '#FFF5FB', padding: '1rem', borderRadius: '14px', border: '1px solid #F8E7F1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', color: '#BE5985', fontSize: '0.88rem' }}>
                          <span>🏨</span> Stay & Accommodation
                        </div>
                        <div style={{ fontSize: '0.84rem', color: '#2D1520', marginTop: '6px', lineHeight: '1.4' }}>
                          {activePlan.recommendations.accommodation}
                        </div>
                      </div>

                      {/* Food */}
                      <div style={{ background: '#FFF5FB', padding: '1rem', borderRadius: '14px', border: '1px solid #F8E7F1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', color: '#BE5985', fontSize: '0.88rem' }}>
                          <span>🍽️</span> Food & Local Tastes
                        </div>
                        <div style={{ fontSize: '0.84rem', color: '#2D1520', marginTop: '6px', lineHeight: '1.4' }}>
                          {activePlan.recommendations.food}
                        </div>
                      </div>
                    </div>

                    {/* Budget Distribution */}
                    {activePlan.recommendations.budgetDistribution && (
                      <div style={{ marginTop: '1.25rem', background: '#FAF0F5', padding: '1rem', borderRadius: '14px', border: '1px solid #F3D2E5' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#BE5985', marginBottom: '0.5rem' }}>
                          📊 Budget Allocation Breakdown
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.82rem', fontWeight: '700', color: '#2D1520' }}>
                          <span>🚆 Transport: {activePlan.recommendations.budgetDistribution.transport || '25%'}</span>
                          <span>🏨 Stays: {activePlan.recommendations.budgetDistribution.stays || '40%'}</span>
                          <span>🍽️ Food: {activePlan.recommendations.budgetDistribution.food || '20%'}</span>
                          <span>🎟️ Sights: {activePlan.recommendations.budgetDistribution.activities || '15%'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Instant 1-Click Plan Modification Action Bar */}
                <div
                  style={{
                    background: '#FFF5FB',
                    borderRadius: '18px',
                    border: '1.5px dashed #EC7FA9',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#BE5985' }}>
                    ⚡ 1-Click Modify This Plan:
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleModifyPlan('Make it cheaper and add more nature places.')}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #EC7FA9',
                        color: '#BE5985',
                        padding: '6px 12px',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(190, 89, 133, 0.1)',
                      }}
                    >
                      📉 Make it cheaper & add nature
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModifyPlan('Add more adventure activities and trekking.')}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #EC7FA9',
                        color: '#BE5985',
                        padding: '6px 12px',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                      }}
                    >
                      🧗 Add adventure & trekking
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModifyPlan('Make this itinerary suitable for children and family.')}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #EC7FA9',
                        color: '#BE5985',
                        padding: '6px 12px',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                      }}
                    >
                      👨‍👩‍👧 Family & kid friendly
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModifyPlan('Add one extra day to explore nearby attractions.')}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #EC7FA9',
                        color: '#BE5985',
                        padding: '6px 12px',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                      }}
                    >
                      ➕ Add 1 extra day
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
