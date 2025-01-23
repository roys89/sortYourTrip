const mongoose = require('mongoose');

// Define sub-schemas for reusable components
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
  type: { type: String, enum: ['adult', 'child'], required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  addressLineOne: { type: String, required: true },
  addressLineTwo: String,
  city: { type: String, required: true },
  country: { type: String, required: true },
  countryCode: { type: String, required: true },
  panNumber: { type: String, required: true },
  frequentFlyerAirlineCode: String,
  frequentFlyerNumber: String,
  gstDetails: {
    gstNumber: String,
    companyName: String,
    companyAddress: String,
    companyEmail: String,
    companyContactNumber: String
  }
}, { _id: false });

const guestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  isLeadGuest: { type: Boolean, required: true },
  type: { type: String, enum: ['adult', 'child'], required: true },
  email: { type: String, required: true },
  isdCode: { type: String, required: true },
  contactNumber: { type: String, required: true },
  panCardNumber: String,
  passportNumber: { type: String, required: true },
  passportExpiry: { type: String, required: true },
  addressLineOne: { type: String, required: true },
  addressLineTwo: String,
  city: { type: String, required: true },
  countryCode: { type: String, required: true },
  nationality: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  gstDetails: {
    gstNumber: String,
    companyName: String,
    companyAddress: String,
    companyEmail: String,
    companyContactNumber: String
  }
}, { _id: false });

const roomAllocationSchema = new mongoose.Schema({
  rateId: { type: String, required: true },
  roomId: { type: String, required: true },
  guests: [guestSchema]
}, { _id: false });

const hotelBookingSchema = new mongoose.Schema({
  hotelId: { type: String, required: true },
  city: { type: String, required: true },
  checkin: { type: String, required: true },
  checkout: { type: String, required: true },
  bookingStatus: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'failed'], default: 'pending' },
  itineraryCode: { type: String, required: true },
  bookingArray: [{
    traceId: { type: String, required: true },
    roomsAllocations: [roomAllocationSchema],
    specialRequests: String
  }]
}, { _id: false });

const transferGuestDetailsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  nationality: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  addressLineOne: { type: String, required: true },
  addressLineTwo: String,
  city: { type: String, required: true },
  country: { type: String, required: true },
  countryCode: { type: String, required: true }
}, { _id: false });

const transferBookingSchema = new mongoose.Schema({
  type: { type: String, required: true },
  transferId: { type: String, required: true },
  bookingDate: { type: String, required: true },
  bookingTime: { type: String, required: true },
  returnDate: String,
  returnTime: String,
  bookingArray: [{
    booking_date: { type: String, required: true },
    booking_time: { type: String, required: true },
    return_date: String,
    return_time: String,
    guest_details: transferGuestDetailsSchema,
    quotation_id: { type: String, required: true },
    quotation_child_id: Number,
    comments: String,
    total_passenger: { type: Number, required: true },
    flight_number: String
  }]
}, { _id: false });

const activityTravellerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  name: { type: String, required: true },
  surname: { type: String, required: true },
  type: { type: String, enum: ['adult', 'child', 'youth'], required: true },
  age: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  nationality: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  addressLineOne: { type: String, required: true },
  addressLineTwo: String,
  city: { type: String, required: true },
  country: { type: String, required: true },
  countryCode: { type: String, required: true }
}, { _id: false });

const activityBookingSchema = new mongoose.Schema({
  searchId: { type: String, required: true },
  bookingRef: { type: String, required: true },
  activityCode: { type: String, required: true },
  bookingStatus: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'failed'], default: 'pending' },
  lead: {
    title: { type: String, required: true },
    name: { type: String, required: true },
    surname: { type: String, required: true },
    clientNationality: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    addressLineOne: { type: String, required: true },
    addressLineTwo: String,
    city: { type: String, required: true },
    country: { type: String, required: true },
    countryCode: { type: String, required: true }
  },
  agentRef: { type: String, required: true },
  rateKey: { type: String, required: true },
  fromDate: { type: String, required: true },
  toDate: { type: String, required: true },
  groupCode: { type: String, required: true },
  hotelId: String,
  languageGuide: {
    type: { type: String, required: true },
    language: { type: String, required: true },
    legacyGuide: { type: String, required: true }
  },
  QuestionAnswers: [{
    question: { type: String, required: true },
    answer: { type: String, required: true },
    unit: String,
    travelerNum: String
  }],
  travellers: [activityTravellerSchema]
}, { _id: false });

const flightPassengerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  passportNumber: { type: String, required: true },
  passportExpiry: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  isLeadPax: { type: Boolean, required: true },
  paxType: { type: Number, enum: [1, 2], required: true },
  addressLineOne: { type: String, required: true },
  addressLineTwo: String,
  city: { type: String, required: true },
  contactNumber: { type: String, required: true },
  countryCode: { type: String, required: true },
  countryName: { type: String, required: true },
  dateOfBirth: { type: String, required: true },
  email: { type: String, required: true },
  frequentFlyerAirlineCode: String,
  frequentFlyerNumber: String,
  nationality: { type: String, required: true },
  ssr: {
    meal: [{
      origin: String,
      destination: String,
      code: String,
      amt: Number,
      description: String
    }],
    baggage: [{
      origin: String,
      destination: String,
      code: String,
      amt: Number,
      description: String
    }],
    seat: [{
      origin: String,
      destination: String,
      code: String,
      amt: Number,
      seat: String
    }]
  }
}, { _id: false });

const flightBookingSchema = new mongoose.Schema({
  bookingArray: [{
    traceId: { type: String, required: true },
    passengers: [flightPassengerSchema]
  }],
  itineraryCode: { type: String, required: true },
  flightCode: { type: String, required: true },
  bookingStatus: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'failed'], default: 'pending' },
  departureTime: { type: String, required: true },
  departureDate: { type: String, required: true },
  destination: { type: String, required: true },
  origin: { type: String, required: true },
  landingTime: { type: String, required: true },
  arrivalTime: { type: String, required: true },
  airline: { type: String, required: true },
  resultIndex: { type: String, required: true },
  flightDuration: { type: String, required: true },
  traceId: { type: String, required: true }
}, { _id: false });

// Main ItineraryBooking Schema
const itineraryBookingSchema = new mongoose.Schema({
  bookingId: { 
    type: String, 
    required: true,
    unique: true,
    index: true
  },
  itineraryToken: { type: String, required: true },
  inquiryToken: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'confirmed', 'cancelled', 'failed'],
    default: 'pending'
  },
  bookingDate: { type: Date, required: true },
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
  specialRequirements: String,
  travelersDetails: {
    type: { type: String, default: 'family' },
    rooms: [{
      adults: [String],
      children: [String]
    }]
  },
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

// Add indexes for common queries
itineraryBookingSchema.index({ 'userInfo.userId': 1, bookingDate: -1 });
itineraryBookingSchema.index({ status: 1 });
itineraryBookingSchema.index({ itineraryToken: 1 });

const ItineraryBooking = mongoose.model('ItineraryBooking', itineraryBookingSchema);

module.exports = ItineraryBooking;