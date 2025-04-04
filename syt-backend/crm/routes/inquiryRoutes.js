const express = require('express');
const router = express.Router();
const { getCrmInquiries, assignUserToInquiry } = require('../controllers/inquiryController');
const { protect } = require('../middleware/auth');

// @route   GET /api/crm/inquiries/
// @desc    Get inquiries for CRM view based on user role
// @access  Private (Admin, Agent, etc. - handled by controller)
router.get('/', protect, getCrmInquiries);

// Assign User to Inquiry
// PUT /api/crm/inquiries/:inquiryToken/assign-user
router.put('/:inquiryToken/assign-user', protect, assignUserToInquiry);

// Add other CRM-specific inquiry routes here if needed in the future

module.exports = router; 