// models/ItineraryBooking.js
const mongoose = require('mongoose');

const travelerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  dateOfBirth: { type: String, required: true },
  age: { type: String, required: true },
  passportNumber: { type: String, required: true },
  passportIssueDate: { type: String, required: true },
  passportExpiryDate: { type: String, required: true },
  nationality: { type: String, required: true },
  weight: { type: String, required: true },
  height: { type: String, required: true },
  preferredLanguage: { type: String, required: true },
  foodPreference: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['adult', 'child'],
    required: true 
  },
  gender: { 
    type: String, 
    enum: ['male', 'female', 'other'],
    required: true 
  },
  addressLineOne: { type: String, required: true },
  addressLineTwo: { type: String, default: null },
  city: { type: String, required: true },
  country: { type: String, required: true },
  cellCountryCode: { type: String, required: true },
  countryCode: { type: String, required: true },
  panNumber: { type: String, required: true },
  frequentFlyerAirlineCode: { type: String, default: null },
  frequentFlyerNumber: { type: String, default: null },
  gstNumber: { type: String, default: null },
  gstCompanyName: { type: String, default: null },
  gstCompanyAddress: { type: String, default: null },
  gstCompanyEmail: { type: String, default: null },
  gstCompanyContactNumber: { type: String, default: null }
}, { _id: false });

const roomSchema = new mongoose.Schema({
  roomNumber: { type: Number, required: true },
  travelers: { 
    type: [travelerSchema], 
    required: true, 
    validate: v => v.length > 0 
  }
}, { _id: false });

const itineraryBookingSchema = new mongoose.Schema({
  bookingId: { 
    type: String, 
    required: true,
    unique: true
  },
  itineraryToken: { 
    type: String,
    required: true 
  },
  inquiryToken: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['draft', 'pending', 'processing', 'confirmed', 'cancelled', 'failed'],
    default: 'draft'
  },
  bookingDate: { type: Date, required: true },

  // Payment fields
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    default: null
  },
  totalAmount: {
    type: Number,
    required: true
  },
  tcsAmount: {
    type: Number,
    default: 0
  },
  tcsRate: {
    type: Number,
    default: 0
  },

  // Razorpay transaction details
  razorpay: {
    orderId: { type: String, default: null },
    paymentId: { type: String, default: null },
    signature: { type: String, default: null }
  },

  rooms: { 
    type: [roomSchema], 
    required: true, 
    validate: v => v.length > 0 
  },
  specialRequirements: { type: String, default: null },

  userInfo: {
    userId: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true }
  }
}, {
  timestamps: true
});


itineraryBookingSchema.index({ 'userInfo.userId': 1, bookingDate: -1 });
itineraryBookingSchema.index({ status: 1 });
itineraryBookingSchema.index({ paymentStatus: 1 });
itineraryBookingSchema.index({ itineraryToken: 1 }, { unique: true });
itineraryBookingSchema.index({ bookingId: 1 }, { unique: true });
itineraryBookingSchema.index({ 'razorpay.orderId': 1 });
itineraryBookingSchema.index({ 'razorpay.paymentId': 1 });

const ItineraryBooking = mongoose.model('ItineraryBooking', itineraryBookingSchema);

module.exports = ItineraryBooking;