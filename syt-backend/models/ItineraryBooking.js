const mongoose = require('mongoose');

// Define the price schema
const priceSchema = new mongoose.Schema({
  activities: { type: Number, required: true },
  hotels: { type: Number, required: true },
  flights: { type: Number, required: true },
  transfers: { type: Number, required: true },
  subtotal: { type: Number, required: true },
  tcsRate: { type: Number, required: true },
  tcsAmount: { type: Number, required: true },
  grandTotal: { type: Number, required: true }
}, { _id: false });

// Existing schemas remain the same
const travelerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  age: { type: String, required: true },
  passportNumber: { type: String, required: true },
  passportIssueDate: { type: Date, required: true },
  passportExpiryDate: { type: Date, required: true },
  nationality: { type: String, required: true },
  weight: { type: String, required: true },
  height: { type: String, required: true },
  preferredLanguage: { type: String, required: true },
  foodPreference: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['AD', 'CH'], 
    default: 'AD'
  }
});

const activityBookingSchema = new mongoose.Schema({
  searchId: { type: String, required: true },
  bookingRef: { type: String, required: true },
  activityCode: { type: String, required: true },
  lead: {
    title: { type: String },
    name: { type: String },
    surname: { type: String },
    clientNationality: { type: String },
    age: { type: Number }
  },
  agentRef: { type: String, required: true },
  rateKey: { type: String, required: true },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  groupCode: { type: String, required: true },
  hotelId: { type: String, default: null },
  languageGuide: {
    type: { type: String },
    language: { type: String },
    legacyGuide: { type: String }
  },
  QuestionAnswers: [mongoose.Schema.Types.Mixed],
  travellers: [mongoose.Schema.Types.Mixed],
  bookingStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending'
  },
  amount: { type: Number, required: true }
});

const hotelBookingSchema = new mongoose.Schema({
  hotelCode: { type: String, required: true },
  searchId: { type: String, required: true },
  groupCode: { type: String, required: true },
  rateKey: { type: String, required: true },
  checkin: { type: Date, required: true },
  checkout: { type: Date, required: true },
  bookingStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending'
  },
  bookingResponse: mongoose.Schema.Types.Mixed,
  amount: { type: Number, required: true }
});

const transferBookingSchema = new mongoose.Schema({
  quotationId: { type: String, required: true },
  bookingDate: { type: Date, required: true },
  bookingTime: { type: String, required: true },
  totalPassenger: { type: Number, required: true },
  bookingStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending'
  },
  bookingResponse: mongoose.Schema.Types.Mixed,
  amount: { type: Number, required: true }
});

const flightBookingSchema = new mongoose.Schema({
  flightCode: { type: String, required: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  departureDate: { type: Date, required: true },
  departureTime: { type: String, required: true },
  bookingStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending'
  },
  bookingResponse: mongoose.Schema.Types.Mixed,
  amount: { type: Number, required: true }
});

const itineraryBookingSchema = new mongoose.Schema({
  itineraryToken: { type: String, required: true },
  inquiryToken: { type: String, required: true },
  bookingDate: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'confirmed', 'failed'],
    default: 'pending'
  },
  travelers: [travelerSchema],
  activityBookings: [activityBookingSchema],
  hotelBookings: [hotelBookingSchema],
  transferBookings: [transferBookingSchema],
  flightBookings: [flightBookingSchema],
  prices: priceSchema,
  specialRequirements: String
}, {
  timestamps: true
});

// Add indexes for faster queries
itineraryBookingSchema.index({ itineraryToken: 1 });
itineraryBookingSchema.index({ userId: 1 });
itineraryBookingSchema.index({ status: 1 });
itineraryBookingSchema.index({ bookingDate: -1 });

const ItineraryBooking = mongoose.model('ItineraryBooking', itineraryBookingSchema);

module.exports = ItineraryBooking;