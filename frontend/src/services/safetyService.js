import api from './api';

const OFFLINE_EMERGENCY_KEY = 'travelora_offline_emergency_cache';
const OFFLINE_CONTACTS_KEY = 'travelora_offline_contacts_cache';

const safetyService = {
  /**
   * Retrieves verified nearby safety places (Hospitals, Police, Pharmacies)
   */
  async getNearbySafetyPlaces({ latitude, longitude, type = 'all', radiusKm = 10, limit = 20 }) {
    const response = await api.get('/safety/nearby', {
      params: {
        latitude,
        longitude,
        type,
        radiusKm,
        limit,
      },
    });
    return response.data.data;
  },

  /**
   * Retrieves country emergency numbers with offline caching support (Feature 6 & 15)
   */
  async getEmergencyNumbers({ country, latitude, longitude }) {
    try {
      const response = await api.get('/safety/emergency-numbers', {
        params: {
          country,
          latitude,
          longitude,
        },
      });
      const data = response.data.data;
      // Cache for offline safety information
      if (data) {
        try {
          localStorage.setItem(OFFLINE_EMERGENCY_KEY, JSON.stringify(data));
        } catch {}
      }
      return data;
    } catch (err) {
      // Fallback to offline cached emergency numbers
      try {
        const cached = localStorage.getItem(OFFLINE_EMERGENCY_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          return { ...parsed, isOfflineCache: true };
        }
      } catch {}
      throw err;
    }
  },

  /**
   * Retrieves user's trusted emergency contacts (Feature 12)
   */
  async getTrustedContacts() {
    try {
      const response = await api.get('/safety/contacts');
      const data = response.data.data;
      if (data?.contacts) {
        try {
          localStorage.setItem(OFFLINE_CONTACTS_KEY, JSON.stringify(data.contacts));
        } catch {}
      }
      return data;
    } catch (err) {
      // Fallback to offline contacts cache if network fails
      try {
        const cached = localStorage.getItem(OFFLINE_CONTACTS_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          return { count: parsed.length, contacts: parsed, isOfflineCache: true };
        }
      } catch {}
      throw err;
    }
  },

  /**
   * Adds a new trusted contact (Feature 12)
   */
  async createTrustedContact(contactData) {
    const response = await api.post('/safety/contacts', contactData);
    return response.data.data;
  },

  /**
   * Updates an existing trusted contact (Feature 12)
   */
  async updateTrustedContact(contactId, contactData) {
    const response = await api.put(`/safety/contacts/${contactId}`, contactData);
    return response.data.data;
  },

  /**
   * Deletes a trusted contact (Feature 12)
   */
  async deleteTrustedContact(contactId) {
    const response = await api.delete(`/safety/contacts/${contactId}`);
    return response.data;
  },

  /**
   * Prepares a location sharing payload (Feature 11)
   */
  async prepareLocationShare({ latitude, longitude, customMessage }) {
    const response = await api.post('/safety/share-location', {
      latitude,
      longitude,
      customMessage,
    });
    return response.data.data;
  },
};

export default safetyService;
