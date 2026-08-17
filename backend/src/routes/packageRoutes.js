const express = require('express');
const packageController = require('../controllers/packageController');

const router = express.Router();

// 1. List all packages (with query filters: destinationId, packageType, difficultyLevel, minPrice, maxPrice, search, isAvailable, sortBy)
router.get('/', packageController.getAllPackages);

// 2. Get featured packages (for home page cards)
router.get('/featured', packageController.getFeaturedPackages);

// 3. Create a new package
router.post('/', packageController.createPackage);

// 4. Update package details
router.put('/:id', packageController.updatePackage);

// 5. Update package availability status
router.patch('/:id/availability', packageController.updateAvailability);

// 6. Delete a package
router.delete('/:id', packageController.deletePackage);

// 7. Get single package by ID or Slug (keep as last GET route)
router.get('/:identifier', packageController.getPackageByIdOrSlug);

module.exports = router;
