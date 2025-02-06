const express = require('express');
const router = express.Router();
const { validateBooking } = require('../../middlewares/validationMiddleware');
const ItineraryBookingController = require('../../controllers/itineraryController/itineraryBookingController');
const authMiddleware = require('../../middlewares/authMiddleware');
const { AppError } = require('../../utils/errorHandling');
const { bookFlight } = require('../../controllers/flightController/flightControllerTC')
const { bookHotel } = require('../../controllers/hotelController/hotelControllerTC');
const transferController = require('../../controllers/transferController/transferControllerLA');
const { bookTransfer } = transferController;

const activityController = require('../../controllers/activityController/activityControllerGRNC');
const { bookActivity } = activityController;
// Error handling wrapper
const asyncHandler = (handler) => (req, res, next) => {
  if (typeof handler !== 'function') {
    return next(new Error('Handler is not a function'));
  }
  return Promise.resolve(handler(req, res, next)).catch(next);
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

// Flight booking route
router.post('/:bookingId/flight', 
  asyncHandler(bookFlight)
);

// Hotel booking route
router.post('/:bookingId/hotel', 
  asyncHandler(bookHotel)
);

// Transfer booking route
router.post('/:bookingId/transfer', 
  asyncHandler(bookTransfer)
);

// Activity booking route
router.post('/:bookingId/activity', 
  asyncHandler(bookActivity)
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