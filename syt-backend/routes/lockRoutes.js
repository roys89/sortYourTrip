// routes/lockRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validateItineraryAccess } = require('../middleware/itineraryAccess');
const LockController = require('../controllers/LockController');
const { validateLockRequest } = require('../middleware/validation');

// Apply middleware
router.use(protect);

// Create locks for multiple items
router.post(
  '/itinerary/:itineraryToken/locks',
  validateItineraryAccess,
  validateLockRequest,
  LockController.createLocks
);

// Check lock status
router.get(
  '/itinerary/:itineraryToken/locks/status',
  validateItineraryAccess,
  LockController.checkStatus
);

// Release specific lock
router.delete(
  '/itinerary/:itineraryToken/locks/:type/:itemId',
  validateItineraryAccess,
  LockController.releaseLock
);

// Extend lock duration
router.put(
  '/itinerary/:itineraryToken/locks/:type/:itemId/extend',
  validateItineraryAccess,
  LockController.extendLock
);

module.exports = router;