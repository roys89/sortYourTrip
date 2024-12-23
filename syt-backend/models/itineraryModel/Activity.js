const mongoose = require('mongoose');

const departureTimeSchema = new mongoose.Schema({
  code: { type: String, required: true },
  time: { type: String, required: true }, // 24-hour format e.g. "09:00"
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' }
}, { _id: false });

const itineraryItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  stopduration: { type: String }
}, { _id: false });

const inclusionExclusionSchema = new mongoose.Schema({
  category: { type: String, required: true },
  categoryDescription: { type: String },
  type: { type: String, required: true },
  typeDescription: { type: String },
  otherDescription: { type: String }
}, { _id: false });

const activitySchema = new mongoose.Schema({
  activityCode: { type: String, required: true },
  duration: { type: Number, required: true }, // Duration in hours
  activityType: { type: String, enum: ['offline', 'online'], required: true },
  activityProvider: { type: String, required: true },
  activityName: { type: String, required: true },
  street: { type: String },
  city: { type: String, required: true },
  destinationCode: { type: String, required: true },
  state: { type: String },
  country: { type: String, required: true },
  continent: { type: String, required: true },
  postalCode: { type: String },
  lat: { type: Number },
  long: { type: Number },
  budget: { type: String, required: true },
  timeSlot: { type: String, required: true }, // 'Morning', 'Afternoon', 'Evening', 'Night'
  isFlexibleTiming: { type: Boolean, default: false },
  departureTimes: [departureTimeSchema],
  activityPeriod: { type: String, required: true },
  category: { type: String, required: true },
  imageUrl: { type: String, required: true },
  rating: { type: Number, required: true, min: 0, max: 5 },
  ranking: { type: Number, required: true },
  preference: { type: String, required: true },
  mandatory: { type: Boolean, default: false },
  fullAddress: { type: String, required: true },
  description: { type: String },
  inclusions: [inclusionExclusionSchema],
  exclusions: [inclusionExclusionSchema],
  itineraryItems: [itineraryItemSchema]
});

activitySchema.index({ destinationCode: 1, activityCode: 1 });
activitySchema.index({ timeSlot: 1, duration: 1 });

module.exports = mongoose.model('Activity', activitySchema);