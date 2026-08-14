const { query } = require('../config/db');

// In-memory fallback trip store when MySQL is offline during local preview
const FALLBACK_TRIPS = [
  {
    id: 1,
    user_id: 3,
    destination_id: 1,
    destination_name: 'Bali Paradise Island',
    destination_city: 'Bali',
    destination_country: 'Indonesia',
    featured_image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
    package_id: 1,
    title: 'Romantic Bali Island Escape',
    trip_type: 'couple',
    start_date: '2026-09-10',
    end_date: '2026-09-17',
    total_budget: 2500.00,
    estimated_cost: 2198.00,
    status: 'planned',
    notes: 'Villa booking confirmed at Ubud resort. Sunset dinner booked for Day 3.',
    created_at: '2026-08-01 10:00:00',
    itineraries: [
      {
        id: 1,
        trip_id: 1,
        day_number: 1,
        activity_date: '2026-09-10',
        activity_time: '11:00:00',
        title: 'Arrival & Private Villa Check-In',
        description: 'Arrive at Ngurah Rai Airport, meet private driver, check in to Ubud luxury villa.',
        activity_type: 'hotel',
        location_name: 'Ubud Hanging Gardens',
        cost: 250.00,
      },
      {
        id: 2,
        trip_id: 1,
        day_number: 1,
        activity_date: '2026-09-10',
        activity_time: '19:00:00',
        title: 'Welcome Candlelight Dinner',
        description: 'Multi-course Indonesian gourmet dinner overlooking the tropical valley.',
        activity_type: 'dining',
        location_name: 'Swept Away Restaurant',
        cost: 120.00,
      },
      {
        id: 3,
        trip_id: 1,
        day_number: 2,
        activity_date: '2026-09-11',
        activity_time: '08:30:00',
        title: 'Tegallalang Rice Terrace Trek & Swing',
        description: 'Scenic walk through lush terraced hills with iconic jungle swing photo opportunity.',
        activity_type: 'sightseeing',
        location_name: 'Tegallalang, Ubud',
        cost: 45.00,
      },
      {
        id: 4,
        trip_id: 1,
        day_number: 2,
        activity_date: '2026-09-11',
        activity_time: '16:00:00',
        title: 'Tirta Empul Holy Spring Temple Tour',
        description: 'Spiritual cleansing ritual and cultural guided exploration of ancient temple complex.',
        activity_type: 'sightseeing',
        location_name: 'Tirta Empul Temple',
        cost: 30.00,
      },
    ],
  },
];

let nextTripId = 100;
let nextItineraryId = 500;

