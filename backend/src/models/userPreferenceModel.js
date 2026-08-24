const { query } = require('../config/db');

// In-memory fallback stores
const FALLBACK_PREFERENCES = new Map([
  [
    3,
    {
      user_id: 3,
      interests: ['nature', 'beach', 'adventure', 'photography'],
      preferred_travel_type: 'family',
      preferred_budget: 20000,
      preferred_currency: 'INR',
      updated_at: new Date().toISOString(),
    },
  ],
]);

const FALLBACK_FEEDBACK = [];
let nextFeedbackId = 1;

let tablesEnsured = false;
async function ensureTables() {
  if (tablesEnsured) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        interests JSON,
        preferred_travel_type VARCHAR(50) DEFAULT 'family',
        preferred_budget DECIMAL(10,2) DEFAULT 20000.00,
        preferred_currency VARCHAR(10) DEFAULT 'INR',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS recommendation_feedback (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        item_id VARCHAR(100) NOT NULL,
        item_type VARCHAR(50) DEFAULT 'destination',
        feedback_type ENUM('useful', 'not_relevant', 'not_interested') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (user_id),
        INDEX (item_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    tablesEnsured = true;
  } catch (err) {
    // Database may be offline, use memory fallback
  }
}

const userPreferenceModel = {
  /**
   * Get user preferences by user_id
   */
  async getPreferences(userId) {
    const uid = parseInt(userId, 10);
    await ensureTables();
    try {
      const [rows] = await query('SELECT * FROM user_preferences WHERE user_id = ? LIMIT 1', [uid]);
      if (rows && rows.length > 0) {
        const row = rows[0];
        let parsedInterests = row.interests;
        if (typeof parsedInterests === 'string') {
          try {
            parsedInterests = JSON.parse(parsedInterests);
          } catch {}
        }
        return {
          user_id: row.user_id,
          interests: Array.isArray(parsedInterests) ? parsedInterests : ['nature', 'beach'],
          preferred_travel_type: row.preferred_travel_type || 'family',
          preferred_budget: parseFloat(row.preferred_budget || 20000),
          preferred_currency: row.preferred_currency || 'INR',
          updated_at: row.updated_at,
        };
      }
    } catch (err) {}

    // Fallback
    if (FALLBACK_PREFERENCES.has(uid)) {
      return FALLBACK_PREFERENCES.get(uid);
    }

    return {
      user_id: uid,
      interests: ['nature', 'beach', 'culture'],
      preferred_travel_type: 'family',
      preferred_budget: 20000,
      preferred_currency: 'INR',
      updated_at: new Date().toISOString(),
    };
  },

  /**
   * Save / Update user preferences
   */
  async savePreferences(userId, prefs = {}) {
    const uid = parseInt(userId, 10);
    const interests = Array.isArray(prefs.interests) ? prefs.interests : ['nature', 'beach'];
    const travelType = prefs.preferred_travel_type || prefs.travelType || 'family';
    const budget = parseFloat(prefs.preferred_budget || prefs.budget || 20000);
    const currency = prefs.preferred_currency || prefs.currency || 'INR';

    await ensureTables();
    try {
      const [existing] = await query('SELECT id FROM user_preferences WHERE user_id = ? LIMIT 1', [uid]);
      if (existing && existing.length > 0) {
        await query(
          'UPDATE user_preferences SET interests = ?, preferred_travel_type = ?, preferred_budget = ?, preferred_currency = ? WHERE user_id = ?',
          [JSON.stringify(interests), travelType, budget, currency, uid]
        );
      } else {
        await query(
          'INSERT INTO user_preferences (user_id, interests, preferred_travel_type, preferred_budget, preferred_currency) VALUES (?, ?, ?, ?, ?)',
          [uid, JSON.stringify(interests), travelType, budget, currency]
        );
      }
    } catch (err) {
      console.warn('savePreferences DB warn:', err.message);
    }

    // Update in-memory fallback
    const saved = {
      user_id: uid,
      interests,
      preferred_travel_type: travelType,
      preferred_budget: budget,
      preferred_currency: currency,
      updated_at: new Date().toISOString(),
    };
    FALLBACK_PREFERENCES.set(uid, saved);
    return saved;
  },

  /**
   * Submit feedback (useful, not_relevant, not_interested)
   */
  async addFeedback(userId, { itemId, itemType = 'destination', feedbackType = 'useful' }) {
    const uid = parseInt(userId, 10);
    await ensureTables();
    try {
      await query(
        'INSERT INTO recommendation_feedback (user_id, item_id, item_type, feedback_type) VALUES (?, ?, ?, ?)',
        [uid, String(itemId), itemType, feedbackType]
      );
    } catch (err) {
      console.warn('addFeedback DB warn:', err.message);
    }

    // Always sync in-memory
    const record = {
      id: nextFeedbackId++,
      user_id: uid,
      item_id: String(itemId),
      item_type: itemType,
      feedback_type: feedbackType,
      created_at: new Date().toISOString(),
    };
    FALLBACK_FEEDBACK.push(record);
    return record;
  },

  /**
   * Get user feedback history
   */
  async getUserFeedback(userId) {
    const uid = parseInt(userId, 10);
    await ensureTables();
    try {
      const [rows] = await query(
        'SELECT * FROM recommendation_feedback WHERE user_id = ? ORDER BY id DESC',
        [uid]
      );
      if (rows && rows.length > 0) {
        return rows;
      }
    } catch (err) {}

    return FALLBACK_FEEDBACK.filter((f) => f.user_id === uid);
  },
};

module.exports = userPreferenceModel;
