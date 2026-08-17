const { query } = require('../config/db');

// Fallback packages matching database/seed.sql when MySQL is offline during local preview
let FALLBACK_PACKAGES = [
  {
    id: 1,
    destination_id: 1,
    destination_name: 'Bali Paradise Island',
    destination_country: 'Indonesia',
    destination_city: 'Bali',
    destination_category: 'beach',
    featured_image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
    title: 'Bali Tropical Bliss & Yoga Retreat',
    slug: 'bali-tropical-bliss-yoga-retreat',
    description: '7-day complete wellness, surfing, temple exploration, and rice terrace photography tour in Ubud and Seminyak.',
    package_type: 'standard',
    duration_days: 7,
    duration_nights: 6,
    base_price: 1299.00,
    discount_price: 1099.00,
    inclusions: [
      '4-star Villa Accommodation',
      'Daily Breakfast & 3 Dinners',
      'Airport Transfers',
      'Ubud Tour Guide',
      'Yoga & Sound Healing Sessions',
      'Tegallalang Jungle Swing Entry'
    ],
    exclusions: [
      'International Flights',
      'Personal Expenses & Souvenirs',
      'Travel Insurance',
      'Alcoholic Beverages'
    ],
    max_group_size: 14,
    difficulty_level: 'easy',
    is_available: 1,
    rating: 4.90,
    created_at: '2026-08-01 10:00:00'
  },
  {
    id: 2,
    destination_id: 2,
    destination_name: 'Kyoto & Tokyo Highlights',
    destination_country: 'Japan',
    destination_city: 'Tokyo',
    destination_category: 'cultural',
    featured_image_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800',
    title: 'Grand Japan Explorer: Tokyo to Kyoto',
    slug: 'grand-japan-explorer-tokyo-kyoto',
    description: '9-day bullet train journey through futuristic Tokyo, ancient Kyoto shrines, Mount Fuji views, and street food tours.',
    package_type: 'premium',
    duration_days: 9,
    duration_nights: 8,
    base_price: 2899.00,
    discount_price: 2699.00,
    inclusions: [
      '7-Day JR Bullet Train Shinkansen Pass',
      '4-star Hotel Stays in Tokyo & Kyoto',
      'Private English-speaking Guide',
      'TeamLab Planets VIP Tickets',
      'Traditional Tea Ceremony in Uji',
      'Daily Japanese Breakfast'
    ],
    exclusions: [
      'International Flights',
      'Visa Processing Fees',
      'Alcoholic Beverages',
      'Optional Onsen Spa Treatments'
    ],
    max_group_size: 10,
    difficulty_level: 'moderate',
    is_available: 1,
    rating: 4.95,
    created_at: '2026-08-02 11:00:00'
  },
  {
    id: 3,
    destination_id: 3,
    destination_name: 'Swiss Alpine Wonders',
    destination_country: 'Switzerland',
    destination_city: 'Zermatt',
    destination_category: 'mountain',
    featured_image_url: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800',
    title: 'Swiss Alps Grand Ski & Glacier Tour',
    slug: 'swiss-alps-grand-ski-glacier-tour',
    description: '6-day luxury alpine experience featuring the Glacier Express panoramic train, Zermatt Matterhorn views, and thermal spas.',
    package_type: 'luxury',
    duration_days: 6,
    duration_nights: 5,
    base_price: 3450.00,
    discount_price: 3199.00,
    inclusions: [
      '5-star Chalet Resort Stay in Zermatt',
      'First Class Glacier Express Panoramic Train',
      'Ski Lift Passes & Mountain Excursions',
      'Thermal Spa & Wellness Center Access',
      'Gourmet Swiss Fondue Dinner',
      'Private Airport Transfers'
    ],
    exclusions: [
      'Ski Gear & Clothing Rental',
      'International Flights',
      'Travel & Medical Insurance'
    ],
    max_group_size: 8,
    difficulty_level: 'moderate',
    is_available: 1,
    rating: 4.88,
    created_at: '2026-08-03 12:00:00'
  },
  {
    id: 4,
    destination_id: 4,
    destination_name: 'Parisian Elegance',
    destination_country: 'France',
    destination_city: 'Paris',
    destination_category: 'city_break',
    featured_image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
    title: 'Romantic Paris & Versailles Gourmet Getaway',
    slug: 'romantic-paris-versailles-gourmet',
    description: '5-day luxury discovery of Parisian museums, private Seine dinner cruise, Louvre VIP access, and Versailles Palace tour.',
    package_type: 'premium',
    duration_days: 5,
    duration_nights: 4,
    base_price: 1850.00,
    discount_price: 1699.00,
    inclusions: [
      'Boutique Hotel near Eiffel Tower',
      'Louvre Museum Priority Skip-the-Line Tickets',
      'Gourmet Seine Dinner Cruise with Wine',
      'Versailles Palace Guided Day Tour',
      'Daily French Bakery Breakfast'
    ],
    exclusions: [
      'Lunches & Unspecified Dinners',
      'Gratuities and Tips',
      'International Flights'
    ],
    max_group_size: 12,
    difficulty_level: 'easy',
    is_available: 1,
    rating: 4.85,
    created_at: '2026-08-04 13:00:00'
  },
  {
    id: 5,
    destination_id: 5,
    destination_name: 'Santorini Sunsets',
    destination_country: 'Greece',
    destination_city: 'Oia',
    destination_category: 'luxury',
    featured_image_url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800',
    title: 'Santorini Sunset Catamaran & Wine Trail',
    slug: 'santorini-sunset-catamaran-wine-trail',
    description: '5-day Aegean escape with a private catamaran cruise, volcanic wine tasting, and cliffside infinity pool resort.',
    package_type: 'luxury',
    duration_days: 5,
    duration_nights: 4,
    base_price: 2199.00,
    discount_price: 1999.00,
    inclusions: [
      'Cliffside Cave Suite with Private Jacuzzi',
      'Private Sunset Catamaran Cruise with BBQ & Wine',
      'Volcanic Vineyard Wine Tasting Tour',
      'Daily Champagne Breakfast Overlooking Caldera',
      'Private Chauffeur Airport Transfers'
    ],
    exclusions: [
      'International Flights',
      'Personal Shopping & Souvenirs',
      'Optional Scuba Diving Excursions'
    ],
    max_group_size: 6,
    difficulty_level: 'easy',
    is_available: 1,
    rating: 4.92,
    created_at: '2026-08-05 14:00:00'
  },
  {
    id: 6,
    destination_id: 6,
    destination_name: 'Serengeti Wildlife Safari',
    destination_country: 'Tanzania',
    destination_city: 'Serengeti',
    destination_category: 'adventure',
    featured_image_url: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800',
    title: 'Great Migration & Serengeti Hot Air Balloon Safari',
    slug: 'great-migration-serengeti-safari',
    description: '7-day exhilarating wildlife adventure with sunrise hot air balloon flight, luxury safari lodge, and Big Five game drives.',
    package_type: 'luxury',
    duration_days: 7,
    duration_nights: 6,
    base_price: 3899.00,
    discount_price: 3499.00,
    inclusions: [
      '5-star Luxury Tented Camp Accommodation',
      'Sunrise Hot Air Balloon Flight with Champagne Breakfast',
      'Daily 4x4 Custom Safari Game Drives with Expert Ranger',
      'All National Park Conservation & Entry Fees',
      'Full Board Gourmet Meals',
      'Kilimanjaro Airport Meet & Transfers'
    ],
    exclusions: [
      'International Flights',
      'Tanzania Tourist Visa',
      'Ranger & Driver Gratuities'
    ],
    max_group_size: 6,
    difficulty_level: 'moderate',
    is_available: 1,
    rating: 4.96,
    created_at: '2026-08-06 15:00:00'
  }
];

