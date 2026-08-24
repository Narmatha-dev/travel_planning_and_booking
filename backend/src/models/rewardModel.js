const { query } = require('../config/db');

// In-memory store fallback when MySQL is offline
const FALLBACK_REWARDS = [
  {
    id: 1,
    user_id: 3,
    activity_type: 'trip_completed',
    reference_id: 'booking_1',
    points: 100,
    description: 'Completed Bali Vacation Trip',
    created_at: '2026-08-10 14:30:00',
  },
  {
    id: 2,
    user_id: 3,
    activity_type: 'review_submitted',
    reference_id: 'review_1',
    points: 25,
    description: 'Submitted Verified Review for Bali Paradise Island',
    created_at: '2026-08-11 09:15:00',
  },
  {
    id: 3,
    user_id: 3,
    activity_type: 'trip_saved',
    reference_id: 'trip_1',
    points: 10,
    description: 'Saved New Custom Itinerary: Romantic Bali Escape',
    created_at: '2026-08-12 18:00:00',
  },
];

let nextRewardId = 100;

// Level calculation helper
function calculateLevel(totalPoints) {
  const pts = parseInt(totalPoints || 0, 10);
  if (pts >= 2500) {
    return {
      tier: 'Travel Pro',
      badge: '🏆',
      currentLevel: '🏆 Travel Pro',
      minPoints: 2500,
      nextLevel: null,
      pointsToNextLevel: 0,
      progressPercentage: 100,
      perks: 'Priority customer care, VIP hotel upgrades, exclusive deals',
    };
  }
  if (pts >= 1000) {
    const nextTarget = 2500;
    const progress = Math.min(100, Math.round(((pts - 1000) / (nextTarget - 1000)) * 100));
    return {
      tier: 'Adventurer',
      badge: '🌍',
      currentLevel: '🌍 Adventurer',
      minPoints: 1000,
      nextLevel: '🏆 Travel Pro',
      pointsToNextLevel: nextTarget - pts,
      progressPercentage: progress,
      perks: 'Free room upgrade vouchers, 5% partner stay discounts',
    };
  }
  if (pts >= 500) {
    const nextTarget = 1000;
    const progress = Math.min(100, Math.round(((pts - 500) / (nextTarget - 500)) * 100));
    return {
      tier: 'Traveller',
      badge: '🧭',
      currentLevel: '🧭 Traveller',
      minPoints: 500,
      nextLevel: '🌍 Adventurer',
      pointsToNextLevel: nextTarget - pts,
      progressPercentage: progress,
      perks: 'Special seasonal discounts, verified traveller badge',
    };
  }
  // 0 - 499
  const nextTarget = 500;
  const progress = Math.min(100, Math.round((pts / nextTarget) * 100));
  return {
    tier: 'Explorer',
    badge: '🌱',
    currentLevel: '🌱 Explorer',
    minPoints: 0,
    nextLevel: '🧭 Traveller',
    pointsToNextLevel: nextTarget - pts,
    progressPercentage: progress,
    perks: 'Earn points on completed trips, reviews, and saved plans',
  };
}

