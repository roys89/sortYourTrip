const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dob: { type: Date, required: true },
  country: { type: String },  // Country field is here
  referralCode: { type: String },
  phoneNumber: { type: String, required: true },
  countryCode: { type: String, required: true }, // Country code field is here
  isLoggedIn: { type: Boolean, default: false }, // User login status
});


module.exports = mongoose.model('User', userSchema);
