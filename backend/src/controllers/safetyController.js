const safetyService = require('../services/safetyService');
const trustedContactModel = require('../models/trustedContactModel');

const safetyController = {
  /**
   * GET /api/safety/nearby
   * Retrieves verified nearby hospitals, police stations, and pharmacies
   */
  async getNearbySafetyPlaces(req, res, next) {
    try {
      const { latitude, longitude, type, radiusKm, radius, limit } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({
          status: 'error',
          message: 'Both latitude and longitude parameters are required to find nearby safety facilities.',
        });
      }

      const effectiveRadius = radiusKm || radius || 10;
      const data = await safetyService.getNearbySafetyPlaces({
        latitude,
        longitude,
        type: type || 'all',
        radiusKm: effectiveRadius,
        limit: limit || 20,
      });

      res.json({
        status: 'success',
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/safety/emergency-numbers
   * Retrieves verified emergency dispatch numbers by country or coordinates
   */
  async getEmergencyNumbers(req, res, next) {
    try {
      const { country, lat, lng, latitude, longitude } = req.query;
      const effectiveLat = lat || latitude;
      const effectiveLng = lng || longitude;

      const data = await safetyService.getEmergencyNumbers({
        country,
        latitude: effectiveLat,
        longitude: effectiveLng,
      });

      res.json({
        status: 'success',
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/safety/contacts
   * Retrieves authenticated user's trusted emergency contacts (Feature 12)
   */
  async getTrustedContacts(req, res, next) {
    try {
      const userId = req.user.id;
      const contacts = await trustedContactModel.getByUserId(userId);

      res.json({
        status: 'success',
        data: {
          count: contacts.length,
          contacts,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/safety/contacts
   * Adds a new trusted emergency contact (Feature 12)
   */
  async createTrustedContact(req, res, next) {
    try {
      const userId = req.user.id;
      const { name, phone, relationship, email, isPrimary, is_primary } = req.body;

      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          status: 'error',
          message: 'Contact name is required.',
        });
      }

      if (!phone || typeof phone !== 'string' || !phone.trim()) {
        return res.status(400).json({
          status: 'error',
          message: 'Valid contact phone number is required.',
        });
      }

      const created = await trustedContactModel.create({
        userId,
        name: name.trim(),
        phone: phone.trim(),
        relationship: (relationship || 'Family').trim(),
        email: email ? email.trim() : null,
        isPrimary: isPrimary !== undefined ? isPrimary : is_primary,
      });

      res.status(201).json({
        status: 'success',
        message: 'Trusted contact added successfully.',
        data: created,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/safety/contacts/:id
   * Updates an existing trusted contact (Feature 12)
   */
  async updateTrustedContact(req, res, next) {
    try {
      const userId = req.user.id;
      const contactId = req.params.id;
      const { name, phone, relationship, email, isPrimary, is_primary } = req.body;

      const updated = await trustedContactModel.update(contactId, userId, {
        name,
        phone,
        relationship,
        email,
        isPrimary: isPrimary !== undefined ? isPrimary : is_primary,
      });

      if (!updated) {
        return res.status(404).json({
          status: 'error',
          message: `Trusted contact with ID '${contactId}' was not found or you do not have permission to edit it.`,
        });
      }

      res.json({
        status: 'success',
        message: 'Trusted contact updated successfully.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/safety/contacts/:id
   * Deletes a trusted contact (Feature 12)
   */
  async deleteTrustedContact(req, res, next) {
    try {
      const userId = req.user.id;
      const contactId = req.params.id;

      const deleted = await trustedContactModel.delete(contactId, userId);

      if (!deleted) {
        return res.status(404).json({
          status: 'error',
          message: `Trusted contact with ID '${contactId}' was not found.`,
        });
      }

      res.json({
        status: 'success',
        message: 'Trusted contact deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/safety/share-location
   * Prepares formatted safe location sharing text and links (Feature 11)
   */
  async prepareShareLocation(req, res, next) {
    try {
      const user = req.user;
      const { latitude, longitude, customMessage } = req.body;

      if (!latitude || !longitude) {
        return res.status(400).json({
          status: 'error',
          message: 'Coordinates are required to prepare the location sharing update.',
        });
      }

      const shareData = await safetyService.prepareLocationSharePayload({
        user,
        latitude,
        longitude,
        customMessage,
      });

      res.json({
        status: 'success',
        message: 'Location sharing payload prepared.',
        data: shareData,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = safetyController;
