const { query } = require('../config/db');

// In-memory fallback packing items store when MySQL table is offline or during testing
let FALLBACK_PACKING_ITEMS = [
  {
    id: 1,
    trip_id: 1,
    booking_id: null,
    user_id: 3,
    category: 'clothing',
    item_name: 'Light Cotton T-Shirts',
    quantity: 4,
    is_packed: 1,
    is_custom: 0,
    reason: 'Appropriate for 4-day warm climate trip',
    created_at: '2026-08-15 10:00:00',
    updated_at: '2026-08-15 10:00:00',
  },
  {
    id: 2,
    trip_id: 1,
    booking_id: null,
    user_id: 3,
    category: 'documents',
    item_name: 'Government Photo ID / Passport',
    quantity: 1,
    is_packed: 1,
    is_custom: 0,
    reason: 'Mandatory identification for transit & hotel check-in',
    created_at: '2026-08-15 10:00:00',
    updated_at: '2026-08-15 10:00:00',
  },
  {
    id: 3,
    trip_id: 1,
    booking_id: null,
    user_id: 3,
    category: 'electronics',
    item_name: 'Smartphone & Fast Charger',
    quantity: 1,
    is_packed: 0,
    is_custom: 0,
    reason: 'Essential communication and itinerary navigation',
    created_at: '2026-08-15 10:00:00',
    updated_at: '2026-08-15 10:00:00',
  },
  {
    id: 4,
    trip_id: 1,
    booking_id: null,
    user_id: 3,
    category: 'weather',
    item_name: 'Compact Travel Umbrella',
    quantity: 1,
    is_packed: 0,
    is_custom: 0,
    reason: 'Rain forecast for destination dates',
    created_at: '2026-08-15 10:00:00',
    updated_at: '2026-08-15 10:00:00',
  },
];

let nextPackingItemId = 50;

// Ensure MySQL table exists
let tableInitialized = false;
async function initTable() {
  if (tableInitialized) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS packing_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        trip_id INT NULL,
        booking_id INT NULL,
        user_id INT NOT NULL,
        category VARCHAR(50) NOT NULL,
        item_name VARCHAR(150) NOT NULL,
        quantity INT DEFAULT 1,
        is_packed TINYINT(1) DEFAULT 0,
        is_custom TINYINT(1) DEFAULT 0,
        reason VARCHAR(255) NULL,
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
    quantity: parseInt(item.quantity || 1, 10),
    is_packed: Boolean(item.is_packed === 1 || item.is_packed === true),
    is_custom: Boolean(item.is_custom === 1 || item.is_custom === true),
  };
}