const rewardModel = {
  /**
   * Add a reward transaction with duplicate prevention (Feature 4 & 14)
   */
  async addTransaction({ userId, activityType, referenceId, points, description }) {
    const numericUserId = parseInt(userId, 10);
    const numericPoints = parseInt(points, 10);
    const cleanRefId = String(referenceId || 'general');

    try {
      // 1. Duplicate check (Feature 4: Prevent duplicate rewards for same activity)
      const [existing] = await query(
        'SELECT id FROM reward_transactions WHERE user_id = ? AND activity_type = ? AND reference_id = ? LIMIT 1',
        [numericUserId, activityType, cleanRefId]
      );

      if (existing && existing.length > 0) {
        return { isNew: false, points: 0, message: 'Reward already awarded for this activity.' };
      }

      // 2. Insert transaction
      const [insertResult] = await query(
        `INSERT INTO reward_transactions (user_id, activity_type, reference_id, points, description)
         VALUES (?, ?, ?, ?, ?)`,
        [numericUserId, activityType, cleanRefId, numericPoints, description || activityType]
      );

      const newTx = {
        id: insertResult.insertId,
        user_id: numericUserId,
        activity_type: activityType,
        reference_id: cleanRefId,
        points: numericPoints,
        description: description || activityType,
        created_at: new Date().toISOString(),
      };

      return { isNew: true, points: numericPoints, transaction: newTx };
    } catch (err) {
      // Fallback in-memory store
      const duplicate = FALLBACK_REWARDS.find(
        (r) =>
          r.user_id === numericUserId &&
          r.activity_type === activityType &&
          String(r.reference_id) === cleanRefId
      );

      if (duplicate) {
        return { isNew: false, points: 0, message: 'Reward already awarded for this activity.' };
      }

      const newTx = {
        id: ++nextRewardId,
        user_id: numericUserId,
        activity_type: activityType,
        reference_id: cleanRefId,
        points: numericPoints,
        description: description || activityType,
        created_at: new Date().toISOString(),
      };
      FALLBACK_REWARDS.push(newTx);
      return { isNew: true, points: numericPoints, transaction: newTx };
    }
  },

  /**
   * Get total reward points balance & level metadata for a user (Feature 2, 8 & 9)
   */
  async getUserBalance(userId) {
    const numericUserId = parseInt(userId, 10);

    try {
      const [rows] = await query(
        'SELECT COALESCE(SUM(points), 0) AS total_points, COUNT(id) AS transactions_count FROM reward_transactions WHERE user_id = ?',
        [numericUserId]
      );

      const totalPoints = parseInt(rows?.[0]?.total_points || 0, 10);
      const transactionsCount = parseInt(rows?.[0]?.transactions_count || 0, 10);
      const levelMeta = calculateLevel(totalPoints);

      return {
        userId: numericUserId,
        totalPoints,
        transactionsCount,
        ...levelMeta,
      };
    } catch (err) {
      const userTxs = FALLBACK_REWARDS.filter((r) => r.user_id === numericUserId || (numericUserId === 3 && r.user_id === 3));
      const totalPoints = userTxs.reduce((acc, curr) => acc + (curr.points || 0), 0);
      const levelMeta = calculateLevel(totalPoints);

      return {
        userId: numericUserId,
        totalPoints,
        transactionsCount: userTxs.length,
        ...levelMeta,
      };
    }
  },

  /**
   * Get user transaction history (Feature 3)
   */
  async getUserTransactions(userId, limit = 50) {
    const numericUserId = parseInt(userId, 10);

    try {
      const [rows] = await query(
        'SELECT * FROM reward_transactions WHERE user_id = ? ORDER BY id DESC LIMIT ?',
        [numericUserId, parseInt(limit, 10)]
      );
      return rows || [];
    } catch (err) {
      return FALLBACK_REWARDS.filter((r) => r.user_id === numericUserId || (numericUserId === 3 && r.user_id === 3))
        .sort((a, b) => b.id - a.id)
        .slice(0, limit);
    }
  },

  /**
   * Get aggregated reward metrics for Admin Dashboard (Feature 11)
   */
  async getAdminStats() {
    try {
      const [aggRows] = await query(
        `SELECT 
          COALESCE(SUM(points), 0) AS total_points_awarded,
          COUNT(id) AS total_transactions,
          COUNT(DISTINCT user_id) AS active_reward_members
         FROM reward_transactions`
      );

      const totalPoints = parseInt(aggRows?.[0]?.total_points_awarded || 0, 10);
      const totalTransactions = parseInt(aggRows?.[0]?.total_transactions || 0, 10);
      const activeMembers = parseInt(aggRows?.[0]?.active_reward_members || 0, 10);

      return {
        totalPointsAwarded: totalPoints,
        totalTransactions,
        activeRewardMembers: activeMembers,
        pointRules: [
          { activity: 'Completed Trip', points: 100, icon: '🏆' },
          { activity: 'Verified Review', points: 25, icon: '⭐' },
          { activity: 'Saved Trip Plan', points: 10, icon: '🧳' },
        ],
      };
    } catch (err) {
      const totalPoints = FALLBACK_REWARDS.reduce((acc, r) => acc + (r.points || 0), 0);
      const activeMembers = new Set(FALLBACK_REWARDS.map((r) => r.user_id)).size;

      return {
        totalPointsAwarded: totalPoints,
        totalTransactions: FALLBACK_REWARDS.length,
        activeRewardMembers: activeMembers,
        pointRules: [
          { activity: 'Completed Trip', points: 100, icon: '🏆' },
          { activity: 'Verified Review', points: 25, icon: '⭐' },
          { activity: 'Saved Trip Plan', points: 10, icon: '🧳' },
        ],
      };
    }
  },
};

module.exports = rewardModel;
