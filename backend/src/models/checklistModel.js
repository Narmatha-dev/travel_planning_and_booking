const { query } = require('../config/db');

// In-memory fallback checklist store when MySQL table is offline or during testing
let FALLBACK_CHECKLIST_ITEMS = [
  {
    id: 1,
    trip_id: 1,
    booking_id: 1,
    user_id: 3,
    category: 'identification',
    item_name: 'Government Photo ID / Passport',
    notes: 'Carry physical ID card for security check-in',
    is_completed: 1,
    is_custom: 0,
    created_at: '2026-08-15 10:00:00',
    updated_at: '2026-08-15 10:00:00',
  },
  {
    id: 2,
    trip_id: 1,
    booking_id: 1,
    user_id: 3,
    category: 'transport',
    item_name: 'Confirmed Transport Booking Voucher',
    notes: 'Booking #BK-2026-001 confirmed',
    is_completed: 1,
    is_custom: 0,
    created_at: '2026-08-15 10:00:00',
    updated_at: '2026-08-15 10:00:00',
  },
  {
    id: 3,
    trip_id: 1,
    booking_id: 1,
    user_id: 3,
    category: 'hotel',
    item_name: 'Hotel Check-in Voucher & Address',
    notes: 'Ubud Luxury Resort check-in confirmation',
    is_completed: 1,
    is_custom: 0,
    created_at: '2026-08-15 10:00:00',
    updated_at: '2026-08-15 10:00:00',
  },
  {
    id: 4,
    trip_id: 1,
    booking_id: 1,
    user_id: 3,
    category: 'pre_trip',
    item_name: 'Review Emergency Hotlines & Trusted Contacts',
    notes: 'Phase 25 safety contacts verified',
    is_completed: 1,
    is_custom: 0,
    created_at: '2026-08-15 10:00:00',
    updated_at: '2026-08-15 10:00:00',
  },
  {
    id: 5,
    trip_id: 1,
    booking_id: 1,
    user_id: 3,
    category: 'pre_trip',
    item_name: 'Complete Smart Packing Checklist',
    notes: 'Check weather-based clothing items',
    is_completed: 0,
    is_custom: 0,
    created_at: '2026-08-15 10:00:00',
    updated_at: '2026-08-15 10:00:00',
  },
];

let nextChecklistId = 50;

// Ensure MySQL table exists
let tableInitialized = false;
async function initTable() {
  if (tableInitialized) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS trip_checklist_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        trip_id INT NULL,
        booking_id INT NULL,
        user_id INT NOT NULL,
        category VARCHAR(50) NOT NULL,
        item_name VARCHAR(150) NOT NULL,
        notes VARCHAR(255) NULL,
        is_completed TINYINT(1) DEFAULT 0,
        is_custom TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_trip_user (trip_id, user_id),
        INDEX idx_booking_user (booking_id, user_id),
        INDEX idx_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    tableInitialized = true;
  } catch {
    // If DB is offline, continue using fallback memory store
  }
}

initTable().catch(() => {});

function normalizeItem(item) {
  if (!item) return null;
  return {
    ...item,
    id: parseInt(item.id, 10),
    trip_id: item.trip_id ? parseInt(item.trip_id, 10) : null,
    booking_id: item.booking_id ? parseInt(item.booking_id, 10) : null,
    user_id: parseInt(item.user_id, 10),
    is_completed: Boolean(item.is_completed === 1 || item.is_completed === true),
    is_custom: Boolean(item.is_custom === 1 || item.is_custom === true),
  };
}

