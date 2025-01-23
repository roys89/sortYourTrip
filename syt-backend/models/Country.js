const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  countryCode: { type: String, required: true },
  nationality: { type: String, required: true }, // Added this field
  continent: { type: String, required: true },
  neighboringCountries: [{ type: String, required: true }],
  status: { type: Boolean, default: true },
});

module.exports = mongoose.model('Country', countrySchema);