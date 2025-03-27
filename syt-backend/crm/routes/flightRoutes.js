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
const { protect } = require('../middleware/auth');

// Flight search and booking routes with provider support
router.post('/:provider?/search', protect, searchFlights);
router.post('/:provider?/itinerary', protect, createFlightItinerary);
router.get('/:provider?/fare-rules/:traceId', protect, getFareRules);
router.post('/:provider?/book', protect, bookFlight);
router.post('/:provider?/allocate-passengers', protect, allocatePassengers);
router.post('/:provider?/recheck-rate', protect, recheckRate);
router.get('/:provider?/booking-details/:bmsBookingCode', protect, getBookingDetails);

// Keep backward compatibility with old routes
router.post('/search', protect, searchFlights);
router.post('/itinerary', protect, createFlightItinerary);
router.get('/fare-rules/:traceId', protect, getFareRules);
router.post('/book', protect, bookFlight);
router.post('/allocate-passengers', protect, allocatePassengers);
router.post('/recheck-rate', protect, recheckRate);
router.get('/booking-details/:bmsBookingCode', protect, getBookingDetails);

// Booking management routes
// router.get('/bookings', protect, getBookings);
// router.get('/bookings/:id', protect, getBookingById);

module.exports = router;