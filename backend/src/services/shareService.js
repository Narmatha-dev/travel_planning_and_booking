const shareModel = require('../models/shareModel');
const tripModel = require('../models/tripModel');
const { ApiError } = require('../utils/apiResponse');

const shareService = {
  /**
   * Create or retrieve active share link for a trip (Protected)
   */
  async createShareLink(tripId, userId, origin = 'http://localhost:5173') {
    // 1. Verify trip exists and user is owner (Feature 15)
    const trip = await tripModel.findById(tripId, userId);
    if (!trip) {
      throw new ApiError(404, 'Trip plan not found or you do not have permission to share it.');
    }

    const shareRecord = await shareModel.createOrGetShareLink(tripId, userId);
    const shareUrl = `${origin}/shared-trip/${shareRecord.share_token}`;

    return {
      tripId: shareRecord.trip_id,
      shareToken: shareRecord.share_token,
      shareUrl,
      isActive: Boolean(shareRecord.is_active),
      viewsCount: shareRecord.views_count || 0,
      createdAt: shareRecord.created_at,
    };
  },

  /**
   * Regenerate a new share token (invalidates old link)
   */
  async regenerateShareLink(tripId, userId, origin = 'http://localhost:5173') {
    const trip = await tripModel.findById(tripId, userId);
    if (!trip) {
      throw new ApiError(404, 'Trip plan not found or you do not have permission to share it.');
    }

    const shareRecord = await shareModel.regenerateShareLink(tripId, userId);
    const shareUrl = `${origin}/shared-trip/${shareRecord.share_token}`;

    return {
      tripId: shareRecord.trip_id,
      shareToken: shareRecord.share_token,
      shareUrl,
      isActive: Boolean(shareRecord.is_active),
      viewsCount: 0,
      createdAt: shareRecord.created_at,
    };
  },

  /**
   * Revoke active share link
   */
  async revokeShareLink(tripId, userId) {
    const trip = await tripModel.findById(tripId, userId);
    if (!trip) {
      throw new ApiError(404, 'Trip plan not found or you do not have permission to modify it.');
    }

    await shareModel.revokeShareLink(tripId, userId);
    return { success: true, message: 'Trip share link has been revoked successfully.' };
  },

  /**
   * Get current share status for trip owner
   */
  async getShareStatus(tripId, userId, origin = 'http://localhost:5173') {
    const trip = await tripModel.findById(tripId, userId);
    if (!trip) {
      throw new ApiError(404, 'Trip plan not found or you do not have permission to view it.');
    }

    const shareRecord = await shareModel.getStatusByTripId(tripId, userId);
    if (!shareRecord) {
      return {
        tripId,
        isShared: false,
        isActive: false,
        viewsCount: 0,
      };
    }

    return {
      tripId: shareRecord.trip_id,
      isShared: true,
      shareToken: shareRecord.share_token,
      shareUrl: `${origin}/shared-trip/${shareRecord.share_token}`,
      isActive: Boolean(shareRecord.is_active),
      viewsCount: shareRecord.views_count || 0,
      createdAt: shareRecord.created_at,
    };
  },

  /**
   * Retrieve sanitized public trip data using secure share token (Public)
   */
  async getPublicSharedTrip(token) {
    if (!token) {
      throw new ApiError(400, 'Share token is required.');
    }

    // 1. Find share record
    const shareRecord = await shareModel.findByToken(token);
    if (!shareRecord || !shareRecord.is_active) {
      throw new ApiError(404, 'This shared trip link is no longer available or has been revoked.');
    }

    // 2. Fetch full trip details
    const trip = await tripModel.findById(shareRecord.trip_id);
    if (!trip) {
      throw new ApiError(404, 'Trip plan details could not be found.');
    }

    // 3. FEATURE 4: STRICT PRIVATE DATA SANITIZATION
    // Never expose: user_id, email, phone, passwords, payment info, booking refs
    const sanitizedTrip = {
      shareToken: shareRecord.share_token,
      title: trip.title,
      destination_name: trip.destination_name || 'Scenic Destination',
      destination_city: trip.destination_city || '',
      destination_country: trip.destination_country || '',
      featured_image_url:
        trip.featured_image_url ||
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      trip_type: trip.trip_type || 'leisure',
      start_date: trip.start_date,
      end_date: trip.end_date,
      total_budget: parseFloat(trip.total_budget || 0),
      estimated_cost: parseFloat(trip.estimated_cost || 0),
      notes: trip.notes || '',
      views_count: shareRecord.views_count || 1,
      created_at: trip.created_at,
      days: (trip.days || []).map((d) => ({
        day_number: d.day_number,
        date: d.date,
        activities: (d.activities || []).map((a) => ({
          title: a.title,
          description: a.description,
          activity_type: a.activity_type,
          activity_time: a.activity_time,
          location_name: a.location_name,
          cost: parseFloat(a.cost || 0),
        })),
      })),
      itineraries: (trip.itineraries || []).map((i) => ({
        day_number: i.day_number,
        title: i.title,
        description: i.description,
        activity_type: i.activity_type,
        activity_time: i.activity_time,
        location_name: i.location_name,
        cost: parseFloat(i.cost || 0),
      })),
    };

    return sanitizedTrip;
  },
};

module.exports = shareService;
