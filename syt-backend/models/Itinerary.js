const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Variant Schema for image variants (unchanged)
const VariantSchema = new Schema({
  height: Number,
  width: Number,
  url: String
}, { _id: false });

// Updated Image Schema to match activityController return
const ImageSchema = new Schema({
  imageSource: String,
  caption: String,
  isCover: Boolean,
  variants: [VariantSchema]
}, { _id: false });

// Booking Question Schema (unchanged)
const BookingQuestionSchema = new Schema({
  sortOrder: Number,
  questionId: Number,
  stringQuestionId: String,
  subTitle: String,
  title: String,
  required: Boolean,
  message: String,
  allowedAnswers: [String]
}, { _id: false });

// Language Service Schema (unchanged)
const LangServiceSchema = new Schema({
  type: String,
  language: String,
  legacyGuide: String
}, { _id: false });

// Tour Grade Schema (unchanged)
const TourGradeSchema = new Schema({
  gradeCode: String,
  encryptgradeCode: String,
  description: String,
  langServices: [LangServiceSchema]
}, { _id: false });

// Age Band Schema (unchanged)
const AgeBandSchema = new Schema({
  ageBand: String,
  startAge: Number,
  endAge: Number,
  minTravelersPerBooking: Number,
  maxTravelersPerBooking: Number
}, { _id: false });

// Booking Requirements Schema (unchanged)
const BookingRequirementsSchema = new Schema({
  minTravelersPerBooking: Number,
  maxTravelersPerBooking: Number,
  requiresAdultForBooking: Boolean
}, { _id: false });

// Departure Time Schema (new)
const DepartureTimeSchema = new Schema({
  time: String,
  code: String
}, { _id: false });

// Package Details Schema (updated to match activityController)
const PackageDetailsSchema = new Schema({
  amount: Number,
  currency: String,
  ratekey: String,
  title: String,
  departureTime: String,
  description: String
}, { _id: false });

// Itinerary Item Schema (unchanged)
const ItineraryItemSchema = new Schema({
  pointOfInterestLocation: Schema.Types.Mixed,
  duration: String,
  passByWithoutStopping: Boolean,
  admissionIncluded: Boolean,
  description: String,
  name: String,
  stopduration: String
}, { _id: false });

// Itinerary Schema (unchanged)
const ActivityItinerarySchema = new Schema({
  itineraryType: String,
  skipTheLine: Boolean,
  privateTour: Boolean,
  duration: String,
  itineraryItems: [ItineraryItemSchema],
  unstructuredDescription: String,
  unstructuredItinerary: String,
  activityInfo: Schema.Types.Mixed,
  foodMenus: Schema.Types.Mixed,
  days: Schema.Types.Mixed,
  routes: Schema.Types.Mixed
}, { _id: false });

// Additional Info Schema (unchanged)
const AdditionalInfoSchema = new Schema({
  type: String,
  description: String
}, { _id: false });

// Cancellation Schema (unchanged)
const CancellationSchema = new Schema({
  dayRangeMin: Number,
  percentageRefundable: Number,
  dayRangeMax: Number
}, { _id: false });

const BookingReferenceSchema = new Schema({
  bookingRef: { 
    type: String, 
    trim: true 
  },
  priceValidUntil: { 
    type: Date, 
    default: null 
  },
  timeElapsed: { 
    type: String, 
    trim: true 
  },
  supplierPrice: { 
    type: Number 
  },
  price: { 
    type: Number 
  },
  availabilityValidUntil: { 
    type: Date, 
    default: null 
  }
}, { _id: false });

