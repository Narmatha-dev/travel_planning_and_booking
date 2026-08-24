const express = require('express');
const hotelController = require('../controllers/hotelController');

const router = express.Router();

// Search accommodations near destination
router.get('/nearby', hotelController.getNearbyHotels);
router.get('/', hotelController.getNearbyHotels);

// Get single accommodation details
router.get('/:id', hotelController.getHotelById);

module.exports = router;
