// routes/itineraryBookingRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const ItineraryBookingController = require('../../controllers/itineraryController/itineraryBookingController');

// Protect all routes
router.use(authMiddleware);

// Booking routes
router.post('/', ItineraryBookingController.createBooking);
router.get('/user', ItineraryBookingController.getUserBookings);
router.get('/status/:itineraryToken', ItineraryBookingController.getBookingStatus);
router.get('/:id', ItineraryBookingController.getBooking);

module.exports = router;