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
      amount, // This amount might be the grand total from the frontend
      itinerary // Directly pass the itinerary object from frontend
    } = req.body;
    const userId = req.userId;

    // Extract necessary details from the itinerary object
    const { 
      itineraryToken, 
      inquiryToken, 
      userInfo, 
      priceTotals 
    } = itinerary;

    // Use priceTotals from the itinerary object
    const totalAmount = priceTotals.grandTotal;
    const tcsAmount = priceTotals.tcsAmount;
    const tcsRate = priceTotals.tcsRate;
    
    // Convert amount to paise and ensure it's an integer
    const amountInPaise = Math.round(totalAmount * 100); // Use totalAmount for consistency

    // --- Bypass Razorpay API Call ---
    const dummyOrderId = `order_dummy_${Date.now()}`; 
    console.log(`[Dummy Payment] Generated dummy Order ID: ${dummyOrderId} for Booking ID: ${bookingId}`);
    // --- End Bypass ---

    // Create payment record
    const payment = new Payment({
      userId,
      bookingId,
      itineraryToken,
      inquiryToken,
      amount: totalAmount, // Store the actual total amount
      status: 'pending',
      razorpay: {
        orderId: dummyOrderId, // Use dummy Order ID
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
        key_id: 'dummy_key_id', // Use dummy key
        orderId: dummyOrderId, // Return dummy Order ID
        amount: amountInPaise,
        currency: 'INR'
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
      orderId,
    } = req.body;
    const userId = req.userId;

    // Find payment record using the orderId from the request
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

    // --- Bypass Signature Validation ---
    console.log(`[Dummy Payment] Bypassing signature validation for Order ID: ${orderId}`);
    const dummyPaymentId = `pay_dummy_${Date.now()}`;
    const dummySignature = `dummy_signature_${Date.now()}`;
    console.log(`[Dummy Payment] Generated dummy Payment ID: ${dummyPaymentId}`);
    // --- End Bypass ---

    // Update payment record for success
    payment.status = 'completed';
    payment.razorpay.paymentId = dummyPaymentId; // Use dummy Payment ID
    payment.razorpay.signature = dummySignature; // Use dummy Signature
    payment.paymentId = dummyPaymentId; // Use dummy Payment ID
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
          'razorpay.paymentId': dummyPaymentId, // Use dummy Payment ID
          'razorpay.signature': dummySignature, // Use dummy Signature
          status: 'confirmed' // Set booking status to confirmed
        }
      )
    ]);

    res.status(200).json({
      success: true,
      data: {
        paymentId: dummyPaymentId, // Return dummy Payment ID
        bookingId,
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    // Attempt to revert status if verification fails after bypassing validation (optional)
    try {
       await Payment.findOneAndUpdate(
         { 'razorpay.orderId': req.body.orderId, userId: req.userId },
         { status: 'failed' }
       );
       await ItineraryBooking.findOneAndUpdate(
         { bookingId: req.body.bookingId },
         { paymentStatus: 'failed', status: 'failed' }
       );
         await Itinerary.findOneAndUpdate(
         { itineraryToken: payment.itineraryToken }, // Need to fetch payment first if putting this here
         { paymentStatus: 'failed' }
       );
    } catch (revertError) {
        console.error("Failed to revert status on verification error:", revertError);
    }
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
};

// Handle Razorpay webhooks - Keep this as is, or disable if not needed for testing
const handleWebhook = async (req, res) => {
  // --- Optional: Disable or modify webhook handling ---
  console.log("[Dummy Payment] Received webhook call, but Razorpay interaction is bypassed. Returning success.");
  // You might want to return success immediately without processing
  // if the webhook logic interferes with your dummy flow.
  return res.status(200).json({ 
      success: true,
      message: 'Webhook processed successfully (Dummy Mode)' 
  });
  // --- End Optional ---

  // Original webhook logic (commented out or kept for reference)
  /*
  try {
    // ... (original webhook verification and processing logic) ...
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
      error: 'Internal server error'
    });
  }
  */
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