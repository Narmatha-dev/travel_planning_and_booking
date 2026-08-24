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

  // Filter and Sorting (Feature 12)
  const [selectedRatingFilter, setSelectedRatingFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

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

  const starLabels = {
    1: '⭐ 1 — Poor',
    2: '⭐⭐ 2 — Fair',
    3: '⭐⭐⭐ 3 — Good',
    4: '⭐⭐⭐⭐ 4 — Very Good',
    5: '⭐⭐⭐⭐⭐ 5 — Excellent',
  };

  const loadReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await reviewService.getReviews({
        destinationId,
        packageId,
        rating: selectedRatingFilter !== 'all' ? selectedRatingFilter : undefined,
        sortBy,
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
  }, [destinationId, packageId, selectedRatingFilter, sortBy]);

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
      setFormError('Please provide a review headline');
      setSubmitting(false);
      return;
    }

    if (formData.comment.trim().length < 5) {
      setFormError('Please write at least 5 characters in your review');
      setSubmitting(false);
      return;
    }

    if (formData.comment.trim().length > 1000) {
      setFormError('Review cannot exceed 1000 characters');
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
          userName: user?.full_name || user?.name || 'Verified Traveler',
          userEmail: user?.email || 'traveler@example.com',
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
    <section style={{ marginTop: '3rem', borderTop: '2px solid #f1f5f9', paddingTop: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            VERIFIED TRAVELER RATINGS
          </span>
          <h2 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a', margin: '0.35rem 0 0.2rem 0' }}>
            Customer Reviews & Feedback
          </h2>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.92rem' }}>
            Read verified experiences and ratings from travelers who booked this {title.toLowerCase()}.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="btn btn-primary"
          style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '800' }}
        >
          <span>✍️</span> Write a Review
        </button>
      </div>

      {/* Feature 11: Aggregate Score & Rating Distribution Breakdown */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(200px, 1fr) 2fr',
          gap: '2rem',
          background: '#f8fafc',
          padding: '2rem',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          marginBottom: '2rem',
        }}
      >
        {/* Overall Score Box */}
        <div style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', paddingRight: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '3.6rem', fontWeight: '900', color: '#0f172a', lineHeight: 1 }}>
            {aggregates.averageRating ? parseFloat(aggregates.averageRating).toFixed(1) : '5.0'}
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
              <div
                key={stars}
                onClick={() => setSelectedRatingFilter(selectedRatingFilter === String(stars) ? 'all' : String(stars))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  background: selectedRatingFilter === String(stars) ? '#e0f2fe' : 'transparent',
                }}
              >
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
                <span style={{ minWidth: '40px', color: '#64748b', textAlign: 'right', fontSize: '0.78rem', fontWeight: '700' }}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature 12: Filter & Sort Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', background: '#ffffff', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        {/* Star Rating Filters */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#475569', marginRight: '0.35rem' }}>Filter:</span>
          {['all', '5', '4', '3', '2', '1'].map((f) => (
            <button
              key={f}
              onClick={() => setSelectedRatingFilter(f)}
              style={{
                background: selectedRatingFilter === f ? '#0284c7' : '#f1f5f9',
                color: selectedRatingFilter === f ? '#ffffff' : '#475569',
                border: 'none',
                borderRadius: '8px',
                padding: '0.35rem 0.75rem',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              {f === 'all' ? 'All Reviews' : `${f} ★`}
            </button>
          ))}
        </div>

        {/* Sorting Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#475569' }}>Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              border: '1.5px solid #cbd5e1',
              fontSize: '0.82rem',
              fontWeight: '600',
              color: '#0f172a',
              background: '#ffffff',
            }}
          >
            <option value="recent">Most Recent</option>
            <option value="highest_rating">Highest Rating</option>
            <option value="lowest_rating">Lowest Rating</option>
          </select>
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
            No reviews matching this filter
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Be the first verified traveler to share your review for this {title.toLowerCase()}!
          </p>
          <button onClick={handleOpenCreateModal} className="btn btn-primary btn-sm">
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.95rem', color: '#0f172a' }}>
                          {rev.user_name || 'Traveler'}
                        </span>

                        {/* Feature 10: Verified Traveller Badge */}
                        {rev.is_verified_booking ? (
                          <span
                            style={{
                              background: '#f0fdf4',
                              color: '#15803d',
                              border: '1px solid #86efac',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              fontSize: '0.72rem',
                              fontWeight: '800',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            ✓ Verified Traveller
                          </span>
                        ) : (
                          <span
                            style={{
                              background: '#f8fafc',
                              color: '#64748b',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              fontSize: '0.72rem',
                              fontWeight: '600',
                            }}
                          >
                            Community Review
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                        Travelled {rev.travel_date ? `in ${new Date(rev.travel_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : 'recently'}
                      </div>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div>{renderStars(rev.rating, '1.1rem')}</div>
                    <span style={{ fontWeight: '800', fontSize: '0.85rem', color: '#0f172a' }}>
                      {rev.rating}.0
                    </span>
                  </div>
                </div>

                {/* Feature 4: Category Ratings Chips */}
                {rev.category_ratings && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    {rev.category_ratings.places && (
                      <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>
                        🏞️ Places: {rev.category_ratings.places}★
                      </span>
                    )}
                    {rev.category_ratings.hotel && (
                      <span style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', color: '#0369a1' }}>
                        🏨 Stay: {rev.category_ratings.hotel}★
                      </span>
                    )}
                    {rev.category_ratings.transport && (
                      <span style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', color: '#166534' }}>
                        🚆 Transport: {rev.category_ratings.transport}★
                      </span>
                    )}
                  </div>
                )}

                {/* Review Title & Body */}
                <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                  {rev.title}
                </h4>
                <p style={{ fontSize: '0.92rem', color: '#475569', lineHeight: 1.5, margin: '0 0 0.75rem 0' }}>
                  {rev.comment}
                </p>

                {/* Footer / Author Actions */}
                {isAuthor && (
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
                    <button
                      onClick={() => handleOpenEditModal(rev)}
                      className="btn btn-outline btn-sm"
                      style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem', fontWeight: '700' }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteReview(rev.id)}
                      className="btn btn-sm"
                      style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '0.3rem 0.75rem', fontSize: '0.78rem', fontWeight: '700' }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Write/Edit Review Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              maxWidth: '520px',
              width: '100%',
              padding: '2rem',
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
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
                color: '#64748b',
              }}
            >
              ✕
            </button>

            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a', marginBottom: '0.25rem' }}>
              {isEditing ? 'Edit Your Review' : 'Write a Review'}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              Share your thoughts about this {title.toLowerCase()} with fellow travelers.
            </p>

            {formError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Star Rating */}
              <div style={{ textAlign: 'center', background: '#f8fafc', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.35rem' }}>
                  Overall Rating <span style={{ color: '#e11d48' }}>*</span>
                </label>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.25rem', marginBottom: '0.35rem' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '2rem',
                        cursor: 'pointer',
                        color: (hoverRating || formData.rating) >= star ? '#f59e0b' : '#cbd5e1',
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#475569' }}>
                  {starLabels[hoverRating || formData.rating]}
                </span>
              </div>

              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.35rem' }}>
                  Review Headline <span style={{ color: '#e11d48' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Summarize your experience..."
                  maxLength={150}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.92rem',
                  }}
                />
              </div>

              {/* Comment */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>
                    Detailed Feedback <span style={{ color: '#e11d48' }}>*</span>
                  </label>
                  <span style={{ fontSize: '0.78rem', color: formData.comment.length > 900 ? '#e11d48' : '#94a3b8' }}>
                    {formData.comment.length} / 1000 characters
                  </span>
                </div>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  placeholder="What did you like the most? Any tips for other travelers?"
                  rows={4}
                  maxLength={1000}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.92rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.6rem 1.25rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary btn-sm"
                  style={{ fontWeight: '800', padding: '0.6rem 1.5rem' }}
                >
                  {submitting ? 'Submitting...' : isEditing ? '✓ Update Review' : '⭐ Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
