const mongoose = require('mongoose');

const CityAirportSchema = new mongoose.Schema({
  city: { type: String, required: true },
  name: { type: String, required: true },  // Airport name
  iata: { type: String, required: true },  // IATA code
  country: { type: String, required: true },
  destination_id: {type: Number, required: true}
});

const CityAirport = mongoose.model('CityAirport', CityAirportSchema);
module.exports = CityAirport;
