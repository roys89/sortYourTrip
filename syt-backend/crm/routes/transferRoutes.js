const express = require('express');
const router = express.Router();
const { 
  searchTransfers,
  getTransferDetails,
  bookTransfer,
  getBookingStatus,
  cancelBooking,
  getCancellationDetails
} = require('../controllers/transferController');
const { protect, checkPermission } = require('../middleware/auth');

// Transfer search and booking routes with provider support
router.post('/:provider?/search', protect, checkPermission('bookings'), searchTransfers);
router.get('/:provider?/quote-details', protect, checkPermission('bookings'), getTransferDetails);
router.post('/:provider?/book', protect, checkPermission('bookings'), bookTransfer);

// Provider-specific Booking Status and Cancellation (Using provider ID)
router.post('/:provider?/booking/:id/status', protect, checkPermission('bookings'), getBookingStatus);
router.post('/:provider?/get-cancellation-details', protect, checkPermission('bookings'), getCancellationDetails);
router.post('/:provider?/booking/:id/cancel', protect, checkPermission('bookings'), cancelBooking);

// Keep backward compatibility with old routes
router.get('/:id', protect, checkPermission('bookings'), getTransferDetails);

module.exports = router; 