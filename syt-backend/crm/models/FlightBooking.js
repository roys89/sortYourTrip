// crm/models/FlightBooking.js
const mongoose = require('mongoose');

// Define schema for flight bookings - Final Structure
const FlightBookingSchema = new mongoose.Schema({
  bookingRefId: { // Essential identifier from your system/frontend potentially
    type: String,
    required: false, // Make optional if it might not always be sent initially
    index: true 
  },
  bmsBookingCode: { // Top-level BMS Booking Code / Booking ID
    type: String,
    index: true
  },
  // --- NEW: Added top-level fields from payload ---
  flightType: {
    type: String,
    enum: ['ONE_WAY', 'DOMESTIC_ROUND_TRIP', 'INTERNATIONAL_ROUND_TRIP'], // Use actual expected values
    required: false
  },
  pnr: { 
    type: String,
    required: false // May not always be present immediately
  },
  traceId: { // Trace ID from the search/booking flow
    type: String,
    required: false
  },
  providerBookingResponse: {
    type: mongoose.Schema.Types.Mixed, // Store the raw JSON response from the provider
    required: false
  },
  // -----------------------------------------------
  bookingStatus: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Cancelled', 'Failed', 'OnRequest'], // Expand status options
    default: 'Pending',
    required: true
  },
  // Passenger Details Array
  passengerDetails: [{
    title: String,
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    email: String,
    phoneNumber: String,
    dateOfBirth: Date,
    gender: String,
    nationality: String,
    passportNumber: String,
    passportExpiry: Date,
    isLeadPassenger: Boolean,
    type: { // Adult, Child, Infant
      type: String,
      enum: ['Adult', 'Child', 'Infant'],
      default: 'Adult'
    },
    ssr: { // Store ancillary details per passenger
      type: mongoose.Schema.Types.Mixed,
      required: false
    },
    // Keeping ancillaries minimal here as total cost is tracked elsewhere
  }],
  agentDetails: { // As requested
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: String,
    email: String,
    employeeId: String
  },
  // --- UPDATED: Simplified Payment Details to match payload ---
  paymentDetails: {
    paymentMethod: {
      type: String,
      default: 'Pending'
    },
    transactionId: {
      type: String,
      default: 'N/A'
    },
    amountPaid: { // Match payload field
      type: Number,
      required: true,
      default: 0
    },
    paymentStatus: { // Match payload field
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending',
      required: true
    },
    currency: {
      type: String,
      default: 'INR',
      required: true
    },
    totalFlightAmount: { // Base fare + taxes + initial fees
      type: Number,
      required: true,
      default: 0
    },
    totalAncillariesAmount: { // Sum of all selected ancillary costs
      type: Number,
      required: true,
      default: 0
    },
    finalTotalAmount: { // Calculated: totalFlightAmount + totalAncillariesAmount
      type: Number,
      required: true,
      default: 0
    }
  },
  // ------------------------------------------------
  // Existing fields (keep if still relevant)
  createdAt: { // Keep existing timestamps
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Automatically manage createdAt and updatedAt
});

// Pre-save hook to update 'updatedAt' and ensure finalTotalAmount consistency
FlightBookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Pre-findOneAndUpdate hook to update 'updatedAt'
FlightBookingSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Export a function that takes a connection and returns a model
module.exports = (connection) => {
  return connection.model('FlightBooking', FlightBookingSchema);
};
