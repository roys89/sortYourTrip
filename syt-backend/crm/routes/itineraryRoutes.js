const express = require('express');
const router = express.Router();
const { getAllItineraries } = require('../controllers/itineraryController'); 
// Use 'protect' middleware consistent with inquiryRoutes.js
const { protect } = require('../middleware/auth'); // Adjust path if necessary

// @route   GET /api/crm/itineraries/
// @desc    Get all itineraries (associated with inquiries)
// @access  Private
// Use protect middleware
router.get('/', protect, getAllItineraries);

module.exports = router;