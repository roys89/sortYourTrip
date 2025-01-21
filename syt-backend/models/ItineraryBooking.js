// models/ItineraryBooking.js
const mongoose = require('mongoose');

// Common reusable schemas
const commonFields = {
  bookingStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'failed'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

// General Traveler Schema
const travellerSchema = new mongoose.Schema({
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
}, { _id: false });

// Hotel Booking Related Schemas
const hotelGuestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  isLeadGuest: { type: Boolean, required: true },
  type: { type: String, required: true },
  email: { type: String, required: true },
  isdCode: { type: String, required: true },
  contactNumber: { type: String, required: true },
  panCardNumber: String,
  passportNumber: String,
  passportExpiry: String
}, { _id: false });

const roomAllocationSchema = new mongoose.Schema({
  rateId: { type: String, required: true },
  roomId: { type: String, required: true },
  guests: [hotelGuestSchema]
}, { _id: false });

const hotelCancellationPolicySchema = new mongoose.Schema({
  deadline: String,
  amount: Number,
  type: String
}, { _id: false });

const hotelBoardBasisSchema = new mongoose.Schema({
  description: String,
  type: String
}, { _id: false });

const hotelAddressSchema = new mongoose.Schema({
  line1: String,
  city: String,
  country: String
}, { _id: false });

const hotelDetailsSchema = new mongoose.Schema({
  name: String,
  category: String,
  address: hotelAddressSchema,
  geolocation: {
    lat: String,
    long: String
  },
  starRating: String
}, { _id: false });

const hotelBookingSchema = new mongoose.Schema({
  traceId: { type: String, required: true },
  roomsAllocations: [roomAllocationSchema],
  specialRequests: String,
  itineraryCode: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  cityCode: { type: String, required: true },
  checkin: { type: String, required: true },
  checkout: { type: String, required: true },
  cancellationPolicies: [hotelCancellationPolicySchema],
  boardBasis: hotelBoardBasisSchema,
  hotelDetails: hotelDetailsSchema,
  includes: [String],
  additionalCharges: [{
    type: String,
    description: String,
    amount: Number
  }],
  ...commonFields
}, { _id: false });

// Transfer Booking Related Schemas
const guestDetailsSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true }
}, { _id: false });

const locationCoordinatesSchema = new mongoose.Schema({
  lat: Number,
  long: Number
}, { _id: false });

const locationSchema = new mongoose.Schema({
  address: String,
  coordinates: locationCoordinatesSchema
}, { _id: false });

const vehicleDetailsSchema = new mongoose.Schema({
  class: String,
  capacity: String,
  type: String,
  similar_types: String,
  luggage_capacity: String,
  tags: [String],
  vehicle_image: String
}, { _id: false });

const routeDetailsSchema = new mongoose.Schema({
  distance: String,
  duration: Number,
  pickup_location: locationSchema,
  dropoff_location: locationSchema
}, { _id: false });

const transferBookingSchema = new mongoose.Schema({
  booking_date: { type: String, required: true },
  booking_time: { type: String, required: true },
  return_date: String,
  return_time: String,
  guest_details: guestDetailsSchema,
  quotation_id: { type: String, required: true },
  quotation_child_id: String,
  comments: String,
  total_passenger: { type: Number, required: true },
  flight_number: String,
  vehicleDetails: vehicleDetailsSchema,
  routeDetails: routeDetailsSchema,
  amount: { type: mongoose.Schema.Types.Mixed, required: true },
  fareDetails: {
    baseFare: Number,
    taxes: Number,
    fees: Number
  },
  ...commonFields
}, { _id: false });

// Activity Booking Related Schemas
const questionAnswerSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  unit: String,
  travelerNum: String
}, { _id: false });

const activityTravellerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  name: { type: String, required: true },
  surname: { type: String, required: true },
  type: { type: String, required: true },
  age: { type: String, required: true }
}, { _id: false });

const languageGuideSchema = new mongoose.Schema({
  type: { type: String, required: true },
  language: { type: String, required: true },
  legacyGuide: { type: String, required: true }
}, { _id: false });

const leadSchema = new mongoose.Schema({
  title: { type: String, required: true },
  name: { type: String, required: true },
  surname: { type: String, required: true },
  clientNationality: { type: String, required: true },
  age: { type: Number, required: true }
}, { _id: false });

const activityBookingSchema = new mongoose.Schema({
  searchId: { type: String, required: true },
  bookingRef: { type: String, required: true },
  activityCode: { type: String, required: true },
  lead: { type: leadSchema, required: true },
  agentRef: { type: String, required: true },
  rateKey: { type: String, required: true },
  fromDate: { type: String, required: true },
  toDate: { type: String, required: true },
  groupCode: { type: String, required: true },
  hotelId: String,
  languageGuide: languageGuideSchema,
  QuestionAnswers: [questionAnswerSchema],
  travellers: [activityTravellerSchema],
  amount: { type: Number, required: true },
  packageDetails: {
    title: String,
    description: String,
    departureTime: String,
    duration: Number,
    inclusions: [String],
    exclusions: [String]
  },
  cancellationPolicies: [{
    dayRangeMin: Number,
    dayRangeMax: Number,
    percentageRefundable: Number
  }],
  ...commonFields
}, { _id: false });

// Flight Booking Related Schemas
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
  amount: { type: Number, required: true },
  passengers: [flightPassengerSchema],
  fareDetails: {
    baseFare: Number,
    taxAndSurcharge: Number,
    serviceFee: Number,
    isRefundable: Boolean
  },
  baggage: {
    checkedBaggage: String,
    cabinBaggage: String
  },
  segmentDetails: [{
    flightNumber: String,
    airline: {
      code: String,
      name: String
    },
    departureTime: String,
    arrivalTime: String,
    duration: Number
  }],
  ...commonFields
}, { _id: false });

// Main ItineraryBooking Schema
const itineraryBookingSchema = new mongoose.Schema({
  bookingId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  itineraryToken: { type: String, required: true, index: true },
  inquiryToken: { type: String, required: true },
  userInfo: {
    userId: { type: String, allow: null },
    firstName: { type: String, allow: null },
    lastName: { type: String, allow: null },
    email: { type: String, allow: null },
    phoneNumber: { type: String, allow: null }
  },
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
  travelersDetails: {
    type: { 
      type: String, 
      default: 'family' 
    },
    rooms: [{
      adults: [String],
      children: [String]
    }]
  },
  travelers: [travellerSchema],
  hotelBookings: [hotelBookingSchema],
  transferBookings: [transferBookingSchema],
  activityBookings: [activityBookingSchema],
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

// Indexes for common queries
itineraryBookingSchema.index({ userId: 1, status: 1 });
itineraryBookingSchema.index({ userId: 1, bookingDate: -1 });
itineraryBookingSchema.index({ 'hotelBookings.traceId': 1 });
itineraryBookingSchema.index({ 'transferBookings.quotation_id': 1 });
itineraryBookingSchema.index({ 'activityBookings.bookingRef': 1 });
itineraryBookingSchema.index({ 'flightBookings.flightCode': 1 });

const ItineraryBooking = mongoose.model('ItineraryBooking', itineraryBookingSchema);

module.exports = ItineraryBooking;