const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  dob: { type: Date, required: true },
  country: { type: String },  // Country field is here
  referralCode: { type: String },
  phoneNumber: { type: String, required: true },
  countryCode: { type: String }, // Removed required: true, as it might not be directly provided by CRM
  isLoggedIn: { type: Boolean, default: false }, // User login status
  accountStatus: { // New field to track account setup status
    type: String,
    enum: ['active', 'needs_password_setup'],
    default: 'needs_password_setup'
  },
  // --- Fields for Password Reset/Setup ---
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date }
  // -------------------------------------
}, { timestamps: true }); // Added timestamps for createdAt/updatedAt


module.exports = mongoose.model('User', userSchema);
