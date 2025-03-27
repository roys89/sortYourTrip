// models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: String,  // Changed from ObjectId since we're getting string
    required: true
  },
  bookingId: {
    type: String,
    required: true,
    unique: true
  },
  itineraryToken: {  // Changed from itineraryId to itineraryToken
    type: String,
    required: true
  },
  inquiryToken: {  // Added inquiryToken
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  razorpay: {
    orderId: String,
    paymentId: String,
    signature: String
  },
  userInfo: {  // Added userInfo object
    userId: String,
    firstName: String,
    lastName: String,
    email: String,
    phoneNumber: String
  },
  paymentAttempts: [{
    timestamp: Date,
    status: String,
    error: String
  }],
  metadata: {
    currency: {
      type: String,
      default: 'INR'
    },
    tcsAmount: {  // Added required fields for TCS
      type: Number,
      required: true
    },
    tcsRate: {
      type: Number,
      required: true
    }
  }
}, {
  timestamps: true
});

// Indexes
paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ userId: 1 });
paymentSchema.index({ itineraryToken: 1 });
paymentSchema.index({ inquiryToken: 1 });
paymentSchema.index({ 'razorpay.orderId': 1 });
paymentSchema.index({ 'razorpay.paymentId': 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: 1 });

// Methods
paymentSchema.methods.updatePaymentStatus = async function(status, razorpayDetails = {}) {
  this.status = status;
  if (razorpayDetails.orderId) this.razorpay.orderId = razorpayDetails.orderId;
  if (razorpayDetails.paymentId) this.razorpay.paymentId = razorpayDetails.paymentId;
  if (razorpayDetails.signature) this.razorpay.signature = razorpayDetails.signature;
  
  this.paymentAttempts.push({
    timestamp: new Date(),
    status: status,
    error: razorpayDetails.error || null
  });

  return this.save();
};

module.exports = mongoose.model('Payment', paymentSchema);