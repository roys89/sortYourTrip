const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  searchActivities,
  getActivityDetails,
  bookActivity,
  getBookingStatus,
  getActivityAvailabilityDetails,
  createActivityReference
} = require('../controllers/activityController');

// Search activities
router.post('/:provider?/search', protect, searchActivities);

// Get activity details
router.post('/:provider?/product-details', protect, getActivityDetails);

// Check availability
router.post('/:provider?/availability-details', protect, getActivityAvailabilityDetails);

// Create booking reference
router.post('/:provider?/reference', protect, createActivityReference);

// Book activity
router.post('/:provider?/book', protect, bookActivity);

// Get booking status
router.get('/:provider?/booking/:bookingId/status', protect, getBookingStatus);

module.exports = router; 