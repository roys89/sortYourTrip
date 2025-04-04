const express = require('express');
const router = express.Router();
const { 
  searchFlights,
  createFlightItinerary,
  getFareRules,
  bookFlight,
  getBookings,
  getBookingById,
  allocatePassengers,
  recheckRate,
  getBookingDetails
} = require('../controllers/flightController');
const { protect, checkPermission } = require('../middleware/auth');

// Flight search and booking routes with provider support
router.post('/:provider?/search', protect, checkPermission('bookings'), searchFlights);
router.post('/:provider?/itinerary', protect, checkPermission('bookings'), createFlightItinerary);
router.get('/:provider?/fare-rules/:traceId', protect, checkPermission('bookings'), getFareRules);
router.post('/:provider?/book', protect, checkPermission('bookings'), bookFlight);
router.post('/:provider?/allocate-passengers', protect, checkPermission('bookings'), allocatePassengers);
router.post('/:provider?/recheck-rate', protect, checkPermission('bookings'), recheckRate);
router.get('/:provider?/booking-details/:bmsBookingCode', protect, checkPermission('bookings'), getBookingDetails);

// Keep backward compatibility with old routes
router.post('/search', protect, checkPermission('bookings'), searchFlights);
router.post('/itinerary', protect, checkPermission('bookings'), createFlightItinerary);
router.get('/fare-rules/:traceId', protect, checkPermission('bookings'), getFareRules);
router.post('/book', protect, checkPermission('bookings'), bookFlight);
router.post('/allocate-passengers', protect, checkPermission('bookings'), allocatePassengers);
router.post('/recheck-rate', protect, checkPermission('bookings'), recheckRate);
router.get('/booking-details/:bmsBookingCode', protect, checkPermission('bookings'), getBookingDetails);

// Booking management routes
// router.get('/bookings', protect, checkPermission('bookings'), getBookings);
// router.get('/bookings/:id', protect, checkPermission('bookings'), getBookingById);

module.exports = router;