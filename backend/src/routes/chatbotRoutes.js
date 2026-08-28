const express = require('express');
const chatbotController = require('../controllers/chatbotController');

const router = express.Router();

// 1. Send Chat Message & Receive AI Response (POST /api/chat, /message, /query)
router.post('/', chatbotController.sendMessage);
router.post('/message', chatbotController.sendMessage);
router.post('/query', chatbotController.sendMessage);

// 2. Retrieve Chat Session History (GET /api/chat/history or GET /api/chatbot/history)
router.get('/history', chatbotController.getHistory);

// 3. Clear Chat Session History (DELETE /api/chat/history or DELETE /api/chatbot/history)
router.delete('/history', chatbotController.clearHistory);

module.exports = router;
