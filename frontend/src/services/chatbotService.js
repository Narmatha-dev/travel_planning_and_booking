import api from './api';

const chatbotService = {
  /**
   * Send a chat message to the AI Travel Assistant
   */
  async sendMessage(message, sessionId = 'travelora_user_session') {
    const response = await api.post('/chatbot/message', {
      message,
      sessionId,
    });
    return response.data.data;
  },

  /**
   * Get chat session history
   */
  async getHistory(sessionId = 'travelora_user_session') {
    const response = await api.get('/chatbot/history', {
      params: { sessionId },
    });
    return response.data.data;
  },

  /**
   * Clear chat session history
   */
  async clearHistory(sessionId = 'travelora_user_session') {
    const response = await api.delete('/chatbot/history', {
      params: { sessionId },
    });
    return response.data.data;
  },
};

export default chatbotService;
