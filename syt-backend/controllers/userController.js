const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class UserController {
  // User Login
  async login(req, res) {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
  
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  
      const userdata = user.toObject();
      delete userdata.password;
  
      res.status(200).json({ token, user: userdata });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
  

  // User Registration
  // User Registration
async register(req, res) {
  const { firstName, lastName, email, password, confirmPassword, dob, country, phoneNumber, countryCode, referralCode } = req.body;
  try {
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password manually before saving the user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,  // Save the hashed password
      dob,
      country,
      phoneNumber,
      countryCode,
      referralCode,
    });

    await newUser.save();

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    const userdata = newUser.toObject();
    delete userdata.password;

    res.status(201).json({ token, user: userdata });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

  

  // User Logout
  async logout(req, res) {
    // Implement logout logic (e.g., invalidate token)
    res.status(200).json({ message: 'Logged out successfully' });
  }

  // Get User Profile
  async getUserProfile(req, res) {
    try {
      const user = await User.findById(req.userId).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  // Update User Profile
  async updateUserProfile(req, res) {
    const { firstName, lastName, email, dob, country, phoneNumber, countryCode, referralCode } = req.body;
    try {
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update fields
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.email = email || user.email;
      user.dob = dob || user.dob;
      user.country = country || user.country; // Update country name
      user.phoneNumber = phoneNumber || user.phoneNumber;
      user.countryCode = countryCode || user.countryCode; // Update country code
      user.referralCode = referralCode || user.referralCode;

      await user.save();
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  // Password Reset Request (Optional)
  async passwordResetRequest(req, res) {
    // Implement password reset request logic (e.g., sending reset link)
    res.status(501).json({ message: 'Password reset request not implemented' });
  }

  // Password Reset (Optional)
  async resetPassword(req, res) {
    // Implement password reset logic (e.g., updating password using reset token)
    res.status(501).json({ message: 'Password reset not implemented' });
  }
}

module.exports = new UserController();
