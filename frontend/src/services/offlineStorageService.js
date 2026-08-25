/**
 * Phase 29: Offline Storage Service (IndexedDB + Sync Queue)
 */
import api from './api';

const DB_NAME = 'travelora_offline_db';
const DB_VERSION = 1;
const STORE_TRIPS = 'offline_trips';
const STORE_QUEUE = 'sync_queue';

let dbInstance = null;

function openDatabase() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_TRIPS)) {
        const tripStore = db.createObjectStore(STORE_TRIPS, { keyPath: 'id' });
        tripStore.createIndex('userId', 'userId', { unique: false });
        tripStore.createIndex('destination', 'destination', { unique: false });
        tripStore.createIndex('savedAt', 'savedAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        const queueStore = db.createObjectStore(STORE_QUEUE, { keyPath: 'id', autoIncrement: true });
        queueStore.createIndex('tripId', 'tripId', { unique: false });
        queueStore.createIndex('userId', 'userId', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject(new Error(`IndexedDB Error: ${event.target.error?.message || 'Failed to open'}`));
    };
  });
}

function calculateSizeKb(obj) {
  try {
    const str = JSON.stringify(obj);
    return Math.max(1, Math.round((new Blob([str]).size / 1024) * 10) / 10);
  } catch {
    return 10;
  }
}