let nextPackageId = 10;

/**
 * Normalizes package inclusion/exclusion JSON data
 */
function normalizePackage(pkg) {
  if (!pkg) return null;
  return {
    ...pkg,
    base_price: parseFloat(pkg.base_price),
    discount_price: pkg.discount_price ? parseFloat(pkg.discount_price) : null,
    is_available: Boolean(pkg.is_available),
    inclusions: typeof pkg.inclusions === 'string' ? JSON.parse(pkg.inclusions) : (pkg.inclusions || []),
    exclusions: typeof pkg.exclusions === 'string' ? JSON.parse(pkg.exclusions) : (pkg.exclusions || []),
  };
}

const packageModel = {
  /**
   * Find all packages with search, filters, sorting, and pagination
   */
  async findAll({
    destinationId,
    packageType,
    difficultyLevel,
    minPrice,
    maxPrice,
    search,
    isAvailable,
    sortBy = 'price_asc',
    limit = 50,
    offset = 0,
  } = {}) {
    try {
      let sql = `
        SELECT 
          p.*,
          d.name AS destination_name,
          d.country AS destination_country,
          d.city AS destination_city,
          d.category AS destination_category,
          d.featured_image_url,
          d.rating AS destination_rating
        FROM packages p
        JOIN destinations d ON p.destination_id = d.id
        WHERE 1=1
      `;
      const params = [];

      if (isAvailable !== undefined && isAvailable !== null && isAvailable !== '') {
        sql += ' AND p.is_available = ?';
        params.push(isAvailable === 'true' || isAvailable === true || isAvailable === 1 ? 1 : 0);
      }

      if (destinationId) {
        sql += ' AND p.destination_id = ?';
        params.push(parseInt(destinationId, 10));
      }

      if (packageType && packageType !== 'all') {
        sql += ' AND p.package_type = ?';
        params.push(packageType);
      }

      if (difficultyLevel && difficultyLevel !== 'all') {
        sql += ' AND p.difficulty_level = ?';
        params.push(difficultyLevel);
      }

      if (minPrice) {
        sql += ' AND COALESCE(p.discount_price, p.base_price) >= ?';
        params.push(parseFloat(minPrice));
      }

      if (maxPrice) {
        sql += ' AND COALESCE(p.discount_price, p.base_price) <= ?';
        params.push(parseFloat(maxPrice));
      }

      if (search && search.trim()) {
        sql += ' AND (p.title LIKE ? OR p.description LIKE ? OR d.name LIKE ? OR d.country LIKE ? OR d.city LIKE ?)';
        const searchPattern = `%${search.trim()}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      }

      // Sorting
      if (sortBy === 'price_asc') {
        sql += ' ORDER BY COALESCE(p.discount_price, p.base_price) ASC';
      } else if (sortBy === 'price_desc') {
        sql += ' ORDER BY COALESCE(p.discount_price, p.base_price) DESC';
      } else if (sortBy === 'duration_asc') {
        sql += ' ORDER BY p.duration_days ASC';
      } else if (sortBy === 'duration_desc') {
        sql += ' ORDER BY p.duration_days DESC';
      } else if (sortBy === 'newest') {
        sql += ' ORDER BY p.created_at DESC';
      } else {
        sql += ' ORDER BY p.is_available DESC, COALESCE(p.discount_price, p.base_price) ASC';
      }

      sql += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit, 10), parseInt(offset, 10));

      const [rows] = await query(sql, params);
      return rows.map(normalizePackage);
    } catch (err) {
      // In-memory fallback
      let list = [...FALLBACK_PACKAGES];

      if (isAvailable !== undefined && isAvailable !== null && isAvailable !== '') {
        const check = isAvailable === 'true' || isAvailable === true || isAvailable === 1;
        list = list.filter((p) => Boolean(p.is_available) === check);
      }

      if (destinationId) {
        list = list.filter((p) => p.destination_id === parseInt(destinationId, 10));
      }

      if (packageType && packageType !== 'all') {
        list = list.filter((p) => p.package_type.toLowerCase() === packageType.toLowerCase());
      }

      if (difficultyLevel && difficultyLevel !== 'all') {
        list = list.filter((p) => p.difficulty_level.toLowerCase() === difficultyLevel.toLowerCase());
      }

      if (minPrice) {
        list = list.filter((p) => (p.discount_price || p.base_price) >= parseFloat(minPrice));
      }

      if (maxPrice) {
        list = list.filter((p) => (p.discount_price || p.base_price) <= parseFloat(maxPrice));
      }

      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter((p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.destination_name.toLowerCase().includes(q) ||
          p.destination_country.toLowerCase().includes(q)
        );
      }

      // Sort
      if (sortBy === 'price_asc') {
        list.sort((a, b) => (a.discount_price || a.base_price) - (b.discount_price || b.base_price));
      } else if (sortBy === 'price_desc') {
        list.sort((a, b) => (b.discount_price || b.base_price) - (a.discount_price || a.base_price));
      } else if (sortBy === 'duration_asc') {
        list.sort((a, b) => a.duration_days - b.duration_days);
      } else if (sortBy === 'duration_desc') {
        list.sort((a, b) => b.duration_days - a.duration_days);
      }

      return list.slice(offset, offset + limit).map(normalizePackage);
    }
  },

  /**
   * Find package by numeric ID or URL slug
   */
  async findByIdOrSlug(idOrSlug) {
    const isNumeric = /^\d+$/.test(idOrSlug);
    try {
      let sql = `
        SELECT 
          p.*,
          d.name AS destination_name,
          d.country AS destination_country,
          d.city AS destination_city,
          d.category AS destination_category,
          d.featured_image_url,
          d.gallery_images AS destination_gallery,
          d.rating AS destination_rating,
          d.climate,
          d.best_time_to_visit
        FROM packages p
        JOIN destinations d ON p.destination_id = d.id
        WHERE 
      `;
      sql += isNumeric ? 'p.id = ?' : 'p.slug = ?';

      const [rows] = await query(sql, [isNumeric ? parseInt(idOrSlug, 10) : idOrSlug]);
      if (rows && rows.length > 0) {
        const pkg = rows[0];
        return {
          ...normalizePackage(pkg),
          destination_gallery: typeof pkg.destination_gallery === 'string' ? JSON.parse(pkg.destination_gallery) : pkg.destination_gallery,
        };
      }
      return null;
    } catch (err) {
      const match = FALLBACK_PACKAGES.find((p) =>
        isNumeric ? p.id === parseInt(idOrSlug, 10) : p.slug === idOrSlug
      );
      return match ? normalizePackage(match) : null;
    }
  },

  /**
   * Get top featured packages
   */
  async getFeatured(limit = 4) {
    return this.findAll({ isAvailable: true, limit });
  },

  /**
   * Create a new package
   */
  async create(packageData) {
    const {
      destinationId,
      title,
      slug,
      description,
      packageType = 'standard',
      durationDays,
      durationNights,
      basePrice,
      discountPrice,
      inclusions = [],
      exclusions = [],
      maxGroupSize = 12,
      difficultyLevel = 'easy',
      isAvailable = true,
    } = packageData;

    const generatedSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const inclusionsJson = JSON.stringify(inclusions);
    const exclusionsJson = JSON.stringify(exclusions);

    try {
      const [result] = await query(
        `INSERT INTO packages (
          destination_id, title, slug, description, package_type,
          duration_days, duration_nights, base_price, discount_price,
          inclusions, exclusions, max_group_size, difficulty_level, is_available
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          destinationId,
          title,
          generatedSlug,
          description,
          packageType,
          durationDays,
          durationNights || Math.max(1, durationDays - 1),
          basePrice,
          discountPrice || null,
          inclusionsJson,
          exclusionsJson,
          maxGroupSize,
          difficultyLevel,
          isAvailable ? 1 : 0,
        ]
      );

      return this.findByIdOrSlug(result.insertId);
    } catch (err) {
      const newPkg = {
        id: ++nextPackageId,
        destination_id: parseInt(destinationId, 10),
        destination_name: 'Custom Destination',
        destination_country: 'Global',
        destination_city: 'Travel Hub',
        destination_category: 'adventure',
        featured_image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
        title,
        slug: generatedSlug,
        description,
        package_type: packageType,
        duration_days: parseInt(durationDays, 10),
        duration_nights: parseInt(durationNights || Math.max(1, durationDays - 1), 10),
        base_price: parseFloat(basePrice),
        discount_price: discountPrice ? parseFloat(discountPrice) : null,
        inclusions,
        exclusions,
        max_group_size: parseInt(maxGroupSize, 10),
        difficulty_level: difficultyLevel,
        is_available: isAvailable ? 1 : 0,
        rating: 5.0,
        created_at: new Date().toISOString(),
      };
      FALLBACK_PACKAGES.push(newPkg);
      return normalizePackage(newPkg);
    }
  },

  /**
   * Update existing package
   */
  async update(id, packageData) {
    const pkgId = parseInt(id, 10);
    const {
      destinationId,
      title,
      slug,
      description,
      packageType,
      durationDays,
      durationNights,
      basePrice,
      discountPrice,
      inclusions,
      exclusions,
      maxGroupSize,
      difficultyLevel,
      isAvailable,
    } = packageData;

    try {
      const updates = [];
      const params = [];

      if (destinationId !== undefined) { updates.push('destination_id = ?'); params.push(destinationId); }
      if (title !== undefined) { updates.push('title = ?'); params.push(title); }
      if (slug !== undefined) { updates.push('slug = ?'); params.push(slug); }
      if (description !== undefined) { updates.push('description = ?'); params.push(description); }
      if (packageType !== undefined) { updates.push('package_type = ?'); params.push(packageType); }
      if (durationDays !== undefined) { updates.push('duration_days = ?'); params.push(durationDays); }
      if (durationNights !== undefined) { updates.push('duration_nights = ?'); params.push(durationNights); }
      if (basePrice !== undefined) { updates.push('base_price = ?'); params.push(basePrice); }
      if (discountPrice !== undefined) { updates.push('discount_price = ?'); params.push(discountPrice); }
      if (inclusions !== undefined) { updates.push('inclusions = ?'); params.push(JSON.stringify(inclusions)); }
      if (exclusions !== undefined) { updates.push('exclusions = ?'); params.push(JSON.stringify(exclusions)); }
      if (maxGroupSize !== undefined) { updates.push('max_group_size = ?'); params.push(maxGroupSize); }
      if (difficultyLevel !== undefined) { updates.push('difficulty_level = ?'); params.push(difficultyLevel); }
      if (isAvailable !== undefined) { updates.push('is_available = ?'); params.push(isAvailable ? 1 : 0); }

      if (updates.length > 0) {
        params.push(pkgId);
        await query(`UPDATE packages SET ${updates.join(', ')} WHERE id = ?`, params);
      }

      return this.findByIdOrSlug(pkgId);
    } catch (err) {
      const idx = FALLBACK_PACKAGES.findIndex((p) => p.id === pkgId);
      if (idx !== -1) {
        FALLBACK_PACKAGES[idx] = {
          ...FALLBACK_PACKAGES[idx],
          ...packageData,
          base_price: packageData.basePrice !== undefined ? parseFloat(packageData.basePrice) : FALLBACK_PACKAGES[idx].base_price,
          discount_price: packageData.discountPrice !== undefined ? parseFloat(packageData.discountPrice) : FALLBACK_PACKAGES[idx].discount_price,
          duration_days: packageData.durationDays !== undefined ? parseInt(packageData.durationDays, 10) : FALLBACK_PACKAGES[idx].duration_days,
          is_available: packageData.isAvailable !== undefined ? (packageData.isAvailable ? 1 : 0) : FALLBACK_PACKAGES[idx].is_available,
        };
        return normalizePackage(FALLBACK_PACKAGES[idx]);
      }
      return null;
    }
  },

  /**
   * Toggle or update package availability
   */
  async updateAvailability(id, isAvailable) {
    const pkgId = parseInt(id, 10);
    const availableVal = isAvailable ? 1 : 0;
    try {
      await query('UPDATE packages SET is_available = ? WHERE id = ?', [availableVal, pkgId]);
      return this.findByIdOrSlug(pkgId);
    } catch (err) {
      const pkg = FALLBACK_PACKAGES.find((p) => p.id === pkgId);
      if (pkg) {
        pkg.is_available = availableVal;
        return normalizePackage(pkg);
      }
      return null;
    }
  },

  /**
   * Delete package
   */
  async delete(id) {
    const pkgId = parseInt(id, 10);
    try {
      const [result] = await query('DELETE FROM packages WHERE id = ?', [pkgId]);
      return result.affectedRows > 0;
    } catch (err) {
      const initLen = FALLBACK_PACKAGES.length;
      FALLBACK_PACKAGES = FALLBACK_PACKAGES.filter((p) => p.id !== pkgId);
      return FALLBACK_PACKAGES.length < initLen;
    }
  }
};

module.exports = packageModel;
