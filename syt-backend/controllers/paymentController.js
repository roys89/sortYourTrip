// controllers/paymentController.js
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const ItineraryBooking = require('../models/ItineraryBooking');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET
});

// Helper function to validate payment signature
const validateSignature = (orderId, paymentId, signature) => {
  const text = `${orderId}|${paymentId}`;
  const generated_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(text)
    .digest("hex");
  
  return generated_signature === signature;
};

// Create order and save payment record
const createOrder = async (req, res) => {
  try {
    const { 
      bookingId, 
      amount,
      totalAmount,
      tcsAmount,
      tcsRate,
      itineraryToken,
      inquiryToken,
      userInfo
    } = req.body;
    const userId = req.userId;

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: bookingId,
      notes: {
        userId: userId.toString(),
        bookingId
      }
    });

    // Create payment record with data from frontend
    const payment = new Payment({
      userId,
      bookingId,
      itineraryToken,
      inquiryToken,
      amount: totalAmount,
      status: 'pending',
      razorpay: {
        orderId: order.id,
        paymentId: null,
        signature: null
      },
      userInfo,
      metadata: {
        currency: 'INR',
        tcsAmount,
        tcsRate
      }
    });

    await payment.save();

    res.status(200).json({
      success: true,
      data: {
        key_id: process.env.RAZORPAY_KEY_ID, 
        orderId: order.id,
        amount: order.amount,
        currency: order.currency
      }
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    });
  }
};

// Verify payment after Razorpay callback
const verifyPayment = async (req, res) => {
  try {
    const {
      bookingId,
      paymentId,
      orderId,
      signature
    } = req.body;
    const userId = req.userId;

    // Find payment record
    const payment = await Payment.findOne({
      bookingId,
      'razorpay.orderId': orderId,
      userId
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // Verify signature
    if (!validateSignature(orderId, paymentId, signature)) {
      // Update payment status to failed
      payment.status = 'failed';
      payment.paymentAttempts.push({
        timestamp: new Date(),
        status: 'failed',
        error: 'Invalid payment signature'
      });
      await payment.save();

      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Update payment record
    payment.status = 'completed';
    payment.razorpay.paymentId = paymentId;
    payment.razorpay.signature = signature;
    payment.paymentAttempts.push({
      timestamp: new Date(),
      status: 'completed'
    });
    await payment.save();

    // Update booking status
    await ItineraryBooking.findOneAndUpdate(
      { bookingId },
      { 
        paymentStatus: 'completed',
        'razorpay.paymentId': paymentId,
        'razorpay.signature': signature,
        status: 'confirmed'  // Update main booking status
      }
    );

    res.status(200).json({
      success: true,
      data: {
        paymentId,
        bookingId,
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
};

// Handle Razorpay webhooks
// Handle Razorpay webhooks
const handleWebhook = async (req, res) => {
    try {
      // 1. Extract signature from Razorpay headers
      const signature = req.headers['x-razorpay-signature'];
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
      
      // 2. Verify webhook signature
      const shasum = crypto.createHmac('sha256', secret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest('hex');
  
      // 3. Validate signature
      if (signature !== digest) {
        console.error('Invalid webhook signature');
        return res.status(400).json({
          success: false,
          message: 'Invalid webhook signature'
        });
      }
  
      // 4. Extract event and payment details
      const { event, payload } = req.body;
      const payment = payload.payment.entity;
      
      // 5. Log the incoming webhook event
      console.log(`Received Razorpay Webhook Event: ${event}`);
      console.log('Payment Details:', JSON.stringify(payment, null, 2));
  
      // 6. Find payment record by order ID
      const paymentRecord = await Payment.findOne({
        'razorpay.orderId': payment.order_id
      });
  
      // 7. If no payment record found, log and return
      if (!paymentRecord) {
        console.warn(`No payment record found for order ID: ${payment.order_id}`);
        return res.status(404).json({
          success: false,
          message: 'Payment record not found'
        });
      }
  
      // 8. Determine status based on event
      let status, bookingStatus, errorDescription = null;
  
      switch (event) {
        case 'payment.authorized':
          status = 'authorized';
          bookingStatus = 'pending';
          break;
        
        case 'payment.captured':
          status = 'completed';
          bookingStatus = 'confirmed';
          break;
        
        case 'payment.failed':
          status = 'failed';
          bookingStatus = 'failed';
          errorDescription = payment.error_description || 'Payment failed';
          break;
        
        case 'payment.pending':
          status = 'pending';
          bookingStatus = 'pending';
          break;
        
        case 'payment.dispute.created':
          status = 'disputed';
          bookingStatus = 'disputed';
          break;
        
        default:
          console.warn(`Unhandled event type: ${event}`);
          return res.status(200).json({ 
            success: true, 
            message: 'Event type not processed' 
          });
      }
  
      // 9. Update payment record
      paymentRecord.status = status;
      paymentRecord.paymentAttempts.push({
        timestamp: new Date(),
        status,
        error: errorDescription
      });
  
      // Update Razorpay-specific details
      paymentRecord.razorpay.paymentId = payment.id;
      paymentRecord.razorpay.status = status;
  
      await paymentRecord.save();
  
      // 10. Update booking status
      await ItineraryBooking.findOneAndUpdate(
        { bookingId: paymentRecord.bookingId },
        { 
          paymentStatus: status,
          status: bookingStatus,
          'razorpay.paymentId': payment.id, 
          'razorpay.status': status
        }
      );
  
      // 11. Optional: Send notifications or trigger additional processes
      if (status === 'completed') {
        // Example: Send confirmation email
        // await sendConfirmationEmail(paymentRecord);
      }
  
      // 12. Respond to Razorpay
      res.status(200).json({ 
        success: true,
        message: 'Webhook processed successfully' 
      });
  
    } catch (error) {
      // 13. Comprehensive error handling
      console.error('Webhook handler error:', error);
      
      // Log error details
      const errorLog = new ErrorLog({
        service: 'RazorpayWebhook',
        errorMessage: error.message,
        errorStack: error.stack,
        requestBody: JSON.stringify(req.body)
      });
      await errorLog.save();
  
      res.status(500).json({
        success: false,
        message: 'Webhook processing failed',
        error: 'Internal server error'
      });
    }
  };

// Get payment details
const getPaymentDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.userId;

    const payment = await Payment.findOne({
      bookingId,
      userId
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment details not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment details',
      error: error.message
    });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  handleWebhook,
  getPaymentDetails
};