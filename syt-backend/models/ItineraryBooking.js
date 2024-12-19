// models/ItineraryBooking.js
const mongoose = require('mongoose');

// Schema for questions and answers in activity bookings
const questionAnswerSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  unit: String,
  travelerNum: String
}, { _id: false });

// Schema for individual travelers in activity bookings
const activityTravellerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  name: { type: String, required: true },
  surname: { type: String, required: true },
  type: { type: String, required: true },
  age: { type: String, required: true }
}, { _id: false });

// Schema for language guide in activity bookings
const languageGuideSchema = new mongoose.Schema({
  type: { type: String, required: true },
  language: { type: String, required: true },
  legacyGuide: { type: String, required: true }
}, { _id: false });

// Schema for lead traveler in activity bookings
const leadSchema = new mongoose.Schema({
  title: { type: String, required: true },
  name: { type: String, required: true },
  surname: { type: String, required: true },
  clientNationality: { type: String, required: true },
  age: { type: Number, required: true }
}, { _id: false });

// Core schemas for different types of bookings
const activityBookingSchema = new mongoose.Schema({
  searchId: { type: String, required: true },
  bookingRef: { type: String, required: true },
  activityCode: { type: String, required: true },
  bookingStatus: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled', 'failed'],
    default: 'pending'
  },
  lead: { type: leadSchema, required: true },
  agentRef: { type: String, required: true },
  rateKey: { type: String, required: true },
  fromDate: { type: String, required: true },
  toDate: { type: String, required: true },
  groupCode: { type: String, required: true },
  hotelId: { type: String, default: null },
  languageGuide: { type: languageGuideSchema, required: true },
  QuestionAnswers: [questionAnswerSchema],
  travellers: [activityTravellerSchema],
  amount: { type: Number, required: true }
}, { _id: false });

const hotelRoomSchema = new mongoose.Schema({
  paxes: [{
    title: { type: String, required: true },
    name: { type: String, required: true },
    surname: { type: String, required: true },
    type: { type: String, required: true },
    age: { type: String, required: true }
  }],
  room_reference: { type: String, required: true }
}, { _id: false });

const hotelBookingSchema = new mongoose.Schema({
  searchId: { type: String, required: true },
  hotelCode: { type: String, required: true },
  cityCode: { type: String, required: true },
  groupCode: { type: String, required: true },
  checkin: { type: String, required: true },
  checkout: { type: String, required: true },
  bookingStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'failed'],
    default: 'pending'
  },
  amount: { type: Number, required: true },
  holder: {
    title: { type: String, required: true },
    name: { type: String, required: true },
    surname: { type: String, required: true },
    email: { type: String, required: true },
    phone_number: { type: String, required: true },
    client_nationality: { type: String, required: true }
  },
  booking_comments: { type: String },
  payment_type: { type: String },
  agent_reference: { type: String, required: true },
  booking_items: [{
    rate_key: { type: String, required: true },
    room_code: { type: String, required: true },
    rooms: [hotelRoomSchema]
  }]
}, { _id: false });

const transferBookingSchema = new mongoose.Schema({
  quotationId: { type: String, required: true },
  bookingDate: { type: String, required: true },
  bookingTime: { type: String, required: true },
  returnDate: { type: String },
  returnTime: { type: String },
  totalPassenger: { type: Number, required: true },
  bookingStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'failed'],
    default: 'pending'
  },
  amount: { type: mongoose.Schema.Types.Mixed, required: true },
  quotationChildId: String,
  comments: String,
  flightNumber: String,
  origin: {
    address: { type: String, required: true },
    city: { type: String, required: true }
  },
  destination: {
    address: { type: String, required: true },
    city: { type: String, required: true }
  }
}, { _id: false });

const flightPassengerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  dateOfBirth: { type: String, required: true },
  passportNumber: { type: String, required: true },
  nationality: { type: String, required: true },
  type: { type: String, required: true }
}, { _id: false });

const flightBookingSchema = new mongoose.Schema({
  flightCode: { type: String, required: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  departureDate: { type: String, required: true },
  departureTime: { type: String, required: true },
  returnFlightCode: String,
  returnDepartureDate: String,
  returnDepartureTime: String,
  bookingStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'failed'],
    default: 'pending'
  },
  amount: { type: Number, required: true },
  passengers: [flightPassengerSchema]
}, { _id: false });

// Main schema for the entire booking
const itineraryBookingSchema = new mongoose.Schema({
  itineraryToken: { type: String, required: true, index: true },
  inquiryToken: { type: String, required: true },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  bookingDate: { 
    type: Date, 
    default: Date.now,
    index: true 
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'confirmed', 'cancelled', 'failed'],
    default: 'pending',
    index: true
  },
  travelers: [{
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
    type: { type: String, required: true }
  }],
  activityBookings: [activityBookingSchema],
  hotelBookings: [hotelBookingSchema],
  transferBookings: [transferBookingSchema],
  flightBookings: [flightBookingSchema],
  prices: {
    activities: { type: Number, required: true },
    hotels: { type: Number, required: true },
    flights: { type: Number, required: true },
    transfers: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    tcsRate: { type: Number, required: true },
    tcsAmount: { type: Number, required: true },
    grandTotal: { type: Number, required: true }
  },
  specialRequirements: { type: String, default: '' }
}, {
  timestamps: true
});

// Add compound indexes for common queries
itineraryBookingSchema.index({ userId: 1, status: 1 });
itineraryBookingSchema.index({ userId: 1, bookingDate: -1 });

const ItineraryBooking = mongoose.model('ItineraryBooking', itineraryBookingSchema);

module.exports = ItineraryBooking;