// Updated Activity Schema to match activityController return
const ActivitySchema = new Schema({
  searchId: String,
  activityType: {
    type: String,
    enum: ['online', 'offline']
  },
  activityProvider: String,
  activityCode: String,
  activityName: String,
  lat: Number,
  long: Number,
  selectedTime: String,
  endTime: String,  // Added endTime field
  timeSlot: String,
  isFlexibleTiming: Boolean,
  departureTime: DepartureTimeSchema,
  duration: Number,
  
  // Location details for offline activities
  street: String,
  city: String,
  state: String,
  country: String,
  continent: String,
  postalCode: String,
  fullAddress: String,
  
  // Activity details
  description: String,
  inclusions: Schema.Types.Mixed,
  exclusions: Schema.Types.Mixed,
  
  // Package and pricing
  packageDetails: PackageDetailsSchema,
  
  // Additional details from activityController
  images: [ImageSchema],
  itinerary: ActivityItinerarySchema,
  additionalInfo: [AdditionalInfoSchema],
  bookingQuestions: [BookingQuestionSchema],
  cancellationFromTourDate: [CancellationSchema],
  
  // Tour and booking specifics
  groupCode: String,
  tourGrade: TourGradeSchema,
  ageBands: [AgeBandSchema],
  bookingRequirements: BookingRequirementsSchema,
  
  // Additional metadata
  budget: String,
  openTime: String,
  closeTime: String,
  activityPeriod: String,
  category: String,
  imageUrl: String,
  rating: Number,
  ranking: Number,
  preference: [String],
  mandatory: Boolean,
  
  // Pickup and availability
  pickupHotellist: Schema.Types.Mixed,
  availabilityDetails: Schema.Types.Mixed,

  bookingReference: BookingReferenceSchema,

}, { _id: false });

// Transfer, Flight, and Hotel Schemas remain unchanged
const TransferSchema = new Schema({
  type: Schema.Types.Mixed
}, { _id: false, strict: false });

const FlightSchema = new Schema({
  type: Schema.Types.Mixed  
}, { _id: false, strict: false });

const HotelSchema = new Schema({
  type: Schema.Types.Mixed
}, { _id: false, strict: false });

// Day Schema (unchanged)
const DaySchema = new Schema({
  date: String,
  flights: {
    type: [FlightSchema],
    default: undefined
  },
  hotels: {
    type: [HotelSchema],
    default: undefined
  },
  activities: {
    type: [ActivitySchema],
    default: undefined
  },
  transfers: {
    type: [TransferSchema],
    default: undefined
  }
}, { _id: false });

// City Schema (unchanged)
const CitySchema = new Schema({
  city: String,
  cityCode: String,
  country: String,
  startDate: Date,
  endDate: Date,
  days: [DaySchema]
}, { _id: false });

// Travelers Details Schema (unchanged)
const TravelersDetailsSchema = new Schema({
  type: String,
  rooms: [{
    adults: [String],
    children: [String],
    _id: Schema.Types.ObjectId
  }],
  soloAge: String,
  coupleAdult1Age: String,
  coupleAdult2Age: String
}, { _id: false });

// Price Schema
const PriceTotalsSchema = new Schema({
  activities: Number,
  hotels: Number,
  flights: Number,
  transfers: Number,
  subtotal: Number,
  tcsAmount: Number,
  tcsRate: Number,
  grandTotal: Number
}, { _id: false });

// User Schema
const UserInfoSchema = new Schema({
  userId: String,
  firstName: String,
  lastName: String,
  email: String,
  phoneNumber: String
}, { _id: false });

// Main Itinerary Schema (unchanged)
const ItinerarySchema = new Schema(
  {
    itineraryToken: {
      type: String,
      required: true,
      unique: true
    },
    inquiryToken: {
      type: String,
      required: true
    },
    userInfo: UserInfoSchema,  // Add this field
    travelersDetails: TravelersDetailsSchema,
    cities: [CitySchema],
    priceTotals: {
      type: PriceTotalsSchema,
      default: null
    },
    changeHistory: [{
      type: {
        type: String,
        enum: ['HOTEL_CHANGE', 'FLIGHT_CHANGE', 'ACTIVITY_CHANGE'],
      },
      details: Schema.Types.Mixed,
      changedAt: { type: Date, default: Date.now }
    }]
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        // Keep existing array cleanup logic
        for (const city of ret.cities || []) {
          for (const day of city.days || []) {
            if (Array.isArray(day.transfers) && day.transfers.length === 0) {
              delete day.transfers;
            }
            if (Array.isArray(day.flights) && day.flights.length === 0) {
              delete day.flights;
            }
            if (Array.isArray(day.hotels) && day.hotels.length === 0) {
              delete day.hotels;
            }
            if (Array.isArray(day.activities) && day.activities.length === 0) {
              delete day.activities;
            }
          }
        }
      }
    }
  }
);

// Indexes
ItinerarySchema.index({ itineraryToken: 1 });
ItinerarySchema.index({ inquiryToken: 1 });

module.exports = mongoose.model('Itinerary', ItinerarySchema);