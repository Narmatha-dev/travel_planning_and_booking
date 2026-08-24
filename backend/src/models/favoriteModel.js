const { query } = require('../config/db');
const destinationModel = require('./destinationModel');

// In-memory fallback favorites store
const inMemoryFavorites = new Map();

// Helper to seed initial sample favorites
function seedInitialFavorites() {
  inMemoryFavorites.set('3_destination_1', {
    id: 1,
    user_id: 3,
    item_type: 'destination',
    item_id: '1',
    destination_id: 1,
    title: 'Bali Paradise Island',
    subtitle: 'Indonesia • Tropical Beach Haven',
    category: 'beach',
    rating: 4.9,
    price_display: '$899',
    image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
    location: 'Bali, Indonesia',
    created_at: '2026-08-01 10:00:00',
  });

  inMemoryFavorites.set('3_hotel_hotel_maha_radisson', {
    id: 2,
    user_id: 3,
    item_type: 'hotel',
    item_id: 'hotel_maha_radisson',
    title: 'Radisson Blu Resort Temple Bay Mamallapuram',
    subtitle: 'Luxury Beach Resort • 27,000 sq ft Pool',
    category: 'hotel',
    rating: 4.6,
    price_display: '₹8,500 / night',
    image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80',
    location: 'Mamallapuram, Tamil Nadu',
    created_at: '2026-08-05 14:30:00',
  });

  inMemoryFavorites.set('3_trip_1', {
    id: 3,
    user_id: 3,
    item_type: 'trip',
    item_id: '1',
    trip_id: 1,
    title: "Alex's Bali Summer Escape",
    subtitle: '7-Day Tropical Itinerary (Planned)',
    category: 'trip',
    rating: 5.0,
    price_display: '$1,450 Total Budget',
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    location: 'Bali, Indonesia',
    created_at: '2026-08-10 11:20:00',
  });
}

seedInitialFavorites();

let idSequence = 100;

