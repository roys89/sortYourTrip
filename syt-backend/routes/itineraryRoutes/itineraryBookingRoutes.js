// routes/itineraryRoutes/itineraryBookingRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const ItineraryBookingController = require('../../controllers/itineraryController/itineraryBookingController');
const { validateBookingSchema } = require('../../middlewares/validationMiddleware');

// Protect all routes
router.use(authMiddleware);

// Create booking
router.post('/', validateBookingSchema, ItineraryBookingController.createBooking);

// Get all bookings with pagination and filters
router.get('/', ItineraryBookingController.getBookings);

// Get specific booking
router.get('/:id', ItineraryBookingController.getBooking);

// Update booking status
router.patch('/:id/status', ItineraryBookingController.updateBookingStatus);

// Cancel booking
router.post('/:id/cancel', ItineraryBookingController.cancelBooking);

// Get booking statistics
router.get('/stats', ItineraryBookingController.getBookingStats);

module.exports = router;