const packingModel = {
  /**
   * Find packing items by trip ID for a specific user
   */
  async findByTripId(tripId, userId) {
    await initTable();
    const tId = tripId ? parseInt(tripId, 10) : null;
    const uId = parseInt(userId, 10);

    try {
      const [rows] = await query(
        `SELECT * FROM packing_items 
         WHERE (trip_id = ? OR booking_id = ?) AND user_id = ? 
         ORDER BY id ASC`,
        [tId, tId, uId]
      );
      if (rows && rows.length > 0) {
        return rows.map(normalizeItem);
      }
    } catch {}

    // Fallback in-memory
    const items = FALLBACK_PACKING_ITEMS.filter(
      (item) =>
        (item.trip_id === tId || item.booking_id === tId) &&
        (item.user_id === uId || !uId)
    );
    return items.map(normalizeItem);
  },

  /**
   * Find packing item by ID for a user
   */
  async findById(id, userId) {
    await initTable();
    const itemId = parseInt(id, 10);
    const uId = userId ? parseInt(userId, 10) : null;

    try {
      const sql = uId
        ? `SELECT * FROM packing_items WHERE id = ? AND user_id = ? LIMIT 1`
        : `SELECT * FROM packing_items WHERE id = ? LIMIT 1`;
      const params = uId ? [itemId, uId] : [itemId];
      const [rows] = await query(sql, params);
      if (rows && rows.length > 0) {
        return normalizeItem(rows[0]);
      }
    } catch {}

    const item = FALLBACK_PACKING_ITEMS.find(
      (i) => i.id === itemId && (!uId || i.user_id === uId)
    );
    return normalizeItem(item);
  },

  /**
   * Create a single packing item
   */
  async createItem({ tripId, bookingId, userId, category, itemName, quantity = 1, isPacked = false, isCustom = false, reason = null }) {
    await initTable();
    const uId = parseInt(userId, 10);
    const tId = tripId ? parseInt(tripId, 10) : null;
    const bId = bookingId ? parseInt(bookingId, 10) : null;
    const packedVal = isPacked ? 1 : 0;
    const customVal = isCustom ? 1 : 0;
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    try {
      const [result] = await query(
        `INSERT INTO packing_items 
          (trip_id, booking_id, user_id, category, item_name, quantity, is_packed, is_custom, reason, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [tId, bId, uId, category, itemName, quantity, packedVal, customVal, reason]
      );
      const created = {
        id: result.insertId,
        trip_id: tId,
        booking_id: bId,
        user_id: uId,
        category,
        item_name: itemName,
        quantity,
        is_packed: packedVal,
        is_custom: customVal,
        reason,
        created_at: now,
        updated_at: now,
      };
      FALLBACK_PACKING_ITEMS.push(created);
      return normalizeItem(created);
    } catch {
      const created = {
        id: ++nextPackingItemId,
        trip_id: tId,
        booking_id: bId,
        user_id: uId,
        category,
        item_name: itemName,
        quantity,
        is_packed: packedVal,
        is_custom: customVal,
        reason,
        created_at: now,
        updated_at: now,
      };
      FALLBACK_PACKING_ITEMS.push(created);
      return normalizeItem(created);
    }
  },

  /**
   * Bulk insert packing items for a trip
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
   * Toggle packed status of an item
   */
  async togglePacked(id, userId) {
    await initTable();
    const itemId = parseInt(id, 10);
    const uId = parseInt(userId, 10);

    const existing = await this.findById(itemId, uId);
    if (!existing) return null;

    const newPacked = !existing.is_packed;
    const packedVal = newPacked ? 1 : 0;

    try {
      await query(
        `UPDATE packing_items SET is_packed = ?, updated_at = NOW() WHERE id = ? AND user_id = ?`,
        [packedVal, itemId, uId]
      );
    } catch {}

    const memoryItem = FALLBACK_PACKING_ITEMS.find(
      (i) => i.id === itemId && i.user_id === uId
    );
    if (memoryItem) {
      memoryItem.is_packed = packedVal;
      memoryItem.updated_at = new Date().toISOString();
    }

    return { ...existing, is_packed: newPacked };
  },

  /**
   * Update item details (name, quantity, category)
   */
  async updateItem(id, userId, updates = {}) {
    await initTable();
    const itemId = parseInt(id, 10);
    const uId = parseInt(userId, 10);

    const existing = await this.findById(itemId, uId);
    if (!existing) return null;

    const itemName = updates.itemName !== undefined ? updates.itemName : existing.item_name;
    const quantity = updates.quantity !== undefined ? parseInt(updates.quantity, 10) : existing.quantity;
    const category = updates.category !== undefined ? updates.category : existing.category;
    const isPacked = updates.isPacked !== undefined ? (updates.isPacked ? 1 : 0) : (existing.is_packed ? 1 : 0);

    try {
      await query(
        `UPDATE packing_items 
         SET item_name = ?, quantity = ?, category = ?, is_packed = ?, updated_at = NOW() 
         WHERE id = ? AND user_id = ?`,
        [itemName, quantity, category, isPacked, itemId, uId]
      );
    } catch {}

    const memoryItem = FALLBACK_PACKING_ITEMS.find(
      (i) => i.id === itemId && i.user_id === uId
    );
    if (memoryItem) {
      memoryItem.item_name = itemName;
      memoryItem.quantity = quantity;
      memoryItem.category = category;
      memoryItem.is_packed = isPacked;
      memoryItem.updated_at = new Date().toISOString();
    }

    return {
      ...existing,
      item_name: itemName,
      quantity,
      category,
      is_packed: Boolean(isPacked === 1),
    };
  },

  /**
   * Delete a packing item
   */
  async deleteItem(id, userId) {
    await initTable();
    const itemId = parseInt(id, 10);
    const uId = parseInt(userId, 10);

    try {
      const [res] = await query(
        `DELETE FROM packing_items WHERE id = ? AND user_id = ?`,
        [itemId, uId]
      );
      if (res && res.affectedRows > 0) {
        FALLBACK_PACKING_ITEMS = FALLBACK_PACKING_ITEMS.filter(
          (i) => !(i.id === itemId && i.user_id === uId)
        );
        return true;
      }
    } catch {}

    const initialLen = FALLBACK_PACKING_ITEMS.length;
    FALLBACK_PACKING_ITEMS = FALLBACK_PACKING_ITEMS.filter(
      (i) => !(i.id === itemId && i.user_id === uId)
    );
    return FALLBACK_PACKING_ITEMS.length < initialLen;
  },

  /**
   * Clear all packing items for a trip
   */
  async clearByTripId(tripId, userId) {
    await initTable();
    const tId = parseInt(tripId, 10);
    const uId = parseInt(userId, 10);

    try {
      await query(
        `DELETE FROM packing_items WHERE (trip_id = ? OR booking_id = ?) AND user_id = ?`,
        [tId, tId, uId]
      );
    } catch {}

    FALLBACK_PACKING_ITEMS = FALLBACK_PACKING_ITEMS.filter(
      (i) => !((i.trip_id === tId || i.booking_id === tId) && i.user_id === uId)
    );
    return true;
  },
};

module.exports = packingModel;
