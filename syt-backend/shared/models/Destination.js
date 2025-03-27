// models/Destination.js

const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema({
  destination_id: { type: String, required: true },
  name: { type: String, required: true },
  city: { type: String, required: true },
  iata: { type: String, required: true },
  description: { type: String, required: true },
  lat: { type: Number, required: true },
  long: { type: Number, required: true },
  country: { type: String, required: true },
  continent: { type: String, required: true },
  ranking: { type: Number, required: true },
  rating: { type: Number, required: true },
  imageUrl: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  promoted: { type: Boolean, default: false } // Add this line
});

const Destination = mongoose.model('Destination', destinationSchema);

module.exports = Destination;
