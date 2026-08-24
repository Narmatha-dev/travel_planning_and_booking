const favoriteModel = require('../models/favoriteModel');

const favoriteService = {
  /**
   * Add a destination, place, hotel, or trip to user's favorites
   */
  async addFavorite(userId, payload = {}) {
    if (!userId) {
      const error = new Error('Authentication required to save favorites');
      error.statusCode = 401;
      throw error;
    }

    const itemType = payload.itemType || (payload.destinationId ? 'destination' : (payload.packageId ? 'package' : 'destination'));
    const itemId = payload.itemId || payload.destinationId || payload.packageId || payload.id;

    if (!itemId) {
      const error = new Error('Item ID is required to save favorite');
      error.statusCode = 400;
      throw error;
    }

    const result = await favoriteModel.addFavorite(userId, {
      itemType,
      itemId,
      itemData: payload.itemData || payload,
      destinationId: payload.destinationId,
      packageId: payload.packageId,
    });

    return {
      ...result,
      message: result.isNew ? 'Added to your favorites.' : 'Already in your favorites.',
    };
  },

  /**
   * Remove item from favorites
   */
  async removeFavorite(userId, params = {}) {
    if (!userId) {
      const error = new Error('Authentication required');
      error.statusCode = 401;
      throw error;
    }

    const result = await favoriteModel.removeFavorite(userId, params);
    return {
      success: true,
      message: 'Removed from favorites.',
      removed: result.removed,
    };
  },

  /**
   * Toggle favorite status (Add if absent, Remove if present)
   */
  async toggleFavorite(userId, payload = {}) {
    if (!userId) {
      const error = new Error('Please login to save favorites.');
      error.statusCode = 401;
      throw error;
    }

    const itemType = payload.itemType || (payload.destinationId ? 'destination' : 'destination');
    const itemId = payload.itemId || payload.destinationId || payload.id;

    if (!itemId) {
      const error = new Error('Item ID is required');
      error.statusCode = 400;
      throw error;
    }

    const isFav = await favoriteModel.isFavorited(userId, itemType, itemId);

    if (isFav) {
      await favoriteModel.removeFavorite(userId, { itemType, itemId, destinationId: payload.destinationId });
      return {
        isFavorite: false,
        message: 'Removed from favorites.',
      };
    } else {
      const added = await favoriteModel.addFavorite(userId, {
        itemType,
        itemId,
        itemData: payload.itemData || payload,
        destinationId: payload.destinationId,
      });
      return {
        isFavorite: true,
        item: added,
        message: 'Added to your favorites.',
      };
    }
  },

  /**
   * Retrieve all favorites for the authenticated user
   */
  async getUserFavorites(userId, query = {}) {
    if (!userId) {
      const error = new Error('Authentication required to view favorites');
      error.statusCode = 401;
      throw error;
    }

    const { category = 'all', search = '' } = query;
    const favorites = await favoriteModel.findUserFavorites(userId, { category, search });
    const summary = await favoriteModel.getFavoritesSummary(userId);

    return {
      favorites,
      summary,
      totalCount: favorites.length,
    };
  },

  /**
   * Check if a specific item is favorited
   */
  async checkFavoriteStatus(userId, itemType, itemId) {
    if (!userId) return { isFavorite: false };
    const isFavorite = await favoriteModel.isFavorited(userId, itemType, itemId);
    return { isFavorite };
  },

  /**
   * Get user favorites categories summary
   */
  async getFavoritesSummary(userId) {
    if (!userId) return { total: 0, places: 0, hotels: 0, trips: 0 };
    return favoriteModel.getFavoritesSummary(userId);
  },
};

module.exports = favoriteService;
