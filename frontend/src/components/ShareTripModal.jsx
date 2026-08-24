import React, { useState, useEffect } from 'react';
import shareService from '../services/shareService';
import { useAppContext } from '../context/AppContext';

export default function ShareTripModal({ trip, onClose }) {
  const { showToast } = useAppContext();
  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadShareInfo() {
      if (!trip?.id) return;
      setLoading(true);
      try {
        const data = await shareService.createShareLink(trip.id);
        setShareData(data);
      } catch (err) {
        console.error('Failed to load share link:', err);
      } finally {
        setLoading(false);
      }
    }
    loadShareInfo();
  }, [trip?.id]);

  const handleCopy = async () => {
    if (!shareData?.shareUrl) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareData.shareUrl);
      } else {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = shareData.shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      if (showToast) showToast('📋 Link copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      if (showToast) showToast('⚠️ Unable to copy automatically. Please copy the URL manually.');
    }
  };

  const handleNativeShare = async () => {
    if (!shareData?.shareUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: trip.title || 'My Travel Plan',
          text: `Check out my travel plan for ${trip.destination_name || 'vacation'} on Travelora!`,
          url: shareData.shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed, fallback to copy
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleRegenerate = async () => {
    const confirm = window.confirm(
      'Are you sure you want to regenerate this share link? The previous link will stop working immediately.'
    );
    if (!confirm) return;

    setActionLoading(true);
    try {
      const data = await shareService.regenerateShareLink(trip.id);
      setShareData(data);
      if (showToast) showToast('🔄 New secure share link generated!');
    } catch (err) {
      alert('Failed to regenerate link: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async () => {
    const confirm = window.confirm(
      'Are you sure you want to stop sharing? Anyone with the link will no longer be able to view this trip.'
    );
    if (!confirm) return;

    setActionLoading(true);
    try {
      await shareService.revokeShareLink(trip.id);
      setShareData((prev) => (prev ? { ...prev, isActive: false } : null));
      if (showToast) showToast('🛑 Trip sharing disabled.');
    } catch (err) {
      alert('Failed to stop sharing: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    setActionLoading(true);
    try {
      const data = await shareService.createShareLink(trip.id);
      setShareData(data);
      if (showToast) showToast('🟢 Share link re-activated!');
    } catch (err) {
      alert('Failed to activate share link: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          maxWidth: '520px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          animation: 'fadeIn 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#38bdf8', textTransform: 'uppercase' }}>
              Phase 15 • Social Sharing
            </span>
            <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.2rem', fontWeight: '800' }}>
              🔗 Share Trip Plan
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem' }}>
          {/* Trip Summary Card */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#e0f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                flexShrink: 0,
              }}
            >
              🌴
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '0.98rem', fontWeight: '800', color: '#0f172a' }}>
                {trip?.title || 'Custom Trip Plan'}
              </h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                📍 {trip?.destination_name || 'Vacation'} • {trip?.trip_type || 'leisure'}
              </p>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>⏳</div>
              <p style={{ margin: 0, color: '#64748b', fontWeight: '600' }}>Generating secure share link...</p>
            </div>
          ) : (
            <>
              {shareData?.isActive ? (
                <>
                  {/* Share Link Input Bar */}
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                    Public Shareable Link:
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input
                      type="text"
                      readOnly
                      value={shareData.shareUrl}
                      style={{
                        flex: 1,
                        background: '#f1f5f9',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '0.65rem 0.85rem',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        color: '#0f172a',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="btn btn-primary btn-sm"
                      style={{
                        padding: '0.65rem 1rem',
                        fontWeight: '800',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: copied ? '#10b981' : undefined,
                      }}
                    >
                      {copied ? '✓ Copied' : '📋 Copy'}
                    </button>
                  </div>

                  {/* Social Share Action (Feature 8) */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <button
                      type="button"
                      onClick={handleNativeShare}
                      className="btn btn-primary"
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        fontWeight: '800',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                      }}
                    >
                      📤 Share via Apps / Social
                    </button>
                  </div>

                  {/* Status & Views Pill (Feature 17) */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '12px',
                      padding: '0.65rem 1rem',
                      marginBottom: '1.25rem',
                      fontSize: '0.84rem',
                    }}
                  >
                    <span style={{ color: '#166534', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></span>
                      Public Link Active
                    </span>
                    <span style={{ color: '#15803d', fontWeight: '800' }}>
                      👁️ {shareData.viewsCount} Views
                    </span>
                  </div>

                  {/* Privacy Controls (Feature 5, 6, 7) */}
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleRegenerate}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#0284c7',
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      🔄 Regenerate Link
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleRevoke}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      🛑 Stop Sharing
                    </button>
                  </div>
                </>
              ) : (
                /* Disabled / Private State */
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔒</div>
                  <h4 style={{ margin: '0 0 0.35rem 0', color: '#0f172a', fontWeight: '800' }}>
                    Sharing is currently disabled
                  </h4>
                  <p style={{ margin: '0 0 1.25rem 0', color: '#64748b', fontSize: '0.88rem' }}>
                    Your trip is private. No one can access this trip with the old link.
                  </p>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleReactivate}
                    className="btn btn-primary"
                    style={{ padding: '0.75rem 1.5rem', fontWeight: '800', borderRadius: '12px' }}
                  >
                    🟢 Enable Public Sharing
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