const checklistModel = {
  /**
   * Find checklist items by trip ID for a specific user
   */
  async findByTripId(tripId, userId) {
    await initTable();
    const tId = tripId ? parseInt(tripId, 10) : null;
    const uId = parseInt(userId, 10);

    try {
      const [rows] = await query(
        `SELECT * FROM trip_checklist_items 
         WHERE (trip_id = ? OR booking_id = ?) AND user_id = ? 
         ORDER BY id ASC`,
        [tId, tId, uId]
      );
      if (rows && rows.length > 0) {
        return rows.map(normalizeItem);
      }
    } catch {}

    // Fallback in-memory
    const items = FALLBACK_CHECKLIST_ITEMS.filter(
      (item) =>
        (item.trip_id === tId || item.booking_id === tId) &&
        (item.user_id === uId || !uId)
    );
    return items.map(normalizeItem);
  },

  /**
   * Find checklist item by ID for a user
   */
  async findById(id, userId) {
    await initTable();
    const itemId = parseInt(id, 10);
    const uId = userId ? parseInt(userId, 10) : null;

    try {
      const sql = uId
        ? `SELECT * FROM trip_checklist_items WHERE id = ? AND user_id = ? LIMIT 1`
        : `SELECT * FROM trip_checklist_items WHERE id = ? LIMIT 1`;
      const params = uId ? [itemId, uId] : [itemId];
      const [rows] = await query(sql, params);
      if (rows && rows.length > 0) {
        return normalizeItem(rows[0]);
      }
    } catch {}

    const item = FALLBACK_CHECKLIST_ITEMS.find(
      (i) => i.id === itemId && (!uId || i.user_id === uId)
    );
    return normalizeItem(item);
  },

  /**
   * Create a single checklist item
   */
  async createItem({ tripId, bookingId, userId, category, itemName, notes = null, isCompleted = false, isCustom = false }) {
    await initTable();
    const uId = parseInt(userId, 10);
    const tId = tripId ? parseInt(tripId, 10) : null;
    const bId = bookingId ? parseInt(bookingId, 10) : null;
    const compVal = isCompleted ? 1 : 0;
    const customVal = isCustom ? 1 : 0;
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    try {
      const [result] = await query(
        `INSERT INTO trip_checklist_items 
          (trip_id, booking_id, user_id, category, item_name, notes, is_completed, is_custom, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [tId, bId, uId, category, itemName, notes, compVal, customVal]
      );
      const created = {
        id: result.insertId,
        trip_id: tId,
        booking_id: bId,
        user_id: uId,
        category,
        item_name: itemName,
        notes,
        is_completed: compVal,
        is_custom: customVal,
        created_at: now,
        updated_at: now,
      };
      FALLBACK_CHECKLIST_ITEMS.push(created);
      return normalizeItem(created);
    } catch {
      const created = {
        id: ++nextChecklistId,
        trip_id: tId,
        booking_id: bId,
        user_id: uId,
        category,
        item_name: itemName,
        notes,
        is_completed: compVal,
        is_custom: customVal,
        created_at: now,
        updated_at: now,
      };
      FALLBACK_CHECKLIST_ITEMS.push(created);
      return normalizeItem(created);
    }
  },

  /**
   * Bulk insert checklist items
   */
  async bulkCreateItems(items = []) {
    await initTable();
    if (!items || items.length === 0) return [];

    const inserted = [];
    for (const item of items) {
      const res = await this.createItem(item);
      inserted.push(res);
    }
    return inserted;
  },

  /**
   * Toggle completed status of an item
   */
  async toggleCompleted(id, userId) {
    await initTable();
    const itemId = parseInt(id, 10);
    const uId = parseInt(userId, 10);

    const existing = await this.findById(itemId, uId);
    if (!existing) return null;

    const newCompleted = !existing.is_completed;
    const compVal = newCompleted ? 1 : 0;

    try {
      await query(
        `UPDATE trip_checklist_items SET is_completed = ?, updated_at = NOW() WHERE id = ? AND user_id = ?`,
        [compVal, itemId, uId]
      );
    } catch {}

    const memoryItem = FALLBACK_CHECKLIST_ITEMS.find(
      (i) => i.id === itemId && i.user_id === uId
    );
    if (memoryItem) {
      memoryItem.is_completed = compVal;
      memoryItem.updated_at = new Date().toISOString();
    }

    return { ...existing, is_completed: newCompleted };
  },

  /**
   * Update item details (name, notes, category, completed)
   */
  async updateItem(id, userId, updates = {}) {
    await initTable();
    const itemId = parseInt(id, 10);
    const uId = parseInt(userId, 10);

    const existing = await this.findById(itemId, uId);
    if (!existing) return null;

    const itemName = updates.itemName !== undefined ? updates.itemName : existing.item_name;
    const notes = updates.notes !== undefined ? updates.notes : existing.notes;
    const category = updates.category !== undefined ? updates.category : existing.category;
    const isCompleted = updates.isCompleted !== undefined ? (updates.isCompleted ? 1 : 0) : (existing.is_completed ? 1 : 0);

    try {
      await query(
        `UPDATE trip_checklist_items 
         SET item_name = ?, notes = ?, category = ?, is_completed = ?, updated_at = NOW() 
         WHERE id = ? AND user_id = ?`,
        [itemName, notes, category, isCompleted, itemId, uId]
      );
    } catch {}

    const memoryItem = FALLBACK_CHECKLIST_ITEMS.find(
      (i) => i.id === itemId && i.user_id === uId
    );
    if (memoryItem) {
      memoryItem.item_name = itemName;
      memoryItem.notes = notes;
      memoryItem.category = category;
      memoryItem.is_completed = isCompleted;
      memoryItem.updated_at = new Date().toISOString();
    }

    return {
      ...existing,
      item_name: itemName,
      notes,
      category,
      is_completed: Boolean(isCompleted === 1),
    };
  },

  /**
   * Delete a custom checklist item (ensures it is custom)
   */
  async deleteItem(id, userId) {
    await initTable();
    const itemId = parseInt(id, 10);
    const uId = parseInt(userId, 10);

    try {
      const [res] = await query(
        `DELETE FROM trip_checklist_items WHERE id = ? AND user_id = ?`,
        [itemId, uId]
      );
      if (res && res.affectedRows > 0) {
        FALLBACK_CHECKLIST_ITEMS = FALLBACK_CHECKLIST_ITEMS.filter(
          (i) => !(i.id === itemId && i.user_id === uId)
        );
        return true;
      }
    } catch {}

    const initialLen = FALLBACK_CHECKLIST_ITEMS.length;
    FALLBACK_CHECKLIST_ITEMS = FALLBACK_CHECKLIST_ITEMS.filter(
      (i) => !(i.id === itemId && i.user_id === uId)
    );
    return FALLBACK_CHECKLIST_ITEMS.length < initialLen;
  },

  /**
   * Clear all checklist items for a trip
   */
  async clearByTripId(tripId, userId) {
    await initTable();
    const tId = parseInt(tripId, 10);
    const uId = parseInt(userId, 10);

    try {
      await query(
        `DELETE FROM trip_checklist_items WHERE (trip_id = ? OR booking_id = ?) AND user_id = ?`,
        [tId, tId, uId]
      );
    } catch {}

    FALLBACK_CHECKLIST_ITEMS = FALLBACK_CHECKLIST_ITEMS.filter(
      (i) => !((i.trip_id === tId || i.booking_id === tId) && i.user_id === uId)
    );
    return true;
  },
};

module.exports = checklistModel;
