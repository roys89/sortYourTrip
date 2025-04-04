// crm/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define schema but don't create model yet - we'll create it with the CRM connection
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  permissions: {
    canAddLead: {
      type: Boolean,
      default: false
    },
    canRemoveLead: {
      type: Boolean,
      default: false
    },
    canViewLeads: {
      type: Boolean,
      default: true
    },
    canAddUser: {
      type: Boolean,
      default: false
    },
    canRemoveUser: {
      type: Boolean,
      default: false
    },
    bookings: {
      type: Boolean,
      default: false
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Password hashing middleware
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Export a function that takes a connection and returns a model
module.exports = (connection) => {
  // Create the model using the provided connection
  return connection.model('CRMUser', UserSchema);
};