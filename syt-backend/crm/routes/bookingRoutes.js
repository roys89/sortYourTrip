const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const singleBookingController = require('../controllers/singleBookingController');
const bookingItineraryController = require('../controllers/bookingItineraryController');

// Protect all routes
router.use(auth);

// Single booking routes
// Hotel booking routes
router.post('/single/hotel', singleBookingController.saveHotelBooking);
router.get('/single/hotel', singleBookingController.getAllHotelBookings);
router.get('/single/hotel/:id', singleBookingController.getHotelBookingById);
router.put('/single/hotel/:id', singleBookingController.updateHotelBooking);
router.delete('/single/hotel/:id', singleBookingController.deleteHotelBooking);

// Flight booking routes
router.post('/single/flight', singleBookingController.saveFlightBooking);
router.get('/single/flight', singleBookingController.getAllFlightBookings);
router.get('/single/flight/:id', singleBookingController.getFlightBookingById);
router.put('/single/flight/:id', singleBookingController.updateFlightBooking);
router.delete('/single/flight/:id', singleBookingController.deleteFlightBooking);

// Itinerary routes
router.post('/itinerary', bookingItineraryController.createItinerary);
router.get('/itinerary', bookingItineraryController.getAllItineraries);
router.get('/itinerary/:id', bookingItineraryController.getItineraryById);
router.put('/itinerary/:id', bookingItineraryController.updateItinerary);
router.delete('/itinerary/:id', bookingItineraryController.deleteItinerary);

// All bookings routes
router.get('/', bookingItineraryController.getAllBookings);
router.get('/:id', bookingItineraryController.getBookingById);

module.exports = router; 