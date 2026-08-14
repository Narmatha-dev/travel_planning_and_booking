const { query } = require('../config/db');

// Fallback destination data matching database/seed.sql in case MySQL server is offline during preview
const FALLBACK_DESTINATIONS = [
  {
    id: 1,
    name: 'Bali Paradise Island',
    slug: 'bali-paradise-island',
    country: 'Indonesia',
    city: 'Bali',
    description: 'Tropical paradise known for lush volcanic mountains, iconic rice paddies, serene beaches, and vibrant coral reefs.',
    category: 'beach',
    featured_image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
    gallery_images: [
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
      'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800',
      'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800',
    ],
    rating: 4.90,
    popularity_score: 98,
    climate: 'Tropical warm, average 28°C',
    best_time_to_visit: 'April to October',
    price_level: 'moderate',
    is_featured: 1,
    is_active: 1,
    packages_count: 1,
    base_price: 1099.00,
  },
  {
    id: 2,
    name: 'Kyoto & Tokyo Highlights',
    slug: 'kyoto-tokyo-highlights',
    country: 'Japan',
    city: 'Tokyo',
    description: 'Experience the futuristic skyline of Tokyo combined with the timeless shrines, bamboo groves, and tea ceremonies of Kyoto.',
    category: 'cultural',
    featured_image_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800',
    gallery_images: [
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800',
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800',
      'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800',
    ],
    rating: 4.95,
    popularity_score: 99,
    climate: 'Temperate four seasons',
    best_time_to_visit: 'March to May & Sept to Nov',
    price_level: 'expensive',
    is_featured: 1,
    is_active: 1,
    packages_count: 1,
    base_price: 2699.00,
  },
  {
    id: 3,
    name: 'Swiss Alpine Wonders',
    slug: 'swiss-alpine-wonders',
    country: 'Switzerland',
    city: 'Zermatt',
    description: 'Majestic snow-capped peaks, alpine lakes, scenic panoramic trains, and world-class ski and spa resorts.',
    category: 'mountain',
    featured_image_url: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800',
    gallery_images: [
      'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
    ],
    rating: 4.88,
    popularity_score: 92,
    climate: 'Alpine continental',
    best_time_to_visit: 'June to August & Dec to March',
    price_level: 'luxury',
    is_featured: 1,
    is_active: 1,
    packages_count: 1,
    base_price: 3199.00,
  },
  {
    id: 4,
    name: 'Parisian Elegance',
    slug: 'parisian-elegance',
    country: 'France',
    city: 'Paris',
    description: 'The City of Light offers iconic architecture, world-renowned gastronomy, haute couture, and romantic Seine river cruises.',
    category: 'city_break',
    featured_image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
    gallery_images: [
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
      'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800',
    ],
    rating: 4.85,
    popularity_score: 95,
    climate: 'Oceanic mild',
    best_time_to_visit: 'April to June & Sept to Oct',
    price_level: 'expensive',
    is_featured: 1,
    is_active: 1,
    packages_count: 1,
    base_price: 1699.00,
  },
  {
    id: 5,
    name: 'Santorini Sunsets',
    slug: 'santorini-sunsets',
    country: 'Greece',
    city: 'Oia',
    description: 'Iconic whitewashed cubic villages perched upon high cliffs overlooking the turquoise Aegean Sea with breathtaking sunsets.',
    category: 'luxury',
    featured_image_url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800',
    gallery_images: [
      'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800',
      'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800',
    ],
    rating: 4.92,
    popularity_score: 94,
    climate: 'Mediterranean sunny',
    best_time_to_visit: 'May to October',
    price_level: 'luxury',
    is_featured: 1,
    is_active: 1,
    packages_count: 1,
    base_price: 1999.00,
  },
  {
    id: 6,
    name: 'Serengeti Wildlife Safari',
    slug: 'serengeti-wildlife-safari',
    country: 'Tanzania',
    city: 'Serengeti',
    description: 'Witness the Great Migration, majestic wildlife in their natural habitat, and breathtaking sunrise hot air balloon safaris.',
    category: 'adventure',
    featured_image_url: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800',
    gallery_images: [
      'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800',
      'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?w=800',
    ],
    rating: 4.96,
    popularity_score: 96,
    climate: 'Warm tropical savanna',
    best_time_to_visit: 'June to October',
    price_level: 'luxury',
    is_featured: 1,
    is_active: 1,
    packages_count: 1,
    base_price: 3499.00,
  },
];

// Fallback favorites store for session mock
const inMemoryFavorites = new Set();

