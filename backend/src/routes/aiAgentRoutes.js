const express = require('express');
const aiAgentController = require('../controllers/aiAgentController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Allow both logged in travelers and guest explorers (with optional JWT context)
router.post('/', optionalAuth, aiAgentController.processTravelerQuery);
router.post('/query', optionalAuth, aiAgentController.processTravelerQuery);
router.get('/history', optionalAuth, aiAgentController.getHistory);
router.delete('/history', optionalAuth, aiAgentController.clearHistory);

module.exports = router;
