// routes/itineraryRoutes/itineraryBookingRoutes.js

const express = require('express');
const router = express.Router();
const { validateBookingSchema } = require('../../middlewares/validationMiddleware');
const { catchAsync } = require('../../utils/errorHandling');
const ItineraryBookingController = require('../../controllers/itineraryController/itineraryBookingController');
const authMiddleware = require('../../middlewares/authMiddleware');

// Protect all routes
router.use(authMiddleware);

// Booking routes
router.post('/', validateBookingSchema, catchAsync(ItineraryBookingController.createBooking));
router.get('/', catchAsync(ItineraryBookingController.getBookings));
router.get('/stats', catchAsync(ItineraryBookingController.getBookingStats));
router.get('/:bookingId', catchAsync(ItineraryBookingController.getBookingByBookingId));
router.patch('/:bookingId/status', catchAsync(ItineraryBookingController.updateBookingStatus));
router.post('/:bookingId/cancel', catchAsync(ItineraryBookingController.cancelBooking));

// Error handling for invalid routes
router.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

module.exports = router;