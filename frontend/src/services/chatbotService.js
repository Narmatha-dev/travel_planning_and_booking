import api from './api';

const chatbotService = {
  /**
   * Send a chat message to the Gemini AI Travel Assistant
   */
  async sendMessage(message, sessionId = 'travelora_user_session', context = {}) {
    const response = await api.post('/chat', {
      message,
      sessionId,
      context,
    }, {
      timeout: 35000,
    });
    return response.data.data;
  },

  /**
   * Get chat session history
   */
  async getHistory(sessionId = 'travelora_user_session') {
    const response = await api.get('/chat/history', {
      params: { sessionId },
    });
    return response.data.data;
  },

  /**
   * Clear chat session history
   */
  async clearHistory(sessionId = 'travelora_user_session') {
    const response = await api.delete('/chat/history', {
      params: { sessionId },
    });
    return response.data.data;
  },
};

export default chatbotService;
