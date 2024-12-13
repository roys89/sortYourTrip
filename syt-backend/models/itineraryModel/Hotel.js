const mongoose = require('mongoose');

// Define the Hotel schema
const hotelSchema = new mongoose.Schema({
  hotelCode: { type: String, required: true, unique: true },
  hotelName: { type: String, required: true },
  description: { type: String },
  cityCode: { type: String, required: true },
  destinationCode: { type: String },
  countryCode: { type: String, required: true },
  starCategory: { type: Number },
  address: { type: String },
  postalCode: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  accommodationType: { type: String },
  accommodationTypeSubName: { type: String },
  chainName: { type: String },
  featured: { type: Boolean, default: false },
});

// Create and export the Hotel model
const Hotel = mongoose.model('Hotel', hotelSchema);
module.exports = Hotel;
