const mongoose = require('mongoose');

// Define the HotelCity schema
const hotelCitySchema = new mongoose.Schema({
  cityCode: {
    type: String,
    required: true,
    unique: true,
  },
  cityName: {
    type: String,
    required: true,
  },
  countryCode: {
    type: String,
    required: true,
  },
});

// Create and export the HotelCity model
const HotelCity = mongoose.model('HotelCity', hotelCitySchema);
module.exports = HotelCity;
