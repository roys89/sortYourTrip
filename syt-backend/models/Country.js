const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  continent: { type: String, required: true },
  neighboringCountries: [{ type: String, required: true }], // Array of neighboring country names
  status: { type: Boolean, default: true },
});

module.exports = mongoose.model('Country', countrySchema);
