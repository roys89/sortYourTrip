const mongoose = require('mongoose');

const hotelCountrySchema = new mongoose.Schema({
  countryCode2Letter: {
    type: String,
    required: true,
    maxlength: 2
  },
  countryCode3Letter: {
    type: String,
    required: true,
    maxlength: 3
  },
  countryName: {
    type: String,
    required: true
  }
});

const HotelCountry = mongoose.model('HotelCountry', hotelCountrySchema);

module.exports = HotelCountry;
