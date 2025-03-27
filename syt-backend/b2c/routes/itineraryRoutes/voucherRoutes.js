// voucherRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const { AppError } = require('../../utils/errorHandling');
const { getFlightBookingDetails } = require('../../controllers/flightController/flightControllerTC');
const hotelController = require('../../controllers/hotelController/hotelControllerTC');
const transferController = require('../../controllers/transferController/transferControllerLA');
const activityController = require('../../controllers/activityController/activityControllerGRNC');

// Error handling wrapper
const asyncHandler = (handler) => (req, res, next) => {
  if (typeof handler !== 'function') {
    return next(new Error('Handler is not a function'));
  }
  return Promise.resolve(handler(req, res, next)).catch(next);
};

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Flight voucher endpoint
router.post('/flight/:bmsBookingCode', 
  asyncHandler(getFlightBookingDetails)
);

// Hotel voucher endpoint
router.post('/hotel/:bookingCode', 
  asyncHandler(hotelController.getHotelBookingDetails)
);

// Transfer voucher endpoint
router.post('/transfer/:booking_id', 
  asyncHandler(transferController.getTransferBookingDetails)
);

// Activity voucher endpoint
router.post('/activity/:bookingReference', 
  asyncHandler(activityController.getActivityBookingDetails)
);

// Error handling for undefined routes
router.use('*', (req, res, next) => {
  next(new AppError(`Cannot ${req.method} ${req.originalUrl}`, 404));
});

module.exports = router;