const chatbotService = require('../services/chatbotService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const chatbotController = {
  /**
   * POST /api/chatbot/message
   * Process user query and return AI answer, suggestions, and action links
   */
  sendMessage: asyncHandler(async (req, res) => {
    const sessionId = req.body.sessionId || req.user?.id?.toString() || 'default_session';
    const message = req.body.message || '';

    const response = await chatbotService.processMessage(sessionId, message);
    return successResponse(res, 'AI response generated successfully', response);
  }),

  /**
   * GET /api/chatbot/history
   * Retrieve chat message history for the session
   */
  getHistory: asyncHandler(async (req, res) => {
    const sessionId = req.query.sessionId || req.user?.id?.toString() || 'default_session';
    const history = chatbotService.getHistory(sessionId);
    return successResponse(res, 'Chat history retrieved successfully', history);
  }),

  /**
   * DELETE /api/chatbot/history
   * Reset session chat history
   */
  clearHistory: asyncHandler(async (req, res) => {
    const sessionId = req.query.sessionId || req.body.sessionId || req.user?.id?.toString() || 'default_session';
    chatbotService.clearHistory(sessionId);
    return successResponse(res, 'Chat history cleared successfully', { cleared: true });
  }),
};

module.exports = chatbotController;
