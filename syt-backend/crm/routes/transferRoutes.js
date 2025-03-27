const express = require('express');
const router = express.Router();
const { 
  searchTransfers,
  getTransferDetails,
  bookTransfer,
  getBookingStatus,
  cancelBooking
} = require('../controllers/transferController');
const { protect } = require('../middleware/auth');

// Transfer search and booking routes with provider support
router.post('/:provider?/search', protect, searchTransfers);
router.get('/:provider?/:id', protect, getTransferDetails);
router.post('/:provider?/book', protect, bookTransfer);
router.post('/:provider?/booking/:id/status', protect, getBookingStatus);
router.post('/:provider?/booking/:id/cancel', protect, cancelBooking);

// Keep backward compatibility with old routes
router.get('/:id', protect, getTransferDetails);

module.exports = router; 