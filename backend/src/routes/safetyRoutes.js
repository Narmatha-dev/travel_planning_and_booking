const express = require('express');
const safetyController = require('../controllers/safetyController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public / Location-based safety queries
router.get('/nearby', safetyController.getNearbySafetyPlaces);
router.get('/emergency-numbers', safetyController.getEmergencyNumbers);

// Protected Trusted Contacts endpoints (Feature 12)
router.get('/contacts', authMiddleware, safetyController.getTrustedContacts);
router.post('/contacts', authMiddleware, safetyController.createTrustedContact);
router.put('/contacts/:id', authMiddleware, safetyController.updateTrustedContact);
router.delete('/contacts/:id', authMiddleware, safetyController.deleteTrustedContact);

// Protected Location Sharing endpoint (Feature 11)
router.post('/share-location', authMiddleware, safetyController.prepareShareLocation);

module.exports = router;
