// routes/guestAllocationRoutes.js
const express = require('express');
const router = express.Router();
const GuestAllocationController = require('../controllers/itineraryController/GuestAllocationController');
const { AppError } = require('../utils/errorHandling');

// Error handling wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Flight allocation routes - note the updated route pattern to match the URL
router.post('/:bookingId/allocate-flight', 
  asyncHandler(GuestAllocationController.allocateFlightPassengers)
);

// Hotel allocation routes
router.post('/:bookingId/allocate-hotel', 
  asyncHandler(GuestAllocationController.allocateHotelRooms)
);

// Status check route
router.get('/status/:bookingId', 
  asyncHandler(GuestAllocationController.checkAllocationStatus)
);

// Catch-all for undefined routes in this router
router.use('*', (req, res, next) => {
  const error = new AppError(`Cannot ${req.method} ${req.originalUrl}`, 404);
  next(error);
});

module.exports = router;