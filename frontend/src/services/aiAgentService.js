import api from './api';

const aiAgentService = {
  /**
   * Send traveler requirement or query to AI Travel Agent
   */
  async sendMessage(message, sessionId = 'traveler_agent_session', history = []) {
    const response = await api.post('/ai-agent', {
      message,
      sessionId,
      history,
    }, {
      timeout: 45000, // 45 seconds for comprehensive Gemini plan generation
    });
    return response.data?.data;
  },

  /**
   * Fetch conversation and plan history
   */
  async getHistory(sessionId = 'traveler_agent_session') {
    const response = await api.get(`/ai-agent/history?sessionId=${encodeURIComponent(sessionId)}`);
    return response.data?.data || [];
  },

  /**
   * Clear session history
   */
  async clearHistory(sessionId = 'traveler_agent_session') {
    const response = await api.delete(`/ai-agent/history?sessionId=${encodeURIComponent(sessionId)}`);
    return response.data?.data;
  },
};

export default aiAgentService;
