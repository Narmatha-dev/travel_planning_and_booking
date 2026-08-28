const chatbotService = require('../services/chatbotService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const chatbotController = {
  /**
   * POST /api/chat or POST /api/chatbot/message
   * Process user query and return AI answer, suggestions, and action links
   */
  sendMessage: asyncHandler(async (req, res) => {
    const sessionId = req.body.sessionId || req.user?.id?.toString() || 'default_session';
    const message = req.body.message || req.body.prompt || req.body.query || '';
    const context = req.body.context || {};
    if (req.body.history && !context.history) {
      context.history = req.body.history;
    }

    try {
      const response = await chatbotService.processMessage(sessionId, message, context);
      return successResponse(res, 'AI response generated successfully', response);
    } catch (err) {
      console.error('Chatbot processing error:', err.message);
      return successResponse(res, 'AI response generated successfully', {
        reply: '### ⚠️ Travel Assistant Notice\n\nI am currently experiencing higher than usual traffic. Please try asking your question again in a moment, or use our **AI Trip Planner** for automated itineraries.',
        response: '### ⚠️ Travel Assistant Notice\n\nI am currently experiencing higher than usual traffic. Please try asking your question again in a moment, or use our **AI Trip Planner** for automated itineraries.',
        suggestions: ['Plan a 3-day trip to Ooty', 'Top places in Goa', 'How do I book a trip?'],
        actionLinks: [
          { label: '🧭 Open AI Trip Planner', url: '/trip-planner' },
          { label: '📦 Browse Tour Packages', url: '/packages' },
        ],
        language: 'en',
        timestamp: new Date().toISOString(),
      });
    }
  }),

  /**
   * GET /api/chat/history or GET /api/chatbot/history
   * Retrieve chat message history for the session
   */
  getHistory: asyncHandler(async (req, res) => {
    const sessionId = req.query.sessionId || req.user?.id?.toString() || 'default_session';
    const history = chatbotService.getHistory(sessionId);
    return successResponse(res, 'Chat history retrieved successfully', history);
  }),

  /**
   * DELETE /api/chat/history or DELETE /api/chatbot/history
   * Reset session chat history
   */
  clearHistory: asyncHandler(async (req, res) => {
    const sessionId = req.query.sessionId || req.body.sessionId || req.user?.id?.toString() || 'default_session';
    chatbotService.clearHistory(sessionId);
    return successResponse(res, 'Chat history cleared successfully', { cleared: true });
  }),
};

module.exports = chatbotController;
