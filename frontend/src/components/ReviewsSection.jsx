import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import reviewService from '../services/reviewService';

function renderStars(rating, size = '1.1rem') {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span
        key={i}
        style={{
          color: i <= rating ? '#f59e0b' : '#cbd5e1',
          fontSize: size,
          marginRight: '2px',
        }}
      >
        ★
      </span>
    );
  }
  return stars;
}

export default function ReviewsSection({ destinationId, packageId, title = 'Travel Experience' }) {
  const { user, isAuthenticated } = useAppContext();
  const currentUserId = user?.id || 3;

  const [reviews, setReviews] = useState([]);
  const [aggregates, setAggregates] = useState({
    averageRating: 5.0,
    totalReviews: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal & Form state
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Review Form state
  const [hoverRating, setHoverRating] = useState(0);
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    comment: '',
    travelDate: new Date().toISOString().split('T')[0],
  });

  const loadReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await reviewService.getReviews({
        destinationId,
        packageId,
      });
      if (data) {
        setReviews(data.reviews || []);
        if (data.aggregates) {
          setAggregates(data.aggregates);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [destinationId, packageId]);

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData({
      rating: 5,
      title: '',
      comment: '',
      travelDate: new Date().toISOString().split('T')[0],
    });
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (rev) => {
    setIsEditing(true);
    setEditId(rev.id);
    setFormData({
      rating: rev.rating,
      title: rev.title,
      comment: rev.comment,
      travelDate: rev.travel_date || new Date().toISOString().split('T')[0],
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    if (!formData.title.trim()) {
      setFormError('Please provide a review title');
      setSubmitting(false);
      return;
    }

    if (formData.comment.trim().length < 5) {
      setFormError('Please write at least 5 characters in your review comment');
      setSubmitting(false);
      return;
    }

    try {
      if (isEditing && editId) {
        await reviewService.updateReview(editId, {
          userId: currentUserId,
          ...formData,
        });
      } else {
        await reviewService.createReview({
          userId: currentUserId,
          destinationId,
          packageId,
          userName: user?.full_name || user?.name || 'Elena Rostova',
          userEmail: user?.email || 'elena.rostova@example.com',
          ...formData,
        });
      }

      setShowModal(false);
      loadReviews();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to save review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (revId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    try {
      await reviewService.deleteReview(revId, currentUserId);
      loadReviews();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const total = aggregates.totalReviews || reviews.length || 1;
  const dist = aggregates.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  return (
    <section style={{ marginTop: '3.5rem', borderTop: '2px solid #f1f5f9', paddingTop: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div>
          <span className="eyebrow">Verified Traveler Ratings</span>
          <h2 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a', margin: '0.35rem 0 0.2rem 0' }}>
            Customer Reviews & Experiences
          </h2>
          <p style={{ color: '#64748b', margin: 0 }}>
            Read real feedback and travel stories from verified guests.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="btn btn-primary"
          style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <span>✍️</span> Write a Review
        </button>
      </div>

      {/* Aggregate Score & Distribution Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: '2rem',
          background: '#f8fafc',
          padding: '2rem',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          marginBottom: '2.5rem',
        }}
      >
        {/* Overall Score Box */}
        <div style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', paddingRight: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '3.5rem', fontWeight: '900', color: '#0f172a', lineHeight: 1 }}>
            {aggregates.averageRating || '5.0'}
          </div>
          <div style={{ margin: '0.5rem 0', fontSize: '1.35rem' }}>
            {renderStars(Math.round(aggregates.averageRating || 5), '1.4rem')}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>
            Based on {aggregates.totalReviews || reviews.length} verified review{aggregates.totalReviews === 1 ? '' : 's'}
          </div>
        </div>

        {/* Rating Bars Distribution */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem' }}>
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = dist[stars] || 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;

            return (
              <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                <span style={{ minWidth: '45px', fontWeight: '700', color: '#475569' }}>
                  {stars} ★
                </span>
                <div style={{ flex: 1, height: '8px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: '#f59e0b',
                      borderRadius: '9999px',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
                <span style={{ minWidth: '35px', color: '#94a3b8', textAlign: 'right', fontSize: '0.78rem' }}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#0284c7', fontWeight: '600' }}>
          ⭐ Loading guest reviews...
        </div>
      ) : error ? (
        <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '12px', color: '#b91c1c' }}>
          {error}
        </div>
      ) : reviews.length === 0 ? (
        <div style={{ background: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: '16px', padding: '3rem 2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💬</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.35rem 0' }}>
            Be the first to review this {title}!
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Share your travel experience, highlights, and tips with future explorers.
          </p>
          <button onClick={handleOpenCreateModal} className="btn btn-primary">
            Write Review
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {reviews.map((rev) => {
            const isAuthor = rev.user_id === currentUserId;
            const initials = rev.user_name
              ? rev.user_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
              : 'TR';

            return (
              <div
                key={rev.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '1.5rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                }}
              >
                {/* Header: User avatar, name, rating, verified badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800',
                        fontSize: '0.95rem',
                      }}
                    >
                      {initials}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.95rem' }}>
                          {rev.user_name}
                        </span>
                        {rev.is_verified_booking && (
                          <span style={{ background: '#dcfce7', color: '#15803d', padding: '1px 8px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: '700' }}>
                            ✓ Verified Traveler
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        {rev.travel_date ? `Travelled ${rev.travel_date}` : rev.created_at?.split(' ')[0]}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div>{renderStars(rev.rating)}</div>
                    {isAuthor && (
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          onClick={() => handleOpenEditModal(rev)}
                          style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '3px 8px', fontSize: '0.75rem', cursor: 'pointer', color: '#475569', fontWeight: '600' }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteReview(rev.id)}
                          style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '3px 8px', fontSize: '0.75rem', cursor: 'pointer', color: '#b91c1c', fontWeight: '600' }}
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Review Title & Body */}
                <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.4rem 0' }}>
                  {rev.title}
                </h4>
                <p style={{ fontSize: '0.92rem', color: '#475569', lineHeight: '1.6', margin: 0 }}>
                  {rev.comment}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Submission Modal (Create / Edit) */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '560px',
              padding: '2.25rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                fontSize: '1.1rem',
                color: '#475569',
              }}
            >
              ✕
            </button>

            <span className="eyebrow">{isEditing ? 'Update Review' : 'Guest Feedback'}</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: '0.3rem 0 1.25rem 0' }}>
              {isEditing ? 'Edit Your Review' : `Review ${title}`}
            </h2>

            {formError && (
              <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitReview}>
              {/* Star Rating Picker */}
              <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}>
                  Your Overall Rating:
                </label>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setFormData((prev) => ({ ...prev, rating: star }))}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        fontSize: '2.2rem',
                        cursor: 'pointer',
                        color: (hoverRating || formData.rating) >= star ? '#f59e0b' : '#cbd5e1',
                        transition: 'transform 0.15s ease',
                        transform: (hoverRating || formData.rating) >= star ? 'scale(1.15)' : 'scale(1)',
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Title */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                  Review Headline / Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Magical vacation with breathtaking views!"
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              {/* Travel Date */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                  Approximate Date of Travel
                </label>
                <input
                  type="date"
                  value={formData.travelDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, travelDate: e.target.value }))}
                  max={new Date().toISOString().split('T')[0]}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              {/* Review Comment */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                  Detailed Review Comments *
                </label>
                <textarea
                  rows="4"
                  value={formData.comment}
                  onChange={(e) => setFormData((prev) => ({ ...prev, comment: e.target.value }))}
                  placeholder="Describe your experience, favorite places, guide quality, accommodations, and recommendations..."
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-outline"
                  style={{ padding: '0.65rem 1.25rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ padding: '0.65rem 1.75rem' }}
                >
                  {submitting ? 'Saving...' : isEditing ? 'Update Review' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
