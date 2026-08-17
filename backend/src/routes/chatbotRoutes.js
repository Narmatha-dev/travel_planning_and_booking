const express = require('express');
const chatbotController = require('../controllers/chatbotController');

const router = express.Router();

// 1. Send Chat Message & Receive AI Response (POST /api/chatbot/message)
router.post('/message', chatbotController.sendMessage);

// 2. Retrieve Chat Session History (GET /api/chatbot/history)
router.get('/history', chatbotController.getHistory);

// 3. Clear Chat Session History (DELETE /api/chatbot/history)
router.delete('/history', chatbotController.clearHistory);

module.exports = router;
