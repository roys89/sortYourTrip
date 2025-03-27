const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { 
  createOrder, 
  verifyPayment,
  handleWebhook 
} = require('../controllers/paymentController');

const router = express.Router();

// Protected routes (require authentication)
router.post('/create-order', authMiddleware, createOrder);
router.post('/verify', authMiddleware, verifyPayment);

// Webhook route (no auth required, verified by signature)
router.post('/webhook', handleWebhook);

module.exports = router;