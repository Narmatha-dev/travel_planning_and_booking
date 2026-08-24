const crypto = require('crypto');
const { query } = require('../config/db');

// In-memory store for fallback & dev persistence
const FALLBACK_SHARE_LINKS = new Map();

// Helper to generate cryptographically secure random token (e.g., tr_7b9c2a4f6e1d)
function generateSecureToken() {
  return 'tr_' + crypto.randomBytes(12).toString('base64url').replace(/[^a-zA-Z0-9_-]/g, '');
}

const shareModel = {
  /**
   * Create or get an active share link for a trip
   */
  async createOrGetShareLink(tripId, userId) {
    const numericTripId = parseInt(tripId, 10);
    const numericUserId = parseInt(userId, 10);

    try {
      // Check existing share link in database
      const [existingRows] = await query(
        'SELECT * FROM trip_share_links WHERE trip_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1',
        [numericTripId, numericUserId]
      );

      if (existingRows && existingRows.length > 0) {
        const existing = existingRows[0];
        if (existing.is_active) {
          return existing;
        }
        // Reactivate if previously revoked
        await query(
          'UPDATE trip_share_links SET is_active = 1, updated_at = NOW() WHERE id = ?',
          [existing.id]
        );
        return { ...existing, is_active: 1 };
      }

      // Generate new token
      const token = generateSecureToken();
      const [insertResult] = await query(
        `INSERT INTO trip_share_links (trip_id, user_id, share_token, is_active, views_count)
         VALUES (?, ?, ?, 1, 0)`,
        [numericTripId, numericUserId, token]
      );

      return {
        id: insertResult.insertId,
        trip_id: numericTripId,
        user_id: numericUserId,
        share_token: token,
        is_active: 1,
        views_count: 0,
        created_at: new Date().toISOString(),
      };
    } catch (err) {
      // In-memory fallback
      for (const record of FALLBACK_SHARE_LINKS.values()) {
        if (record.trip_id === numericTripId && record.user_id === numericUserId) {
          record.is_active = true;
          return record;
        }
      }

      const token = generateSecureToken();
      const newRecord = {
        id: Date.now(),
        trip_id: numericTripId,
        user_id: numericUserId,
        share_token: token,
        is_active: true,
        views_count: 0,
        created_at: new Date().toISOString(),
      };
      FALLBACK_SHARE_LINKS.set(token, newRecord);
      return newRecord;
    }
  },

  /**
   * Regenerate share link (invalidates previous token and creates fresh one)
   */
  async regenerateShareLink(tripId, userId) {
    const numericTripId = parseInt(tripId, 10);
    const numericUserId = parseInt(userId, 10);
    const newToken = generateSecureToken();

    try {
      // Invalidate existing links
      await query(
        'UPDATE trip_share_links SET is_active = 0 WHERE trip_id = ? AND user_id = ?',
        [numericTripId, numericUserId]
      );

      const [insertResult] = await query(
        `INSERT INTO trip_share_links (trip_id, user_id, share_token, is_active, views_count)
         VALUES (?, ?, ?, 1, 0)`,
        [numericTripId, numericUserId, newToken]
      );

      return {
        id: insertResult.insertId,
        trip_id: numericTripId,
        user_id: numericUserId,
        share_token: newToken,
        is_active: 1,
        views_count: 0,
        created_at: new Date().toISOString(),
      };
    } catch (err) {
      // Invalidate old in-memory record
      for (const [t, rec] of FALLBACK_SHARE_LINKS.entries()) {
        if (rec.trip_id === numericTripId && rec.user_id === numericUserId) {
          rec.is_active = false;
        }
      }

      const newRecord = {
        id: Date.now(),
        trip_id: numericTripId,
        user_id: numericUserId,
        share_token: newToken,
        is_active: true,
        views_count: 0,
        created_at: new Date().toISOString(),
      };
      FALLBACK_SHARE_LINKS.set(newToken, newRecord);
      return newRecord;
    }
  },

  /**
   * Revoke/Disable share link
   */
  async revokeShareLink(tripId, userId) {
    const numericTripId = parseInt(tripId, 10);
    const numericUserId = parseInt(userId, 10);

    try {
      await query(
        'UPDATE trip_share_links SET is_active = 0, updated_at = NOW() WHERE trip_id = ? AND user_id = ?',
        [numericTripId, numericUserId]
      );
      return true;
    } catch (err) {
      for (const record of FALLBACK_SHARE_LINKS.values()) {
        if (record.trip_id === numericTripId && record.user_id === numericUserId) {
          record.is_active = false;
        }
      }
      return true;
    }
  },

  /**
   * Find active share record by token and increment view count
   */
  async findByToken(token) {
    if (!token) return null;

    try {
      const [rows] = await query(
        'SELECT * FROM trip_share_links WHERE share_token = ? LIMIT 1',
        [token]
      );

      if (!rows || rows.length === 0) {
        const fallback = FALLBACK_SHARE_LINKS.get(token);
        if (fallback) {
          if (fallback.is_active) fallback.views_count++;
          return fallback;
        }
        return null;
      }

      const record = rows[0];
      if (record.is_active) {
        // Increment views count asynchronously
        await query(
          'UPDATE trip_share_links SET views_count = views_count + 1 WHERE id = ?',
          [record.id]
        );
        record.views_count += 1;
      }
      return record;
    } catch (err) {
      const fallback = FALLBACK_SHARE_LINKS.get(token);
      if (fallback) {
        if (fallback.is_active) fallback.views_count++;
        return fallback;
      }
      return null;
    }
  },

  /**
   * Get share status and views count for a trip
   */
  async getStatusByTripId(tripId, userId) {
    const numericTripId = parseInt(tripId, 10);
    const numericUserId = parseInt(userId, 10);

    try {
      const [rows] = await query(
        'SELECT * FROM trip_share_links WHERE trip_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1',
        [numericTripId, numericUserId]
      );
      if (rows && rows.length > 0) {
        return rows[0];
      }
      return null;
    } catch (err) {
      for (const record of FALLBACK_SHARE_LINKS.values()) {
        if (record.trip_id === numericTripId && record.user_id === numericUserId) {
          return record;
        }
      }
      return null;
    }
  },
};

module.exports = shareModel;
