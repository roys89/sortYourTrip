const express = require('express');
const router = express.Router();
const { validateBookingRequest } = require('../../middlewares/validationMiddleware');
const ItineraryBookingController = require('../../controllers/itineraryController/itineraryBookingController');
const authMiddleware = require('../../middlewares/authMiddleware');
const { AppError } = require('../../utils/errorHandling');

// Error handling wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Routes without binding
router.post('/', 
  validateBookingRequest, 
  asyncHandler(ItineraryBookingController.createBooking)
);

router.get('/', 
  asyncHandler(ItineraryBookingController.getUserBookings)
);

router.get('/stats', 
  asyncHandler(ItineraryBookingController.getBookingStats)
);

router.get('/:bookingId', 
  asyncHandler(ItineraryBookingController.getBookingById)
);

router.patch('/:bookingId/status', 
  asyncHandler(ItineraryBookingController.updateBookingStatus)
);

router.patch('/:bookingId/cancel', 
  asyncHandler(ItineraryBookingController.cancelBooking)
);

// Error handling
router.use('*', (req, res, next) => {
  next(new AppError(`Cannot ${req.method} ${req.originalUrl}`, 404));
});

module.exports = router;