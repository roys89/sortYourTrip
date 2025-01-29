const express = require('express');
const router = express.Router();
const { validateBooking } = require('../../middlewares/validationMiddleware');
const ItineraryBookingController = require('../../controllers/itineraryController/itineraryBookingController');
const authMiddleware = require('../../middlewares/authMiddleware');
const { AppError } = require('../../utils/errorHandling');

// Error handling wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Create new booking from form data
router.post('/', 
  validateBooking, 
  asyncHandler(ItineraryBookingController.createBooking)
);

// Get user's bookings
router.get('/', 
  asyncHandler(ItineraryBookingController.getUserBookings)
);

// Get booking statistics
router.get('/stats', 
  asyncHandler(ItineraryBookingController.getBookingStats)
);

// Get specific booking
router.get('/:bookingId', 
  asyncHandler(ItineraryBookingController.getBookingById)
);

// Update booking status
router.patch('/:bookingId/status', 
  asyncHandler(ItineraryBookingController.updateBookingStatus)
);

// Cancel booking
router.patch('/:bookingId/cancel', 
  asyncHandler(ItineraryBookingController.cancelBooking)
);

// Error handling
router.use('*', (req, res, next) => {
  next(new AppError(`Cannot ${req.method} ${req.originalUrl}`, 404));
});

module.exports = router;