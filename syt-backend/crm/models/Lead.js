// crm/models/Lead.js
const mongoose = require('mongoose');

// Define schema but don't create model yet
const LeadSchema = new mongoose.Schema({
  // User reference for website leads
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // References the B2C User model
    required: false
  },
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
  leadType: {
    type: String,
    enum: ['website', 'updated', 'ad'],
    default: 'website'
  },
  source: {
    type: String,
    enum: ['website', 'referral', 'social_media', 'email_campaign', 'other'],
    default: 'website'
  },
  // References to inquiries and itineraries
  inquiries: [{
    inquiryToken: String,
    createdAt: Date
  }],
  itineraries: [{
    itineraryToken: String,
    createdAt: Date
  }],
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
    ref: 'CRMUser'
  },
  assignedAt: {
    type: Date
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

// Update timestamps on save
LeadSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Export a function that takes a connection and returns a model
module.exports = (connection) => {
  // Create the model using the provided connection
  return connection.model('Lead', LeadSchema);
};