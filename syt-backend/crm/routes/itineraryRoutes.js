const express = require('express');
const router = express.Router();
const { getAllItineraries, deleteItinerary } = require('../controllers/itineraryController');
// Use 'protect' middleware consistent with inquiryRoutes.js
const { protect } = require('../middleware/auth'); // Adjust path if necessary

// @route   GET /api/crm/itineraries/
// @desc    Get all itineraries (associated with inquiries)
// @access  Private
// Use protect middleware
router.get('/', protect, getAllItineraries);

// @route   DELETE /api/crm/itineraries/:itineraryToken
// @desc    Delete a specific itinerary
// @access  Private (Implement specific permissions in controller if needed)
router.delete('/:itineraryToken', protect, deleteItinerary);

module.exports = router;