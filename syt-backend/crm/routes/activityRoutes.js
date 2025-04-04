const express = require('express');
const router = express.Router();
const { protect, checkPermission } = require('../middleware/auth');
const {
  searchActivities,
  getActivityDetails,
  bookActivity,
  getBookingStatus,
  getActivityAvailabilityDetails,
  createActivityReference
} = require('../controllers/activityController');

// Search activities
router.post('/:provider?/search', protect, checkPermission('bookings'), searchActivities);

// Get activity details
router.post('/:provider?/product-details', protect, checkPermission('bookings'), getActivityDetails);

// Check availability
router.post('/:provider?/availability-details', protect, checkPermission('bookings'), getActivityAvailabilityDetails);

// Create booking reference
router.post('/:provider?/reference', protect, checkPermission('bookings'), createActivityReference);

// Book activity
router.post('/:provider?/book', protect, checkPermission('bookings'), bookActivity);

// Get booking status
router.get('/:provider?/booking/:bookingId/status', protect, checkPermission('bookings'), getBookingStatus);

module.exports = router; 