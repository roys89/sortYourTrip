const mongoose = require('mongoose');

const singleBookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    unique: true
  },
  bookingType: {
    type: String,
    required: true,
    enum: ['flight', 'hotel', 'activity', 'transfer']
  },
  provider: {
    type: String,
    required: true,
    enum: ['TC', 'LA', 'GRNC']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  agentCode: {
    type: String,
    required: true
  },
  bookingDetails: {
    flightId: String,
    origin: {
      city: String,
      code: String,
      country: String,
      location: {
        latitude: Number,
        longitude: Number
      }
    },
    destination: {
      city: String,
      code: String,
      country: String,
      location: {
        latitude: Number,
        longitude: Number
      }
    },
    departureDate: Date,
    returnDate: Date,
    travelers: [{
      type: {
        type: String,
        enum: ['adult', 'child', 'infant']
      },
      title: String,
      firstName: String,
      lastName: String,
      dateOfBirth: Date,
      nationality: String,
      passportNumber: String,
      passportExpiry: Date
    }],
    price: {
      amount: Number,
      currency: String
    },
    airline: String,
    flightNumber: String,
    departureTime: String,
    arrivalTime: String,
    duration: String,
    aircraft: String,
    cabinClass: String
  },
  bookingResponse: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update timestamps on save
singleBookingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Generate unique booking ID
singleBookingSchema.pre('save', async function(next) {
  if (!this.bookingId) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.bookingId = `SYT${year}${month}${day}${random}`;
  }
  next();
});

const SingleBooking = mongoose.model('SingleBooking', singleBookingSchema);

module.exports = SingleBooking; 