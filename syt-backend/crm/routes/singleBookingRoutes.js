// crm/routes/singleBookingRoutes.js
const express = require('express');
const router = express.Router();
const singleBookingController = require('../controllers/singleBookingController');
const { protect } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(protect);

// Hotel booking routes
router.post('/hotel', singleBookingController.saveHotelBooking);
router.get('/hotel', singleBookingController.getAllHotelBookings);
router.get('/hotel/:id', singleBookingController.getHotelBookingById);
router.put('/hotel/:id', singleBookingController.updateHotelBooking);
router.delete('/hotel/:id', singleBookingController.deleteHotelBooking);

// Flight booking routes
router.post('/flight', singleBookingController.saveFlightBooking);
router.get('/flight', singleBookingController.getAllFlightBookings);
router.get('/flight/:id', singleBookingController.getFlightBookingById);
router.put('/flight/:id', singleBookingController.updateFlightBooking);
router.delete('/flight/:id', singleBookingController.deleteFlightBooking);

// Transfer booking routes
router.post('/transfer', singleBookingController.saveTransferBooking);
router.get('/transfer', singleBookingController.getAllTransferBookings);
router.get('/transfer/:id', singleBookingController.getTransferBookingById);
router.put('/transfer/:id', singleBookingController.updateTransferBooking);
router.delete('/transfer/:id', singleBookingController.deleteTransferBooking);

module.exports = router;
