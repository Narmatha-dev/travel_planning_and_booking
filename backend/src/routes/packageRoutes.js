const express = require('express');
const packageController = require('../controllers/packageController');

const router = express.Router();

// GET /api/packages
router.get('/', packageController.getAllPackages);

// GET /api/packages/:id
router.get('/:id', packageController.getPackageById);

module.exports = router;