const offlineStorageService = {
  /**
   * Save a complete trip bundle for offline access
   */
  async saveTripForOffline(tripBundle) {
    const db = await openDatabase();
    const cleanId = parseInt(tripBundle.id || tripBundle.tripId || 1, 10);

    const record = {
      ...tripBundle,
      id: cleanId,
      userId: parseInt(tripBundle.userId || 3, 10),
      savedAt: new Date().toISOString(),
      syncStatus: 'synced',
      estimatedSizeKb: calculateSizeKb(tripBundle),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_TRIPS], 'readwrite');
      const store = tx.objectStore(STORE_TRIPS);
      const req = store.put(record);

      req.onsuccess = () => resolve(record);
      req.onerror = (e) => reject(e.target.error);
    });
  },

  /**
   * Get all offline cached trips for a user
   */
  async getOfflineTrips(userId = 3) {
    try {
      const db = await openDatabase();
      const uId = parseInt(userId, 10);

      return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_TRIPS], 'readonly');
        const store = tx.objectStore(STORE_TRIPS);
        const req = store.getAll();

        req.onsuccess = () => {
          const all = req.result || [];
          const userTrips = all.filter((t) => !t.userId || t.userId === uId);
          resolve(userTrips);
        };
        req.onerror = (e) => reject(e.target.error);
      });
    } catch {
      return [];
    }
  },

  /**
   * Get a single offline trip by ID
   */
  async getOfflineTripById(tripId, userId = 3) {
    try {
      const db = await openDatabase();
      const tId = parseInt(tripId, 10);
      const uId = parseInt(userId, 10);

      return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_TRIPS], 'readonly');
        const store = tx.objectStore(STORE_TRIPS);
        const req = store.get(tId);

        req.onsuccess = () => {
          const trip = req.result;
          if (trip && (!trip.userId || trip.userId === uId)) {
            resolve(trip);
          } else {
            resolve(null);
          }
        };
        req.onerror = (e) => reject(e.target.error);
      });
    } catch {
      return null;
    }
  },

  /**
   * Remove a trip from offline cache (does not delete server trip)
   */
  async removeOfflineTrip(tripId, userId = 3) {
    const db = await openDatabase();
    const tId = parseInt(tripId, 10);

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_TRIPS, STORE_QUEUE], 'readwrite');
      const tripStore = tx.objectStore(STORE_TRIPS);
      tripStore.delete(tId);

      // Clean queue for this trip
      const queueStore = tx.objectStore(STORE_QUEUE);
      const queueReq = queueStore.openCursor();
      queueReq.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          if (cursor.value.tripId === tId) {
            cursor.delete();
          }
          cursor.continue();
        }
      };

      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => reject(e.target.error);
    });
  },

  /**
   * Update packing item in offline cache and queue sync action
   */
  async updateOfflinePackingItem(tripId, itemId, isPacked, userId = 3) {
    const db = await openDatabase();
    const tId = parseInt(tripId, 10);
    const uId = parseInt(userId, 10);

    const trip = await this.getOfflineTripById(tId, uId);
    if (!trip) throw new Error('Offline trip not found');

    // Update item in local array
    if (Array.isArray(trip.packingChecklist)) {
      const target = trip.packingChecklist.find((i) => i.id === itemId || i.item_name === itemId);
      if (target) {
        target.is_packed = isPacked;
      }
    }
    trip.syncStatus = 'pending_sync';

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_TRIPS, STORE_QUEUE], 'readwrite');
      tx.objectStore(STORE_TRIPS).put(trip);
      tx.objectStore(STORE_QUEUE).add({
        tripId: tId,
        userId: uId,
        type: 'packing_toggle',
        itemId,
        isPacked,
        timestamp: new Date().toISOString(),
      });

      tx.oncomplete = () => resolve(trip);
      tx.onerror = (e) => reject(e.target.error);
    });
  },

  /**
   * Update checklist item in offline cache and queue sync action
   */
  async updateOfflineChecklistItem(tripId, itemId, isCompleted, userId = 3) {
    const db = await openDatabase();
    const tId = parseInt(tripId, 10);
    const uId = parseInt(userId, 10);

    const trip = await this.getOfflineTripById(tId, uId);
    if (!trip) throw new Error('Offline trip not found');

    if (Array.isArray(trip.travelChecklist)) {
      const target = trip.travelChecklist.find((i) => i.id === itemId || i.item_name === itemId);
      if (target) {
        target.is_completed = isCompleted;
      }
    }
    trip.syncStatus = 'pending_sync';

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_TRIPS, STORE_QUEUE], 'readwrite');
      tx.objectStore(STORE_TRIPS).put(trip);
      tx.objectStore(STORE_QUEUE).add({
        tripId: tId,
        userId: uId,
        type: 'checklist_toggle',
        itemId,
        isCompleted,
        timestamp: new Date().toISOString(),
      });

      tx.oncomplete = () => resolve(trip);
      tx.onerror = (e) => reject(e.target.error);
    });
  },

  /**
   * Synchronize queued offline changes to backend when connection is restored
   */
  async syncPendingChanges(userId = 3) {
    if (typeof window !== 'undefined' && !window.navigator.onLine) {
      return { synced: false, reason: 'offline' };
    }

    try {
      const db = await openDatabase();
      const uId = parseInt(userId, 10);

      // Fetch all queued items for this user
      const queueItems = await new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_QUEUE], 'readonly');
        const store = tx.objectStore(STORE_QUEUE);
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result || []).filter((q) => q.userId === uId));
        req.onerror = (e) => reject(e.target.error);
      });

      if (queueItems.length === 0) {
        return { synced: true, count: 0 };
      }

      // Group by tripId
      const tripsMap = {};
      queueItems.forEach((q) => {
        if (!tripsMap[q.tripId]) {
          tripsMap[q.tripId] = {
            packingUpdates: [],
            checklistUpdates: [],
          };
        }
        if (q.type === 'packing_toggle') {
          tripsMap[q.tripId].packingUpdates.push({ id: q.itemId, isPacked: q.isPacked });
        } else if (q.type === 'checklist_toggle') {
          tripsMap[q.tripId].checklistUpdates.push({ id: q.itemId, isCompleted: q.isCompleted });
        }
      });

      // Send sync requests to backend
      for (const [tripId, payload] of Object.entries(tripsMap)) {
        await api.post(`/offline/trip/${tripId}/sync`, payload);

        // Update trip status in IndexedDB
        const trip = await this.getOfflineTripById(tripId, uId);
        if (trip) {
          trip.syncStatus = 'synced';
          const tx = db.transaction([STORE_TRIPS], 'readwrite');
          tx.objectStore(STORE_TRIPS).put(trip);
        }
      }

      // Clear sync queue
      await new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_QUEUE], 'readwrite');
        tx.objectStore(STORE_QUEUE).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
      });

      return { synced: true, count: queueItems.length };
    } catch (err) {
      console.warn('[OfflineStorageService] Sync failed:', err.message);
      return { synced: false, error: err.message };
    }
  },

  /**
   * Get total storage stats (count of trips, estimated KB size, pending queue)
   */
  async getStorageStats(userId = 3) {
    try {
      const trips = await this.getOfflineTrips(userId);
      const totalSizeKb = trips.reduce((acc, t) => acc + (t.estimatedSizeKb || 5), 0);
      const pendingSyncCount = trips.filter((t) => t.syncStatus === 'pending_sync').length;

      return {
        tripCount: trips.length,
        totalSizeKb: Math.round(totalSizeKb * 10) / 10,
        pendingSyncCount,
      };
    } catch {
      return { tripCount: 0, totalSizeKb: 0, pendingSyncCount: 0 };
    }
  },
};

export default offlineStorageService;