const favoriteModel = {
  /**
   * Add item to favorites with duplicate protection
   */
  async addFavorite(userId, { itemType = 'destination', itemId, itemData = {}, destinationId, packageId }) {
    const uId = parseInt(userId, 10);
    const normalizedType = String(itemType).toLowerCase();
    const normalizedId = String(itemId || destinationId || packageId || '1');
    const key = `${uId}_${normalizedType}_${normalizedId}`;

    // 1. Check if already favorited in-memory
    if (inMemoryFavorites.has(key)) {
      return {
        ...inMemoryFavorites.get(key),
        isNew: false,
        message: 'Item already in favorites',
      };
    }

    const newFav = {
      id: ++idSequence,
      user_id: uId,
      item_type: normalizedType,
      item_id: normalizedId,
      destination_id: destinationId ? parseInt(destinationId, 10) : (normalizedType === 'destination' ? parseInt(normalizedId, 10) : null),
      package_id: packageId ? parseInt(packageId, 10) : (normalizedType === 'package' ? parseInt(normalizedId, 10) : null),
      title: itemData.title || itemData.name || 'Saved Travel Item',
      subtitle: itemData.subtitle || itemData.type_label || itemData.category || '',
      category: itemData.category || normalizedType,
      rating: parseFloat(itemData.rating || 4.8),
      price_display: itemData.price_display || (itemData.base_price ? `$${itemData.base_price}` : (itemData.approx_price_per_night ? `₹${itemData.approx_price_per_night} / night` : '')),
      image_url: itemData.image_url || itemData.featured_image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      location: itemData.location || (itemData.city ? `${itemData.city}, ${itemData.country || ''}` : ''),
      created_at: new Date().toISOString(),
    };

    inMemoryFavorites.set(key, newFav);

    // 2. Persist to DB if connected
    try {
      if (newFav.destination_id) {
        await query(
          'INSERT IGNORE INTO favorites (user_id, destination_id) VALUES (?, ?)',
          [uId, newFav.destination_id]
        );
      } else if (newFav.package_id) {
        await query(
          'INSERT IGNORE INTO favorites (user_id, package_id) VALUES (?, ?)',
          [uId, newFav.package_id]
        );
      }
    } catch {
      // Continue with in-memory persistence
    }

    return { ...newFav, isNew: true };
  },

  /**
   * Remove item from user's favorites
   */
  async removeFavorite(userId, { id, itemType, itemId, destinationId, packageId }) {
    const uId = parseInt(userId, 10);
    let removed = false;

    // Search by key
    if (itemType && itemId) {
      const key = `${uId}_${String(itemType).toLowerCase()}_${String(itemId)}`;
      if (inMemoryFavorites.has(key)) {
        inMemoryFavorites.delete(key);
        removed = true;
      }
    }

    // Search by specific ID or destination/package ID
    for (const [k, fav] of inMemoryFavorites.entries()) {
      if (fav.user_id === uId) {
        if (
          (id && fav.id === parseInt(id, 10)) ||
          (destinationId && fav.destination_id === parseInt(destinationId, 10)) ||
          (packageId && fav.package_id === parseInt(packageId, 10)) ||
          (itemId && fav.item_id === String(itemId))
        ) {
          inMemoryFavorites.delete(k);
          removed = true;
        }
      }
    }

    // Remove from DB if connected
    try {
      if (destinationId) {
        await query('DELETE FROM favorites WHERE user_id = ? AND destination_id = ?', [uId, destinationId]);
      } else if (packageId) {
        await query('DELETE FROM favorites WHERE user_id = ? AND package_id = ?', [uId, packageId]);
      } else if (id) {
        await query('DELETE FROM favorites WHERE user_id = ? AND id = ?', [uId, id]);
      }
    } catch {
      // Continue smoothly
    }

    return { success: true, removed };
  },

  /**
   * Check if a specific item is favorited by user
   */
  async isFavorited(userId, itemType, itemId) {
    if (!userId) return false;
    const uId = parseInt(userId, 10);
    const key = `${uId}_${String(itemType).toLowerCase()}_${String(itemId)}`;
    if (inMemoryFavorites.has(key)) return true;

    try {
      if (itemType === 'destination') {
        const [rows] = await query(
          'SELECT id FROM favorites WHERE user_id = ? AND destination_id = ?',
          [uId, itemId]
        );
        return rows && rows.length > 0;
      }
    } catch {
      // Fallback
    }

    return false;
  },

  /**
   * Find all favorites for a user with category filtering & search
   */
  async findUserFavorites(userId, { category = 'all', search = '' } = {}) {
    const uId = parseInt(userId, 10);
    let results = [];

    // Collect from inMemory store
    for (const fav of inMemoryFavorites.values()) {
      if (fav.user_id === uId) {
        results.push({ ...fav });
      }
    }

    // If DB is connected and returns destinations favorites, merge them
    try {
      const [rows] = await query(`
        SELECT 
          f.id,
          f.user_id,
          'destination' AS item_type,
          CAST(f.destination_id AS CHAR) AS item_id,
          f.destination_id,
          d.name AS title,
          CONCAT(d.city, ', ', d.country) AS subtitle,
          d.category,
          d.rating,
          CONCAT('$', d.base_price) AS price_display,
          d.featured_image_url AS image_url,
          CONCAT(d.city, ', ', d.country) AS location,
          f.created_at
        FROM favorites f
        JOIN destinations d ON d.id = f.destination_id
        WHERE f.user_id = ?
      `, [uId]);

      if (rows && rows.length > 0) {
        for (const row of rows) {
          const key = `${uId}_destination_${row.destination_id}`;
          if (!inMemoryFavorites.has(key)) {
            results.push(row);
          }
        }
      }
    } catch {
      // In-memory results will serve
    }

    // Apply category filtering
    if (category && category !== 'all') {
      const cat = category.toLowerCase();
      if (cat === 'places' || cat === 'destinations' || cat === 'destination') {
        results = results.filter((r) => r.item_type === 'destination' || r.item_type === 'place');
      } else if (cat === 'hotels' || cat === 'hotel') {
        results = results.filter((r) => r.item_type === 'hotel');
      } else if (cat === 'trips' || cat === 'trip') {
        results = results.filter((r) => r.item_type === 'trip');
      } else {
        results = results.filter((r) => r.item_type === cat || r.category === cat);
      }
    }

    // Apply search filter
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      results = results.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.subtitle?.toLowerCase().includes(q) ||
          r.location?.toLowerCase().includes(q)
      );
    }

    // Sort by newest
    results.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    return results;
  },

  /**
   * Get user favorites count and categories summary
   */
  async getFavoritesSummary(userId) {
    const list = await this.findUserFavorites(userId, { category: 'all' });
    const summary = {
      total: list.length,
      places: list.filter((r) => r.item_type === 'destination' || r.item_type === 'place').length,
      hotels: list.filter((r) => r.item_type === 'hotel').length,
      trips: list.filter((r) => r.item_type === 'trip').length,
      categories: [...new Set(list.map((r) => r.category).filter(Boolean))],
    };
    return summary;
  },
};

module.exports = favoriteModel;
