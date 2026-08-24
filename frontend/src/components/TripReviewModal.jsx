import { useState, useEffect } from 'react';
import reviewService from '../services/reviewService';
import { useAppContext } from '../context/AppContext';

export default function TripReviewModal({ booking, onClose, onReviewUpdated }) {
  const { user } = useAppContext();
  const currentUserId = user?.id || 3;

  const [loading, setLoading] = useState(true);
  const [existingReview, setExistingReview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  // Category sub-ratings
  const [placesRating, setPlacesRating] = useState(5);
  const [hotelRating, setHotelRating] = useState(5);
  const [transportRating, setTransportRating] = useState(5);

  const starLabels = {
    1: '⭐ 1 — Poor',
    2: '⭐⭐ 2 — Fair',
    3: '⭐⭐⭐ 3 — Good',
    4: '⭐⭐⭐⭐ 4 — Very Good',
    5: '⭐⭐⭐⭐⭐ 5 — Excellent',
  };

  useEffect(() => {
    async function checkExistingReview() {
      if (!booking?.id) return;
      setLoading(true);
      setError('');
      try {
        const review = await reviewService.getReviewByBooking(booking.id);
        if (review) {
          setExistingReview(review);
          setRating(review.rating || 5);
          setTitle(review.title || '');
          setComment(review.comment || '');
          if (review.category_ratings) {
            if (review.category_ratings.places) setPlacesRating(review.category_ratings.places);
            if (review.category_ratings.hotel) setHotelRating(review.category_ratings.hotel);
            if (review.category_ratings.transport) setTransportRating(review.category_ratings.transport);
          }
        }
      } catch (err) {
        console.warn('Could not fetch existing review:', err.message);
      } finally {
        setLoading(false);
      }
    }

    checkExistingReview();
  }, [booking]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!rating || rating < 1 || rating > 5) {
      setError('Please select a star rating (1 to 5 stars)');
      return;
    }

    if (!title.trim()) {
      setError('Please provide a short review title');
      return;
    }

    if (!comment.trim() || comment.trim().length < 5) {
      setError('Please write at least 5 characters in your review');
      return;
    }

    if (comment.trim().length > 1000) {
      setError('Review comment cannot exceed 1000 characters');
      return;
    }

    setSubmitting(true);

    try {
      const categoryRatings = {
        places: placesRating,
      };
      if (booking.selected_hotel) categoryRatings.hotel = hotelRating;
      if (booking.selected_transport) categoryRatings.transport = transportRating;

      if (existingReview) {
        // Feature 7: Edit Review
        const updated = await reviewService.updateReview(existingReview.id, {
          userId: currentUserId,
          rating,
          title: title.trim(),
          comment: comment.trim(),
          categoryRatings,
        });
        setExistingReview(updated);
        setSuccessMsg('⭐ Review updated successfully!');
      } else {
        // Feature 5: Submit Review
        const created = await reviewService.createReview({
          userId: currentUserId,
          bookingId: booking.id,
          destinationId: booking.destination_id || null,
          packageId: booking.package_id || null,
          rating,
          title: title.trim(),
          comment: comment.trim(),
          travelDate: booking.travel_date || new Date().toISOString().split('T')[0],
          categoryRatings,
          userName: user?.full_name || user?.name || 'Verified Traveler',
          userEmail: user?.email || 'traveler@example.com',
        });
        setExistingReview(created);
        setSuccessMsg('⭐ Review submitted successfully! Thank you for your feedback.');
      }

      if (onReviewUpdated) onReviewUpdated();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingReview) return;
    if (!window.confirm('Are you sure you want to delete your review for this trip?')) return;

    setSubmitting(true);
    setError('');
    try {
      await reviewService.deleteReview(existingReview.id, currentUserId);
      setExistingReview(null);
      setTitle('');
      setComment('');
      setRating(5);
      setSuccessMsg('Review deleted successfully.');
      if (onReviewUpdated) onReviewUpdated();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete review');
    } finally {
      setSubmitting(false);
    }
  };

  if (!booking) return null;

  return (
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
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: '2rem',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
          }}
        >
          ✕
        </button>

        {/* Modal Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            PHASE 11 • TRIP FEEDBACK
          </span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a', margin: '0.2rem 0' }}>
            {existingReview ? 'Edit Your Review' : 'Rate Your Trip'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0 }}>
            📍 <strong>{booking.destination_name || 'Your Trip'}</strong> • #{booking.booking_reference}
          </p>
        </div>

        {/* Existing Review Alert (Feature 6) */}
        {existingReview && !successMsg && (
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0369a1', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>ℹ️</span>
            <span>You already reviewed this trip. You can update or delete your feedback below.</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.88rem', fontWeight: '700', marginBottom: '1.25rem' }}>
            {successMsg}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⭐</div>
            <p style={{ color: '#64748b' }}>Checking review eligibility...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Feature 1 & 2: Overall Star Rating */}
            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem' }}>
                Overall Experience <span style={{ color: '#e11d48' }}>*</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '2.2rem',
                        cursor: 'pointer',
                        color: active ? '#f59e0b' : '#cbd5e1',
                        transition: 'transform 0.1s',
                        padding: '0 2px',
                      }}
                    >
                      ★
                    </button>
                  );
                })}
              </div>

              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>
                {starLabels[hoverRating || rating]}
              </span>
            </div>

            {/* Feature 4: Multi-Category Ratings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Category Ratings (Optional)
              </span>

              {/* Places / Destination */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b' }}>
                  🏞️ Destination / Places:
                </span>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPlacesRating(s)}
                      style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: s <= placesRating ? '#f59e0b' : '#cbd5e1' }}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Hotel / Stay (If booked) */}
              {booking.selected_hotel && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b' }}>
                    🏨 Hotel ({booking.selected_hotel.name}):
                  </span>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setHotelRating(s)}
                        style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: s <= hotelRating ? '#f59e0b' : '#cbd5e1' }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Transport (If booked) */}
              {booking.selected_transport && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b' }}>
                    🚆 Transport ({booking.selected_transport.title}):
                  </span>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setTransportRating(s)}
                        style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: s <= transportRating ? '#f59e0b' : '#cbd5e1' }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Feature 3: Review Title */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.35rem' }}>
                Review Headline <span style={{ color: '#e11d48' }}>*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Unforgettable getaway and great stays!"
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

            {/* Feature 3: Short Review Text & Character Count */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>
                  What did you like about this trip? <span style={{ color: '#e11d48' }}>*</span>
                </label>
                <span style={{ fontSize: '0.78rem', color: comment.length > 900 ? '#e11d48' : '#94a3b8' }}>
                  {comment.length} / 1000 characters
                </span>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with the places, food, accommodation, and transportation..."
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

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              {existingReview ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={submitting}
                  className="btn btn-sm"
                  style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', fontWeight: '700', padding: '0.6rem 1rem' }}
                >
                  🗑️ Delete Review
                </button>
              ) : <div />}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={onClose}
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
                  {submitting ? 'Submitting your review...' : existingReview ? '✓ Update Review' : '⭐ Submit Review'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
