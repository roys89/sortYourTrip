const mongoose = require('mongoose');

// Define schema for transfer bookings
const TransferBookingSchema = new mongoose.Schema({
  bookingRefId: { // Provider's Booking ID (e.g., from LeAmigo)
    type: String,
    required: true,
    unique: true,
    index: true
  },
  provider: {
    type: String,
    enum: ['LA'], // Add other providers later if needed
    required: true,
    default: 'LA'
  },
  providerBookingResponse: {
    type: mongoose.Schema.Types.Mixed, // Store the entire booking response from the provider
    required: true
  },
  status: { // Overall CRM status
    type: String,
    enum: ['Confirmed', 'Pending Confirmation', 'Cancelled', 'Failed'],
    default: 'Pending Confirmation',
    required: true
  },
  transferDetails: {
    origin: {
      type: { type: String, enum: ['location', 'airport', 'poi'], default: 'location' },
      display_address: String,
      lat: String,
      long: String,
      // Add airport/poi specific fields if needed later
    },
    destination: {
      display_address: String,
      lat: String,
      long: String,
      // Add airport/poi specific fields if needed later
    },
    pickupDate: { type: String, required: true }, // Store as YYYY-MM-DD
    pickupTime: { type: String, required: true }, // Store as HH:MM (24hr)
    journeyType: String, // e.g., 'one_way', 'return' - from provider response if available
    vehicle: {
      class: String,
      capacity: Number,
      // Add more vehicle details if needed
    }
  },
  guestDetails: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    totalPassengers: { type: Number, required: true },
    flightNumber: String, // Optional
    notes: String // Optional comments from guest
  },
  paymentDetails: {
    currency: { type: String, required: true },
    fare: { type: Number, required: true }, // The final price for the transfer
    paymentMethod: {
      type: String,
      default: 'Pending'
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Pending', 'Failed', 'Refunded'],
      default: 'Pending'
    },
    transactionId: {
      type: String,
      default: 'N/A'
    },
    amountPaid: {
      type: Number,
      default: 0
    },
    remarks: String // Any payment related notes
  },
  agentDetails: {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CRMUser', // Ensure this ref matches your User model name
      required: true
    },
    name: String,
    email: String,
    employeeId: String
  },
  cancellationDetails: {
    isCancelled: { type: Boolean, default: false },
    cancellationDate: Date,
    cancellationReason: String,
    refundAmount: Number,
    refundStatus: String
  },
  notes: String // General notes for the booking
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Add a pre-save hook to update the updatedAt field (redundant with timestamps: true, but kept for consistency if needed)
TransferBookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Export a function that takes a connection and returns a model
module.exports = (connection) => {
  // Create the model using the provided connection
  return connection.model('TransferBooking', TransferBookingSchema);
}; 