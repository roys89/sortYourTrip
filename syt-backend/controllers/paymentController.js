// controllers/paymentController.js
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const ItineraryBooking = require('../models/ItineraryBooking');
const Itinerary = require('../models/Itinerary'); // Added Itinerary model import

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

    // Convert amount to paise and ensure it's an integer
    const amountInPaise = Math.round(amount * 100);

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: bookingId,
      notes: {
        userId: userId.toString(),
        bookingId
      }
    });

    // Create payment record
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

    // Update Itinerary and ItineraryBooking to processing status
    await Promise.all([
      Itinerary.findOneAndUpdate(
        { itineraryToken },
        { paymentStatus: 'processing' }
      ),
      ItineraryBooking.findOneAndUpdate(
        { bookingId },
        { paymentStatus: 'processing' }
      )
    ]);

    res.status(200).json({
      success: true,
      data: {
        key_id: process.env.RAZORPAY_KEY_ID,
        orderId: order.id,
        amount: amountInPaise,
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

      // Update both Itinerary and ItineraryBooking
      await Promise.all([
        Itinerary.findOneAndUpdate(
          { itineraryToken: payment.itineraryToken },
          { paymentStatus: 'failed' }
        ),
        ItineraryBooking.findOneAndUpdate(
          { bookingId },
          { 
            paymentStatus: 'failed',
            'razorpay.paymentId': paymentId,
            'razorpay.signature': signature,
            status: 'failed'
          }
        )
      ]);

      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Update payment record for success
    payment.status = 'completed';
    payment.razorpay.paymentId = paymentId;
    payment.razorpay.signature = signature;
    payment.paymentId = paymentId;
    payment.paymentAttempts.push({
      timestamp: new Date(),
      status: 'completed'
    });
    await payment.save();

    // Update both Itinerary and ItineraryBooking for success
    await Promise.all([
      Itinerary.findOneAndUpdate(
        { itineraryToken: payment.itineraryToken },
        { paymentStatus: 'completed' }
      ),
      ItineraryBooking.findOneAndUpdate(
        { bookingId },
        { 
          paymentStatus: 'completed',
          'razorpay.paymentId': paymentId,
          'razorpay.signature': signature,
          status: 'confirmed'
        }
      )
    ]);

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
const handleWebhook = async (req, res) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-razorpay-signature'];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (signature !== digest) {
      console.error('Invalid webhook signature');
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    const { event, payload } = req.body;
    const payment = payload.payment.entity;
    
    console.log(`Received Razorpay Webhook Event: ${event}`);
    console.log('Payment Details:', JSON.stringify(payment, null, 2));

    // Find payment record
    const paymentRecord = await Payment.findOne({
      'razorpay.orderId': payment.order_id
    });

    if (!paymentRecord) {
      console.warn(`No payment record found for order ID: ${payment.order_id}`);
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // Determine status based on event
    let status, bookingStatus;
    
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

    // Update all relevant records
    await Promise.all([
      // Update Payment record
      Payment.findOneAndUpdate(
        { 'razorpay.orderId': payment.order_id },
        {
          status,
          'razorpay.paymentId': payment.id,
          'razorpay.status': status,
          $push: {
            paymentAttempts: {
              timestamp: new Date(),
              status,
              error: payment.error_description
            }
          }
        }
      ),
      // Update Itinerary payment status
      Itinerary.findOneAndUpdate(
        { itineraryToken: paymentRecord.itineraryToken },
        { paymentStatus: status }
      ),
      // Update ItineraryBooking status
      ItineraryBooking.findOneAndUpdate(
        { bookingId: paymentRecord.bookingId },
        { 
          paymentStatus: status,
          status: bookingStatus,
          'razorpay.paymentId': payment.id,
          'razorpay.status': status
        }
      )
    ]);

    res.status(200).json({ 
      success: true,
      message: 'Webhook processed successfully' 
    });

  } catch (error) {
    console.error('Webhook handler error:', error);
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