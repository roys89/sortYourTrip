const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Variant Schema for image variants
const VariantSchema = new Schema({
  height: Number,
  width: Number,
  url: String
}, { _id: false });

// Image Schema
const ImageSchema = new Schema({
  imageSource: String,
  caption: String,
  isCover: Boolean,
  variants: [VariantSchema]
}, { _id: false });

// Booking Question Schema
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

// Language Service Schema
const LangServiceSchema = new Schema({
  type: String,
  language: String,
  legacyGuide: String
}, { _id: false });

// Tour Grade Schema
const TourGradeSchema = new Schema({
  gradeCode: String,
  encryptgradeCode: String,
  description: String,
  langServices: [LangServiceSchema]
}, { _id: false });

// Age Band Schema
const AgeBandSchema = new Schema({
  ageBand: String,
  startAge: Number,
  endAge: Number,
  minTravelersPerBooking: Number,
  maxTravelersPerBooking: Number
}, { _id: false });

// Booking Requirements Schema
const BookingRequirementsSchema = new Schema({
  minTravelersPerBooking: Number,
  maxTravelersPerBooking: Number,
  requiresAdultForBooking: Boolean
}, { _id: false });

// Package Details Schema
const PackageDetailsSchema = new Schema({
  amount: Number,
  currency: String,
  ratekey: String,
  title: String,
  departureTime: String,
  description: String
}, { _id: false });

// Itinerary Item Schema
const ItineraryItemSchema = new Schema({
  pointOfInterestLocation: Schema.Types.Mixed,
  duration: String,
  passByWithoutStopping: Boolean,
  admissionIncluded: Boolean,
  description: String,
  name: String,
  stopduration: String
}, { _id: false });

// Itinerary Schema
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

// Additional Info Schema
const AdditionalInfoSchema = new Schema({
  type: String,
  description: String
}, { _id: false });

// Cancellation Schema
const CancellationSchema = new Schema({
  dayRangeMin: Number,
  percentageRefundable: Number,
  dayRangeMax: Number
}, { _id: false });

// Activity Schema - Modified to accept strings for inclusions and exclusions
const ActivitySchema = new Schema({
  activityType: String,
  activityCode: String,
  activityName: String,
  lat: Number,
  long: Number,
  searchId: String,  // Added searchId field
  packageDetails: PackageDetailsSchema,
  images: [ImageSchema],
  description: String,
  inclusions: {
    type: Schema.Types.Mixed,
    default: ''
  },
  exclusions: {
    type: Schema.Types.Mixed,
    default: ''
  },
  itinerary: ActivityItinerarySchema,
  additionalInfo: [AdditionalInfoSchema],
  bookingQuestions: [BookingQuestionSchema],
  cancellationFromTourDate: [CancellationSchema],
  groupCode: String,
  tourGrade: TourGradeSchema,
  ageBands: [AgeBandSchema],
  bookingRequirements: BookingRequirementsSchema,
  pickupHotellist: Schema.Types.Mixed,
  bookingReference: {
    type: {
      bookingRef: String,
      priceValidUntil: String,
      timeElapsed: String,
      supplierPrice: Number,
      price: Number,
      availabilityValidUntil: String
    },
    default: null
  }
}, { _id: false });

// Transfer Schema
const TransferSchema = new Schema({
  type: Schema.Types.Mixed
}, { _id: false, strict: false });

// Flight Schema
const FlightSchema = new Schema({
  type: Schema.Types.Mixed
}, { _id: false, strict: false });

// Hotel Schema
const HotelSchema = new Schema({
  type: Schema.Types.Mixed
}, { _id: false, strict: false });


// Day Schema
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

// City Schema
const CitySchema = new Schema({
  city: String,
  cityCode: String,
  country: String,
  startDate: Date,
  endDate: Date,
  days: [DaySchema]
}, { _id: false });

// Traveler Schema
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


// Main Itinerary Schema
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
    travelersDetails: TravelersDetailsSchema,
    cities: [CitySchema],
    priceTotals: {
      type: PriceTotalsSchema,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        // Remove empty arrays to prevent _id generation
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