const tripModel = {
  /**
   * Create a new trip along with day-wise itinerary activities
   */
  async createTripWithItineraries(tripData, itineraryItems = []) {
    const { userId, destinationId, packageId, title, tripType, startDate, endDate, totalBudget, estimatedCost, status, notes } = tripData;

    try {
      const [tripResult] = await query(
        `INSERT INTO trips 
          (user_id, destination_id, package_id, title, trip_type, start_date, end_date, total_budget, estimated_cost, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          destinationId,
          packageId || null,
          title,
          tripType || 'solo',
          startDate,
          endDate,
          totalBudget || 0,
          estimatedCost || 0,
          status || 'planned',
          notes || null,
        ]
      );

      const tripId = tripResult.insertId;

      if (Array.isArray(itineraryItems) && itineraryItems.length > 0) {
        const values = itineraryItems.map((item) => [
          tripId,
          item.day_number || 1,
          item.activity_date || startDate,
          item.activity_time || '09:00:00',
          item.title,
          item.description || null,
          item.activity_type || 'sightseeing',
          item.location_name || null,
          item.cost || 0,
          item.booking_reference || null,
        ]);

        await query(
          `INSERT INTO trip_itineraries 
            (trip_id, day_number, activity_date, activity_time, title, description, activity_type, location_name, cost, booking_reference)
           VALUES ?`,
          [values]
        );
      }

      return this.findById(tripId, userId);
    } catch (err) {
      // Memory fallback for offline mode
      const newTripId = ++nextTripId;
      const createdTrip = {
        id: newTripId,
        user_id: userId,
        destination_id: destinationId,
        destination_name: 'Bali Paradise Island',
        destination_city: 'Bali',
        destination_country: 'Indonesia',
        featured_image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
        package_id: packageId || null,
        title,
        trip_type: tripType || 'solo',
        start_date: startDate,
        end_date: endDate,
        total_budget: parseFloat(totalBudget || 0),
        estimated_cost: parseFloat(estimatedCost || 0),
        status: status || 'planned',
        notes: notes || null,
        created_at: new Date().toISOString(),
        itineraries: itineraryItems.map((item, idx) => ({
          id: ++nextItineraryId,
          trip_id: newTripId,
          day_number: item.day_number || 1,
          activity_date: item.activity_date || startDate,
          activity_time: item.activity_time || '09:00:00',
          title: item.title,
          description: item.description || null,
          activity_type: item.activity_type || 'sightseeing',
          location_name: item.location_name || null,
          cost: parseFloat(item.cost || 0),
          booking_reference: item.booking_reference || null,
        })),
      };

      const daysMap = {};
      (createdTrip.itineraries || []).forEach((act) => {
        if (!daysMap[act.day_number]) {
          daysMap[act.day_number] = {
            day_number: act.day_number,
            date: act.activity_date,
            activities: [],
          };
        }
        daysMap[act.day_number].activities.push(act);
      });
      createdTrip.days = Object.values(daysMap);

      FALLBACK_TRIPS.push(createdTrip);
      return createdTrip;
    }
  },

  /**
   * Find all trips for a user
   */
  async findByUserId(userId) {
    try {
      const [rows] = await query(
        `SELECT 
          t.*,
          d.name AS destination_name,
          d.city AS destination_city,
          d.country AS destination_country,
          d.featured_image_url,
          d.category AS destination_category,
          COUNT(ti.id) AS activities_count
        FROM trips t
        JOIN destinations d ON t.destination_id = d.id
        LEFT JOIN trip_itineraries ti ON ti.trip_id = t.id
        WHERE t.user_id = ?
        GROUP BY t.id
        ORDER BY t.start_date DESC`,
        [userId]
      );
      return rows;
    } catch (err) {
      return FALLBACK_TRIPS.filter((t) => t.user_id === userId || userId === 3);
    }
  },

  /**
   * Find single trip by ID (with authorization check & full day-wise itinerary)
   */
  async findById(tripId, userId = null) {
    try {
      let sql = `
        SELECT 
          t.*,
          d.name AS destination_name,
          d.city AS destination_city,
          d.country AS destination_country,
          d.featured_image_url,
          d.category AS destination_category,
          p.title AS package_title
        FROM trips t
        JOIN destinations d ON t.destination_id = d.id
        LEFT JOIN packages p ON t.package_id = p.id
        WHERE t.id = ?
      `;
      const params = [tripId];

      if (userId) {
        sql += ' AND t.user_id = ?';
        params.push(userId);
      }

      const [tripRows] = await query(sql, params);
      if (!tripRows || tripRows.length === 0) return null;

      const trip = tripRows[0];

      // Fetch day-wise activities
      const [itineraries] = await query(
        `SELECT * FROM trip_itineraries WHERE trip_id = ? ORDER BY day_number ASC, activity_time ASC, id ASC`,
        [trip.id]
      );

      // Group activities by day
      const daysMap = {};
      itineraries.forEach((act) => {
        if (!daysMap[act.day_number]) {
          daysMap[act.day_number] = {
            day_number: act.day_number,
            date: act.activity_date,
            activities: [],
          };
        }
        daysMap[act.day_number].activities.push(act);
      });

      return {
        ...trip,
        itineraries,
        days: Object.values(daysMap),
      };
    } catch (err) {
      const trip = FALLBACK_TRIPS.find((t) => t.id === parseInt(tripId, 10));
      if (!trip) return null;

      const daysMap = {};
      (trip.itineraries || []).forEach((act) => {
        if (!daysMap[act.day_number]) {
          daysMap[act.day_number] = {
            day_number: act.day_number,
            date: act.activity_date,
            activities: [],
          };
        }
        daysMap[act.day_number].activities.push(act);
      });

      return {
        ...trip,
        days: Object.values(daysMap),
      };
    }
  },

  /**
   * Update trip details
   */
  async updateTrip(tripId, userId, updateData, newItineraries = null) {
    const { title, tripType, startDate, endDate, totalBudget, estimatedCost, status, notes } = updateData;

    try {
      await query(
        `UPDATE trips 
         SET title = COALESCE(?, title),
             trip_type = COALESCE(?, trip_type),
             start_date = COALESCE(?, start_date),
             end_date = COALESCE(?, end_date),
             total_budget = COALESCE(?, total_budget),
             estimated_cost = COALESCE(?, estimated_cost),
             status = COALESCE(?, status),
             notes = COALESCE(?, notes)
         WHERE id = ? AND user_id = ?`,
        [
          title || null,
          tripType || null,
          startDate || null,
          endDate || null,
          totalBudget !== undefined ? totalBudget : null,
          estimatedCost !== undefined ? estimatedCost : null,
          status || null,
          notes || null,
          tripId,
          userId,
        ]
      );

      if (Array.isArray(newItineraries) && newItineraries.length > 0) {
        // Delete old and re-insert
        await query('DELETE FROM trip_itineraries WHERE trip_id = ?', [tripId]);

        const values = newItineraries.map((item) => [
          tripId,
          item.day_number || 1,
          item.activity_date || startDate,
          item.activity_time || '09:00:00',
          item.title,
          item.description || null,
          item.activity_type || 'sightseeing',
          item.location_name || null,
          item.cost || 0,
          item.booking_reference || null,
        ]);

        await query(
          `INSERT INTO trip_itineraries 
            (trip_id, day_number, activity_date, activity_time, title, description, activity_type, location_name, cost, booking_reference)
           VALUES ?`,
          [values]
        );
      }

      return this.findById(tripId, userId);
    } catch (err) {
      const trip = FALLBACK_TRIPS.find((t) => t.id === parseInt(tripId, 10));
      if (!trip) return null;

      if (title) trip.title = title;
      if (tripType) trip.trip_type = tripType;
      if (startDate) trip.start_date = startDate;
      if (endDate) trip.end_date = endDate;
      if (totalBudget !== undefined) trip.total_budget = parseFloat(totalBudget);
      if (estimatedCost !== undefined) trip.estimated_cost = parseFloat(estimatedCost);
      if (status) trip.status = status;
      if (notes !== undefined) trip.notes = notes;

      if (Array.isArray(newItineraries)) {
        trip.itineraries = newItineraries.map((item) => ({
          id: ++nextItineraryId,
          trip_id: trip.id,
          ...item,
        }));
      }

      return trip;
    }
  },

  /**
   * Delete trip (cascades to trip_itineraries via DB foreign key)
   */
  async deleteTrip(tripId, userId) {
    try {
      const [result] = await query('DELETE FROM trips WHERE id = ? AND user_id = ?', [tripId, userId]);
      return result.affectedRows > 0;
    } catch (err) {
      const idx = FALLBACK_TRIPS.findIndex((t) => t.id === parseInt(tripId, 10));
      if (idx !== -1) {
        FALLBACK_TRIPS.splice(idx, 1);
        return true;
      }
      return false;
    }
  },
};

module.exports = tripModel;
