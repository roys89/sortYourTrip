// crm/models/HotelBooking.js
const mongoose = require('mongoose');

// Define schema for hotel bookings
const HotelBookingSchema = new mongoose.Schema({
  bookingRefId: {
    type: String,
    required: true,
    unique: true
  },
  providerConfirmationNumber: {
    type: String
  },
  itineraryCode: {
    type: String
  },
  traceId: {
    type: String
  },
  status: {
    type: String,
    enum: ['Confirmed', 'Pending', 'Cancelled'],
    default: 'Confirmed'
  },
  provider: {
    type: String,
    default: 'TC'
  },
  providerBookingResponse: {
    type: mongoose.Schema.Types.Mixed, // Store the entire booking response
    required: true
  },
  paymentDetails: {
    finalRate: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
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
    }
  },
  guestDetails: [{
    title: String,
    firstName: String,
    lastName: String,
    email: String,
    phoneNumber: String,
    age: Number,
    isLeadGuest: Boolean
  }],
  hotelDetails: {
    hotelName: {
      type: String,
      default: ''
    },
    hotelContactInfo: {
      type: String,
      default: ''
    },
    checkIn: {
      type: String,
      default: ''
    },
    checkOut: {
      type: String,
      default: ''
    },
    roomsCount: {
      type: Number,
      default: 1
    },
    totalDays: {
      type: Number,
      default: 1
    },
    hotelRating: {
      type: String,
      default: ''
    },
    hotelLocation: {
      type: String,
      default: ''
    },
    specialRequests: {
      type: String,
      default: ''
    }
  },
  agentDetails: {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CRMUser',
      required: true
    },
    name: String,
    email: String,
    employeeId: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  voucherDetails: {
    voucherNumber: String,
    issuedDate: Date,
    specialInstructions: String
  },
  cancellationDetails: {
    isCancelled: {
      type: Boolean,
      default: false
    },
    cancellationDate: Date,
    cancellationReason: String,
    refundAmount: Number,
    refundStatus: String
  },
  notes: String
});

// Add a pre-save hook to update the updatedAt field
HotelBookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Export a function that takes a connection and returns a model
module.exports = (connection) => {
  // Create the model using the provided connection
  return connection.model('HotelBooking', HotelBookingSchema);
};
