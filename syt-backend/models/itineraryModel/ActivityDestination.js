const mongoose = require('mongoose');

// Define schema for activity destinations
const activityDestinationSchema = new mongoose.Schema({
  destination_id: {
    type: String,
    required: true,
    unique: true
  },
  destination_code: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  continent: {
    type: String,
    required: true
  }
}, { timestamps: true });

// Create the model for activity destinations
const ActivityDestination = mongoose.model('ActivityDestination', activityDestinationSchema);

module.exports = ActivityDestination;
