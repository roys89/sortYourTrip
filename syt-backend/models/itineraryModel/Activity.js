const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  activityCode: { type: String, required: true },
  duration: { type: String, required: true }, // Duration in hours
  activityType: { type: String, enum: ['offline', 'online'], required: true },
  activityProvider: { type: String, required: true },
  activityName: { type: String, required: true },
  street: { type: String},
  city: { type: String, required: true },
  destinationCode: { type: String, required: true },
  state: { type: String},
  country: { type: String, required: true },
  continent: { type: String, required: true },
  postalCode: { type: String},
  lat: { type: Number},
  long: { type: Number},
  budget: { type: String, required: true },
  timeSlot: { type: String, required: true }, // e.g. 'Morning', 'Afternoon', 'Evening'
  openTime: {
    monday: String, tuesday: String, wednesday: String, thursday: String, friday: String, saturday: String, sunday: String,
  },
  closeTime: {
    monday: String, tuesday: String, wednesday: String, thursday: String, friday: String, saturday: String, sunday: String,
  },
  activityPeriod: { type: String, required: true }, // e.g. 'Seasonal', 'Year-round'
  category: { type: String, required: true },
  imageUrl: { type: String, required: true },
  rating: { type: Number, required: true, min: 0, max: 5 },
  ranking: { type: Number, required: true },
  preference: { type: String, required: true },
  mandatory: { type: Boolean, default: false },
  fullAddress: { type: String, required: true },
  description: { type: String},
  inclusion: { type: String },
  exclusion: { type: String }
});

module.exports = mongoose.model('Activity', activitySchema);
