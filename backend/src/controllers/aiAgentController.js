const aiAgentService = require('../services/aiAgentService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const aiAgentController = {
  /**
   * POST /api/ai-agent
   * Process traveler requirements and generate/modify personalized travel plan
   */
  processTravelerQuery: asyncHandler(async (req, res) => {
    const sessionId = req.body.sessionId || req.user?.id?.toString() || 'traveler_agent_session';
    const message = req.body.message || req.body.prompt || req.body.query || '';
    const context = req.body.context || {};
    if (req.body.history && !context.history) {
      context.history = req.body.history;
    }

    try {
      const response = await aiAgentService.processTravelQuery(sessionId, message, context);
      return successResponse(res, 'AI Travel Agent response generated successfully', response);
    } catch (err) {
      console.error('AI Travel Agent error:', err.message);
      return successResponse(res, 'AI Travel Agent response generated successfully', {
        message: '### ⚠️ Notice\n\nOur AI Travel Agent is currently experiencing high demand. Please try sending your request again in a moment, or use our **AI Trip Planner** for automated schedules.',
        isPlanReady: false,
        extractedRequirements: null,
        tripOverview: null,
        itinerary: [],
        recommendations: null,
        suggestions: [
          'I want to travel from Chennai to Ooty for 3 days with 2 people. Budget ₹15,000.',
          'Plan a 4-day Goa vacation for friends.',
          'Plan a budget trip to Kerala under ₹12,000.',
        ],
        sessionId,
        timestamp: new Date().toISOString(),
      });
    }
  }),

  /**
   * GET /api/ai-agent/history
   * Retrieve conversational plan history
   */
  getHistory: asyncHandler(async (req, res) => {
    const sessionId = req.query.sessionId || req.user?.id?.toString() || 'traveler_agent_session';
    const history = aiAgentService.getHistory(sessionId);
    return successResponse(res, 'AI Agent history retrieved successfully', history);
  }),

  /**
   * DELETE /api/ai-agent/history
   * Reset session plan
   */
  clearHistory: asyncHandler(async (req, res) => {
    const sessionId = req.query.sessionId || req.body.sessionId || req.user?.id?.toString() || 'traveler_agent_session';
    aiAgentService.clearHistory(sessionId);
    return successResponse(res, 'AI Agent history cleared successfully', { cleared: true });
  }),
};

module.exports = aiAgentController;