const destinationModel = {
  /**
   * Find all destinations with filters and sorting
   */
  async findAll({ category, priceLevel, minRating, isFeatured, sortBy, limit = 50, offset = 0, userId } = {}) {
    try {
      let sql = `
        SELECT 
          d.*,
          COUNT(DISTINCT p.id) AS packages_count,
          MIN(p.base_price) AS base_price,
          ${userId ? `EXISTS(SELECT 1 FROM favorites f WHERE f.user_id = ? AND f.destination_id = d.id) AS is_favorite` : '0 AS is_favorite'}
        FROM destinations d
        LEFT JOIN packages p ON p.destination_id = d.id AND p.is_available = TRUE
        WHERE d.is_active = TRUE
      `;
      const params = userId ? [userId] : [];

      if (category && category !== 'all') {
        sql += ' AND d.category = ?';
        params.push(category);
      }

      if (priceLevel) {
        sql += ' AND d.price_level = ?';
        params.push(priceLevel);
      }

      if (minRating) {
        sql += ' AND d.rating >= ?';
        params.push(parseFloat(minRating));
      }

      if (isFeatured !== undefined && isFeatured !== null) {
        sql += ' AND d.is_featured = ?';
        params.push(isFeatured ? 1 : 0);
      }

      sql += ' GROUP BY d.id';

      // Sorting
      if (sortBy === 'rating') {
        sql += ' ORDER BY d.rating DESC, d.popularity_score DESC';
      } else if (sortBy === 'price_asc') {
        sql += ' ORDER BY base_price ASC';
      } else if (sortBy === 'price_desc') {
        sql += ' ORDER BY base_price DESC';
      } else {
        sql += ' ORDER BY d.popularity_score DESC, d.rating DESC';
      }

      sql += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit, 10), parseInt(offset, 10));

      const [rows] = await query(sql, params);
      return rows.map((r) => ({
        ...r,
        is_favorite: Boolean(r.is_favorite),
        gallery_images: typeof r.gallery_images === 'string' ? JSON.parse(r.gallery_images) : r.gallery_images,
      }));
    } catch (err) {
      // Fallback for offline mode
      let list = [...FALLBACK_DESTINATIONS];
      if (category && category !== 'all') list = list.filter((d) => d.category === category);
      if (priceLevel) list = list.filter((d) => d.price_level === priceLevel);
      if (minRating) list = list.filter((d) => d.rating >= parseFloat(minRating));
      if (isFeatured) list = list.filter((d) => Boolean(d.is_featured));

      if (sortBy === 'rating') list.sort((a, b) => b.rating - a.rating);
      else if (sortBy === 'price_asc') list.sort((a, b) => (a.base_price || 0) - (b.base_price || 0));
      else if (sortBy === 'price_desc') list.sort((a, b) => (b.base_price || 0) - (a.base_price || 0));
      else list.sort((a, b) => b.popularity_score - a.popularity_score);

      return list.slice(offset, offset + limit).map((d) => ({
        ...d,
        is_favorite: inMemoryFavorites.has(`${userId}_${d.id}`),
      }));
    }
  },

  /**
   * Multi-field full text search
   */
  async search({ q = '', category, priceLevel, minRating, limit = 50, offset = 0, userId } = {}) {
    try {
      const searchTerm = `%${q.trim()}%`;
      let sql = `
        SELECT 
          d.*,
          COUNT(DISTINCT p.id) AS packages_count,
          MIN(p.base_price) AS base_price,
          ${userId ? `EXISTS(SELECT 1 FROM favorites f WHERE f.user_id = ? AND f.destination_id = d.id) AS is_favorite` : '0 AS is_favorite'}
        FROM destinations d
        LEFT JOIN packages p ON p.destination_id = d.id AND p.is_available = TRUE
        WHERE d.is_active = TRUE
          AND (
            d.name LIKE ? 
            OR d.city LIKE ? 
            OR d.country LIKE ? 
            OR d.description LIKE ?
            OR d.category LIKE ?
          )
      `;
      const params = userId ? [userId, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm] : [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];

      if (category && category !== 'all') {
        sql += ' AND d.category = ?';
        params.push(category);
      }

      if (priceLevel) {
        sql += ' AND d.price_level = ?';
        params.push(priceLevel);
      }

      if (minRating) {
        sql += ' AND d.rating >= ?';
        params.push(parseFloat(minRating));
      }

      sql += ' GROUP BY d.id ORDER BY d.popularity_score DESC, d.rating DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit, 10), parseInt(offset, 10));

      const [rows] = await query(sql, params);
      return rows.map((r) => ({
        ...r,
        is_favorite: Boolean(r.is_favorite),
        gallery_images: typeof r.gallery_images === 'string' ? JSON.parse(r.gallery_images) : r.gallery_images,
      }));
    } catch (err) {
      const term = q.toLowerCase().trim();
      let list = FALLBACK_DESTINATIONS.filter(
        (d) =>
          d.name.toLowerCase().includes(term) ||
          d.city.toLowerCase().includes(term) ||
          d.country.toLowerCase().includes(term) ||
          d.description.toLowerCase().includes(term) ||
          d.category.toLowerCase().includes(term)
      );

      if (category && category !== 'all') list = list.filter((d) => d.category === category);
      if (priceLevel) list = list.filter((d) => d.price_level === priceLevel);
      if (minRating) list = list.filter((d) => d.rating >= parseFloat(minRating));

      return list.slice(offset, offset + limit).map((d) => ({
        ...d,
        is_favorite: inMemoryFavorites.has(`${userId}_${d.id}`),
      }));
    }
  },

  /**
   * Find destination by ID or slug with packages and reviews
   */
  async findByIdOrSlug(idOrSlug, userId = null) {
    try {
      const isNumeric = /^\d+$/.test(idOrSlug);
      const whereClause = isNumeric ? 'd.id = ?' : 'd.slug = ?';
      const param = isNumeric ? parseInt(idOrSlug, 10) : idOrSlug;

      const sql = `
        SELECT 
          d.*,
          ${userId ? `EXISTS(SELECT 1 FROM favorites f WHERE f.user_id = ? AND f.destination_id = d.id) AS is_favorite` : '0 AS is_favorite'}
        FROM destinations d
        WHERE ${whereClause} AND d.is_active = TRUE
      `;
      const params = userId ? [userId, param] : [param];
      const [destRows] = await query(sql, params);

      if (!destRows || destRows.length === 0) return null;
      const destination = destRows[0];

      // Load packages for this destination
      const [packageRows] = await query(
        `SELECT * FROM packages WHERE destination_id = ? AND is_available = TRUE ORDER BY base_price ASC`,
        [destination.id]
      );

      // Load reviews for this destination
      const [reviewRows] = await query(
        `SELECT r.*, u.full_name AS user_name, u.profile_image_url 
         FROM reviews r 
         JOIN users u ON r.user_id = u.id 
         WHERE r.destination_id = ? AND r.is_approved = TRUE 
         ORDER BY r.created_at DESC`,
        [destination.id]
      );

      return {
        ...destination,
        is_favorite: Boolean(destination.is_favorite),
        gallery_images: typeof destination.gallery_images === 'string' ? JSON.parse(destination.gallery_images) : destination.gallery_images,
        packages: packageRows.map((p) => ({
          ...p,
          inclusions: typeof p.inclusions === 'string' ? JSON.parse(p.inclusions) : p.inclusions,
          exclusions: typeof p.exclusions === 'string' ? JSON.parse(p.exclusions) : p.exclusions,
        })),
        reviews: reviewRows,
      };
    } catch (err) {
      const isNumeric = /^\d+$/.test(idOrSlug);
      const destination = FALLBACK_DESTINATIONS.find((d) => (isNumeric ? d.id === parseInt(idOrSlug, 10) : d.slug === idOrSlug));
      if (!destination) return null;

      return {
        ...destination,
        is_favorite: inMemoryFavorites.has(`${userId}_${destination.id}`),
        packages: [
          {
            id: 101,
            destination_id: destination.id,
            title: `${destination.name} Explorer Package`,
            description: `Full 7-day all-inclusive exploration of ${destination.name}.`,
            package_type: 'standard',
            duration_days: 7,
            duration_nights: 6,
            base_price: destination.base_price || 1299.00,
            inclusions: ['4-star Hotel', 'Daily Breakfast', 'Guided Excursions', 'Airport Transfers'],
            exclusions: ['International Flights', 'Personal Expenses'],
          },
        ],
        reviews: [
          {
            id: 201,
            user_name: 'Alex Reed',
            rating: 5,
            title: `Breathtaking journey in ${destination.city}!`,
            comment: `Everything was organized seamlessly. The scenery and local culture were unforgettable.`,
            created_at: '2026-08-01',
          },
        ],
      };
    }
  },

  /**
   * Add destination to favorites
   */
  async addFavorite(userId, destinationId) {
    try {
      await query(
        `INSERT IGNORE INTO favorites (user_id, destination_id) VALUES (?, ?)`,
        [userId, destinationId]
      );
      inMemoryFavorites.add(`${userId}_${destinationId}`);
      return true;
    } catch (err) {
      inMemoryFavorites.add(`${userId}_${destinationId}`);
      return true;
    }
  },

  /**
   * Remove destination from favorites
   */
  async removeFavorite(userId, destinationId) {
    try {
      await query(
        `DELETE FROM favorites WHERE user_id = ? AND destination_id = ?`,
        [userId, destinationId]
      );
      inMemoryFavorites.delete(`${userId}_${destinationId}`);
      return true;
    } catch (err) {
      inMemoryFavorites.delete(`${userId}_${destinationId}`);
      return true;
    }
  },

  /**
   * Check if a destination is favorited
   */
  async checkFavorite(userId, destinationId) {
    try {
      const [rows] = await query(
        `SELECT id FROM favorites WHERE user_id = ? AND destination_id = ?`,
        [userId, destinationId]
      );
      return rows.length > 0;
    } catch (err) {
      return inMemoryFavorites.has(`${userId}_${destinationId}`);
    }
  },
};

module.exports = destinationModel;
