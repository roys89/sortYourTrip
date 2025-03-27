// crm/models/Lead.js
const mongoose = require('mongoose');

// Define schema but don't create model yet
const LeadSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
    default: 'new'
  },
  source: {
    type: String,
    enum: ['website', 'referral', 'social_media', 'email_campaign', 'other'],
    default: 'website'
  },
  notes: {
    type: String
  },
  itineraryPreferences: {
    destination: String,
    budget: Number,
    travelDates: {
      start: Date,
      end: Date
    },
    numberOfTravelers: Number,
    accommodationPreference: String,
    activities: [String]
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CRMUser'  // Updated to match the new model name
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Export a function that takes a connection and returns a model
module.exports = (connection) => {
  // Create the model using the provided connection
  return connection.model('Lead', LeadSchema);
};