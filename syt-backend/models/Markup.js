// backend/models/Markup.js
const mongoose = require('mongoose');

const markupSchema = new mongoose.Schema({
  markups: {
    activities: { type: Number, required: true, default: 2 },
    hotels: { type: Number, required: true, default: 2 },
    flights: { type: Number, required: true, default: 2 },
    transfers: { type: Number, required: true, default: 2 }
  },
  tcsRates: {
    default: { type: Number, required: true, default: 15 },
    highValue: { type: Number, required: true, default: 20 },
    threshold: { type: Number, required: true, default: 700000 }
  },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Markup', markupSchema);