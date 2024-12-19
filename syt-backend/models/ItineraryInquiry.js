// models/ItineraryInquiry.js
const mongoose = require("mongoose");

const itineraryInquirySchema = new mongoose.Schema({
  itineraryInquiryToken: { type: String, required: true, unique: true },
  selectedCities: [{
    destination_id: String,
    city: String,
    country: String,
    name: String,
    continent: String,
    lat: Number,
    long: Number,
    imageUrl: String,
  }],
  departureCity: {
    code: String,
    city: String,
    country: String,
    name: String,
    destination_id: Number,
  },
  departureDates: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },
  travelersDetails: {
    type: { type: String, required: true },
    rooms: [{
      adults: [String],
      children: [String]
    }],
  },
  preferences: {
    selectedInterests: [String],
    budget: String,
  },
  includeInternational: { type: Boolean, default: false },
  includeGroundTransfer: { type: Boolean, default: false },
  includeFerryTransport: { type: Boolean, default: false },
  userInfo: {
    userId: String,
    firstName: String,
    lastName: String,
    email: String,
    phoneNumber: String,
  },
}, { timestamps: true });

module.exports = mongoose.model("ItineraryInquiry", itineraryInquirySchema);