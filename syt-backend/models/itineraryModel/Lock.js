// models/Lock.js
const mongoose = require('mongoose');

const lockSchema = new mongoose.Schema({
  itineraryToken: {
    type: String,
    required: true,
    index: true
  },
  inquiryToken: {
    type: String,
    required: true,
    index: true
  },
  itemType: {
    type: String,
    enum: ['flight', 'hotel'],
    required: true
  },
  itemId: {
    type: String,
    required: true
  },
  referenceId: {
    type: String,
    required: true
  },
  cityName: String,
  date: Date,
  supplierReference: String,
  expiryTime: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'released'],
    default: 'active',
    index: true
  },
  supplierData: {
    type: mongoose.Schema.Types.Mixed
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Compound indices for efficient querying
lockSchema.index({ itineraryToken: 1, inquiryToken: 1 });
lockSchema.index({ itineraryToken: 1, itemType: 1, itemId: 1 });
lockSchema.index({ status: 1, expiryTime: 1 });

// Instance methods
lockSchema.methods.setExpired = async function() {
  this.status = 'expired';
  await this.save();
};

lockSchema.methods.extend = async function(additionalTime) {
  const newExpiryTime = new Date(this.expiryTime.getTime() + additionalTime);
  this.expiryTime = newExpiryTime;
  this.status = 'active';
  await this.save();
  return newExpiryTime;
};

lockSchema.methods.release = async function() {
  this.status = 'released';
  await this.save();
};

// Static methods
lockSchema.statics.findActiveLocks = function(itineraryToken, inquiryToken) {
  return this.find({
    itineraryToken,
    inquiryToken,
    status: 'active'
  });
};

lockSchema.statics.findExpiredLocks = function() {
  return this.find({
    status: 'active',
    expiryTime: { $lt: new Date() }
  });
};

lockSchema.statics.cleanupOldLocks = function(olderThan) {
  return this.deleteMany({
    status: { $in: ['expired', 'released'] },
    updatedAt: { $lt: olderThan }
  });
};

const Lock = mongoose.model('Lock', lockSchema);

module.exports = Lock;