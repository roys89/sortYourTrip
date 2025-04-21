const express = require('express');
const router = express.Router();
const { getCrmInquiries, assignUserToInquiry, getInquiryDetails, updateInquiryDetails, deleteInquiry } = require('../controllers/inquiryController');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/crm/inquiries/
// @desc    Get inquiries for CRM view based on user role
// @access  Private (Admin, Agent, etc. - handled by controller)
router.get('/', protect, getCrmInquiries);

// @route   GET /api/crm/inquiries/:inquiryToken
// @desc    Get details for a specific inquiry
// @access  Private
router.get('/:inquiryToken', protect, getInquiryDetails);

// Assign User to Inquiry
// PUT /api/crm/inquiries/:inquiryToken/assign-user
router.put('/:inquiryToken/assign-user', protect, authorize('admin', 'manager'), assignUserToInquiry);

// Update specific inquiry details
router.patch('/:inquiryToken', protect, updateInquiryDetails);

// @route   DELETE /api/crm/inquiries/:inquiryToken
// @desc    Delete a specific inquiry
// @access  Private (Implement specific permissions in controller if needed)
router.delete('/:inquiryToken', protect, authorize('admin', 'manager'), deleteInquiry);

// Add other CRM-specific inquiry routes here if needed in the future

module.exports = router; 